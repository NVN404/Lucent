// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./P256.sol";
import "./ValidatorRegistry.sol";

/**
 * @title CertRegistry
 * @notice Core registry enforcing decentralized quorum certificate issuance and sovereign owner revocation.
 * @dev Verifies P-256 signatures on-chain via Monad precompile 0x0100.
 */
contract CertRegistry {
    using P256 for bytes32;

    struct Certificate {
        bytes32 certId;              // Unique certificate identifier
        bytes32 domainHash;          // keccak256 of canonical domain name
        bytes32 subjectQx;           // Domain owner's P-256 public key X
        bytes32 subjectQy;           // Domain owner's P-256 public key Y
        uint64 issuedAt;             // Timestamp of issuance
        uint64 expiresAt;            // Expiration timestamp (max 90 days)
        uint64 nonce;                // Nonce used for this certificate
        bool revoked;                // Single source of truth for revocation status
    }

    /// @notice Maximum allowed certificate validity period (90 days)
    uint64 public constant MAX_CERT_LIFETIME = 90 days;

    /// @notice Maximum window for validator approval submission (1 hour)
    uint64 public constant MAX_APPROVAL_WINDOW = 1 hours;

    /// @notice Reference to the authorized ValidatorRegistry
    ValidatorRegistry public immutable validatorRegistry;

    /// @notice Latest certificate record for each canonical domain
    mapping(bytes32 => Certificate) public certificatesByDomain;

    /// @notice Monotonically increasing sequential nonce per domain
    mapping(bytes32 => uint64) public domainNonce;

    // Events
    event CertificateIssued(
        bytes32 indexed certId,
        bytes32 indexed domainHash,
        string canonicalDomain,
        bytes32 subjectQx,
        bytes32 subjectQy,
        uint64 expiresAt,
        uint64 nonce
    );

    event CertificateRevoked(
        bytes32 indexed certId,
        bytes32 indexed domainHash,
        uint64 nonce
    );

    // Errors
    error InvalidDomain();
    error InvalidNonce();
    error InvalidExpiry();
    error StaleApproval();
    error InsufficientQuorum();
    error DuplicateSigner();
    error InactiveValidator();
    error InvalidOwnerPoP();
    error InvalidValidatorSignature();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();
    error ArrayLengthMismatch();

    constructor(address _validatorRegistry) {
        if (_validatorRegistry == address(0)) revert InactiveValidator();
        validatorRegistry = ValidatorRegistry(_validatorRegistry);
    }

    /**
     * @notice Normalizes and validates canonical domain name (RFC 1035 / RFC 5891).
     * @dev Checks for lowercase ASCII, no leading/trailing dots or whitespace.
     */
    function canonicalizeAndHash(string memory domain) public pure returns (bytes32 domainHash) {
        bytes memory b = bytes(domain);
        if (b.length == 0 || b.length > 253) revert InvalidDomain();
        if (b[0] == "." || b[b.length - 1] == ".") revert InvalidDomain();

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            // Reject uppercase ASCII [A-Z]
            if (char >= 0x41 && char <= 0x5A) revert InvalidDomain();
            // Reject whitespace or control characters
            if (char <= 0x20 || char == 0x7F) revert InvalidDomain();
        }

        return keccak256(b);
    }

    /**
     * @notice Computes the strict anti-replay digest for certificate issuance.
     */
    function computeIssuanceDigest(
        bytes32 domainHash,
        bytes32 subjectKeyHash,
        uint64 nonce,
        uint64 expiresAt,
        uint64 deadline
    ) public view returns (bytes32) {
        return sha256(
            abi.encodePacked(
                "MONADTRUST_CERT_V1",
                block.chainid,
                address(this),
                domainHash,
                subjectKeyHash,
                nonce,
                expiresAt,
                deadline
            )
        );
    }

    /**
     * @notice Computes the strict anti-replay digest for certificate revocation.
     */
    function computeRevocationDigest(
        bytes32 certId,
        bytes32 domainHash,
        uint64 nonce
    ) public view returns (bytes32) {
        return sha256(
            abi.encodePacked(
                "MONADTRUST_REVOKE_V1",
                block.chainid,
                address(this),
                certId,
                domainHash,
                nonce
            )
        );
    }

    struct IssueRequest {
        string canonicalDomain;
        bytes32 subjectQx;
        bytes32 subjectQy;
        uint64 expiresAt;
        uint64 nonce;
        uint64 deadline;
    }

    /**
     * @notice Atomically binds a domain and issues a certificate upon quorum approval and owner Proof-of-Possession.
     * @param req Certificate request parameters
     * @param ownerPoPSig Signature from domain owner key proving possession
     * @param validatorIndices Array of validator indices in ValidatorRegistry
     * @param validatorSigs Array of P-256 signatures corresponding to validatorIndices
     */
    function issueCertificate(
        IssueRequest calldata req,
        P256.Signature calldata ownerPoPSig,
        uint256[] calldata validatorIndices,
        P256.Signature[] calldata validatorSigs
    ) external returns (bytes32 certId) {
        bytes32 domainHash = canonicalizeAndHash(req.canonicalDomain);

        // 1. Sequential Nonce Check
        uint64 expectedNonce = domainNonce[domainHash] + 1;
        if (req.nonce != expectedNonce) revert InvalidNonce();
        domainNonce[domainHash] = req.nonce;

        // 2. Expiry & Deadline validation
        if (req.expiresAt <= block.timestamp || req.expiresAt > block.timestamp + MAX_CERT_LIFETIME) {
            revert InvalidExpiry();
        }
        if (block.timestamp > req.deadline || req.deadline > block.timestamp + MAX_APPROVAL_WINDOW) {
            revert StaleApproval();
        }

        // 3. Compute issuance digest
        bytes32 subjectKeyHash = P256.keyHash(req.subjectQx, req.subjectQy);
        bytes32 issuanceDigest = computeIssuanceDigest(
            domainHash,
            subjectKeyHash,
            req.nonce,
            req.expiresAt,
            req.deadline
        );

        // 4. Verify Owner Proof-of-Possession (PoP)
        bool popValid = P256.verifySignature(
            issuanceDigest,
            ownerPoPSig.r,
            ownerPoPSig.s,
            req.subjectQx,
            req.subjectQy
        );
        if (!popValid) revert InvalidOwnerPoP();

        // 5. Quorum Validation
        uint256 requiredQuorum = validatorRegistry.quorumThreshold();
        if (validatorIndices.length < requiredQuorum) revert InsufficientQuorum();
        if (validatorIndices.length != validatorSigs.length) revert ArrayLengthMismatch();

        uint256 seenValidators = 0;
        for (uint256 i = 0; i < validatorIndices.length; i++) {
            uint256 vIndex = validatorIndices[i];

            // Prevent duplicate signers
            if ((seenValidators & (uint256(1) << vIndex)) != 0) revert DuplicateSigner();
            seenValidators |= (uint256(1) << vIndex);

            (bytes32 qx, bytes32 qy, bool active) = validatorRegistry.getValidator(vIndex);
            if (!active) revert InactiveValidator();

            bool validSig = P256.verifySignature(
                issuanceDigest,
                validatorSigs[i].r,
                validatorSigs[i].s,
                qx,
                qy
            );
            if (!validSig) revert InvalidValidatorSignature();
        }

        // 6. Record Certificate
        certId = keccak256(abi.encodePacked(domainHash, subjectKeyHash, req.nonce, block.timestamp));
        certificatesByDomain[domainHash] = Certificate({
            certId: certId,
            domainHash: domainHash,
            subjectQx: req.subjectQx,
            subjectQy: req.subjectQy,
            issuedAt: uint64(block.timestamp),
            expiresAt: req.expiresAt,
            nonce: req.nonce,
            revoked: false
        });

        emit CertificateIssued(
            certId,
            domainHash,
            req.canonicalDomain,
            req.subjectQx,
            req.subjectQy,
            req.expiresAt,
            req.nonce
        );
    }

    /**
     * @notice Sovereign owner revocation of a domain certificate.
     * @param canonicalDomain Domain name
     * @param nonce Sequential nonce (must equal current domain nonce + 1)
     * @param ownerRevocationSig Signature from owner key over the revocation digest
     */
    function revokeCertificate(
        string calldata canonicalDomain,
        uint64 nonce,
        P256.Signature calldata ownerRevocationSig
    ) external {
        bytes32 domainHash = canonicalizeAndHash(canonicalDomain);
        Certificate storage cert = certificatesByDomain[domainHash];

        if (cert.certId == bytes32(0)) revert CertificateNotFound();
        if (cert.revoked) revert CertificateAlreadyRevoked();

        uint64 expectedNonce = domainNonce[domainHash] + 1;
        if (nonce != expectedNonce) revert InvalidNonce();
        domainNonce[domainHash] = nonce;

        bytes32 revokeDigest = computeRevocationDigest(cert.certId, domainHash, nonce);

        bool validSig = P256.verifySignature(
            revokeDigest,
            ownerRevocationSig.r,
            ownerRevocationSig.s,
            cert.subjectQx,
            cert.subjectQy
        );
        if (!validSig) revert InvalidOwnerPoP();

        cert.revoked = true;

        emit CertificateRevoked(cert.certId, domainHash, nonce);
    }

    /**
     * @notice Quick lookup to check if a domain has an active, valid certificate on Monad.
     * @param domain Domain string to query
     * @return isValid True if certificate exists, is not revoked, and is within valid time window
     * @return cert Full certificate details
     */
    function isCertificateValid(string calldata domain)
        external
        view
        returns (bool isValid, Certificate memory cert)
    {
        bytes32 domainHash = canonicalizeAndHash(domain);
        cert = certificatesByDomain[domainHash];

        if (cert.certId == bytes32(0)) {
            return (false, cert);
        }

        if (cert.revoked) {
            return (false, cert);
        }

        if (block.timestamp > cert.expiresAt) {
            return (false, cert);
        }

        return (true, cert);
    }
}
