// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/P256.sol";
import "../src/ValidatorRegistry.sol";
import "../src/CertRegistry.sol";

contract CertRegistryTest is Test {
    ValidatorRegistry public validatorRegistry;
    CertRegistry public certRegistry;

    address public governance = address(0xCAFE);
    uint64 public timelockDelay = 2 days;
    uint256 public initialQuorum = 3;

    // Test Validator Keys (x, y)
    P256.PublicKey[5] public validatorKeys;

    // Test Owner Key (x, y)
    P256.PublicKey public ownerKey;

    function setUp() public {
        // 1. Initialize 5 mock validator P-256 public keys
        for (uint256 i = 0; i < 5; i++) {
            validatorKeys[i] = P256.PublicKey({
                qx: bytes32(uint256(0x1000 + i * 2)),
                qy: bytes32(uint256(0x1001 + i * 2))
            });
        }

        // Initialize Owner key
        ownerKey = P256.PublicKey({
            qx: bytes32(uint256(0x9990)),
            qy: bytes32(uint256(0x9991))
        });

        // 2. Deploy ValidatorRegistry
        P256.PublicKey[] memory initVals = new P256.PublicKey[](5);
        for (uint256 i = 0; i < 5; i++) {
            initVals[i] = validatorKeys[i];
        }

        validatorRegistry = new ValidatorRegistry(
            initVals,
            initialQuorum,
            governance,
            timelockDelay
        );

        // 3. Deploy CertRegistry
        certRegistry = new CertRegistry(address(validatorRegistry));
    }

    // Helper: mock successful precompile call at 0x0100 for (hash, r, s, qx, qy)
    function registerValidSig(
        bytes32 hash,
        bytes32 r,
        bytes32 s,
        bytes32 qx,
        bytes32 qy
    ) internal {
        bytes memory input = abi.encodePacked(hash, r, s, qx, qy);
        vm.mockCall(address(0x0100), input, abi.encode(uint256(1)));
    }

    function test_SuccessfulIssuanceAndLookup() public {
        string memory domain = "demo.monadtrust.xyz";
        bytes32 domainHash = certRegistry.canonicalizeAndHash(domain);
        bytes32 subjectKeyHash = P256.keyHash(ownerKey.qx, ownerKey.qy);

        uint64 nonce = 1;
        uint64 expiresAt = uint64(block.timestamp + 30 days);
        uint64 deadline = uint64(block.timestamp + 30 minutes);

        bytes32 digest = certRegistry.computeIssuanceDigest(
            domainHash,
            subjectKeyHash,
            nonce,
            expiresAt,
            deadline
        );

        // Owner signs PoP
        P256.Signature memory ownerSig = P256.Signature({
            r: bytes32(uint256(0x5555)),
            s: bytes32(uint256(0x6666))
        });
        registerValidSig(digest, ownerSig.r, ownerSig.s, ownerKey.qx, ownerKey.qy);

        // 3 Validators sign (0, 1, 2)
        uint256[] memory valIndices = new uint256[](3);
        P256.Signature[] memory valSigs = new P256.Signature[](3);

        for (uint256 i = 0; i < 3; i++) {
            valIndices[i] = i;
            valSigs[i] = P256.Signature({
                r: bytes32(uint256(0x7770 + i)),
                s: bytes32(uint256(0x8880 + i))
            });
            registerValidSig(
                digest,
                valSigs[i].r,
                valSigs[i].s,
                validatorKeys[i].qx,
                validatorKeys[i].qy
            );
        }

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        bytes32 certId = certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);
        assertTrue(certId != bytes32(0), "certId should not be zero");

        // Verify lookup
        (bool isValid, CertRegistry.Certificate memory cert) = certRegistry.isCertificateValid(domain);
        assertTrue(isValid, "Certificate should be valid");
        assertEq(cert.domainHash, domainHash);
        assertEq(cert.nonce, 1);
        assertFalse(cert.revoked);
    }

    function test_RevertOnDuplicateSigner() public {
        string memory domain = "duplicate.monadtrust.xyz";
        bytes32 domainHash = certRegistry.canonicalizeAndHash(domain);
        bytes32 subjectKeyHash = P256.keyHash(ownerKey.qx, ownerKey.qy);

        uint64 nonce = 1;
        uint64 expiresAt = uint64(block.timestamp + 30 days);
        uint64 deadline = uint64(block.timestamp + 30 minutes);

        bytes32 digest = certRegistry.computeIssuanceDigest(
            domainHash,
            subjectKeyHash,
            nonce,
            expiresAt,
            deadline
        );

        P256.Signature memory ownerSig = P256.Signature({
            r: bytes32(uint256(0x1111)),
            s: bytes32(uint256(0x2222))
        });
        registerValidSig(digest, ownerSig.r, ownerSig.s, ownerKey.qx, ownerKey.qy);

        // Pass validator index 0 TWICE: [0, 0, 1]
        uint256[] memory valIndices = new uint256[](3);
        valIndices[0] = 0;
        valIndices[1] = 0;
        valIndices[2] = 1;

        P256.Signature[] memory valSigs = new P256.Signature[](3);
        for (uint256 i = 0; i < 3; i++) {
            valSigs[i] = P256.Signature({
                r: bytes32(uint256(0x3330 + i)),
                s: bytes32(uint256(0x4440 + i))
            });
        }

        // Register validator 0 signature so first iteration passes
        registerValidSig(digest, valSigs[0].r, valSigs[0].s, validatorKeys[0].qx, validatorKeys[0].qy);

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        vm.expectRevert(CertRegistry.DuplicateSigner.selector);
        certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);
    }

    function test_RevertOnInsufficientQuorum() public {
        string memory domain = "quorum.monadtrust.xyz";
        bytes32 domainHash = certRegistry.canonicalizeAndHash(domain);
        bytes32 subjectKeyHash = P256.keyHash(ownerKey.qx, ownerKey.qy);

        uint64 nonce = 1;
        uint64 expiresAt = uint64(block.timestamp + 30 days);
        uint64 deadline = uint64(block.timestamp + 30 minutes);

        bytes32 digest = certRegistry.computeIssuanceDigest(
            domainHash,
            subjectKeyHash,
            nonce,
            expiresAt,
            deadline
        );

        P256.Signature memory ownerSig = P256.Signature({
            r: bytes32(uint256(0x1111)),
            s: bytes32(uint256(0x2222))
        });
        registerValidSig(digest, ownerSig.r, ownerSig.s, ownerKey.qx, ownerKey.qy);

        // Only 2 validators provided (quorum requires 3)
        uint256[] memory valIndices = new uint256[](2);
        valIndices[0] = 0;
        valIndices[1] = 1;

        P256.Signature[] memory valSigs = new P256.Signature[](2);
        for (uint256 i = 0; i < 2; i++) {
            valSigs[i] = P256.Signature({
                r: bytes32(uint256(0x3330 + i)),
                s: bytes32(uint256(0x4440 + i))
            });
        }

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        vm.expectRevert(CertRegistry.InsufficientQuorum.selector);
        certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);
    }

    function test_RevertOnStaleApproval() public {
        string memory domain = "stale.monadtrust.xyz";

        // Deadline in the past
        uint64 nonce = 1;
        uint64 expiresAt = uint64(block.timestamp + 30 days);
        uint64 deadline = uint64(block.timestamp - 1 seconds);

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        P256.Signature memory ownerSig = P256.Signature({ r: bytes32(0), s: bytes32(0) });
        uint256[] memory valIndices = new uint256[](3);
        P256.Signature[] memory valSigs = new P256.Signature[](3);

        vm.expectRevert(CertRegistry.StaleApproval.selector);
        certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);
    }

    function test_RevertOnDomainNonCanonical() public {
        // Uppercase
        vm.expectRevert(CertRegistry.InvalidDomain.selector);
        certRegistry.canonicalizeAndHash("Example.com");

        // Trailing dot
        vm.expectRevert(CertRegistry.InvalidDomain.selector);
        certRegistry.canonicalizeAndHash("example.com.");

        // Leading dot
        vm.expectRevert(CertRegistry.InvalidDomain.selector);
        certRegistry.canonicalizeAndHash(".example.com");

        // Space
        vm.expectRevert(CertRegistry.InvalidDomain.selector);
        certRegistry.canonicalizeAndHash("example .com");
    }

    function test_RevertOnNonSequentialNonce() public {
        string memory domain = "nonce.monadtrust.xyz";
        uint64 invalidNonce = 5; // Expected 1

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: uint64(block.timestamp + 30 days),
            nonce: invalidNonce,
            deadline: uint64(block.timestamp + 30 minutes)
        });

        P256.Signature memory ownerSig = P256.Signature({ r: bytes32(0), s: bytes32(0) });
        uint256[] memory valIndices = new uint256[](3);
        P256.Signature[] memory valSigs = new P256.Signature[](3);

        vm.expectRevert(CertRegistry.InvalidNonce.selector);
        certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);
    }

    function test_MalleabilityHighSRejection() public {
        bytes32 hash = keccak256("test_hash");
        bytes32 r = bytes32(uint256(1));
        // s > n/2
        bytes32 highS = bytes32(uint256(0x7FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCE4279DC65617E3192A9));
        bytes32 qx = bytes32(uint256(0x1000));
        bytes32 qy = bytes32(uint256(0x1001));

        bool valid = P256.verifySignature(hash, r, highS, qx, qy);
        assertFalse(valid, "High-s signature must be rejected");
    }

    function test_OwnerRevocation() public {
        string memory domain = "revoke.monadtrust.xyz";
        bytes32 domainHash = certRegistry.canonicalizeAndHash(domain);
        bytes32 subjectKeyHash = P256.keyHash(ownerKey.qx, ownerKey.qy);

        uint64 nonce = 1;
        uint64 expiresAt = uint64(block.timestamp + 30 days);
        uint64 deadline = uint64(block.timestamp + 30 minutes);

        bytes32 digest = certRegistry.computeIssuanceDigest(
            domainHash,
            subjectKeyHash,
            nonce,
            expiresAt,
            deadline
        );

        P256.Signature memory ownerSig = P256.Signature({
            r: bytes32(uint256(0xAAAA)),
            s: bytes32(uint256(0xBBBB))
        });
        registerValidSig(digest, ownerSig.r, ownerSig.s, ownerKey.qx, ownerKey.qy);

        uint256[] memory valIndices = new uint256[](3);
        P256.Signature[] memory valSigs = new P256.Signature[](3);
        for (uint256 i = 0; i < 3; i++) {
            valIndices[i] = i;
            valSigs[i] = P256.Signature({
                r: bytes32(uint256(0xCCCC + i)),
                s: bytes32(uint256(0xDDDD + i))
            });
            registerValidSig(
                digest,
                valSigs[i].r,
                valSigs[i].s,
                validatorKeys[i].qx,
                validatorKeys[i].qy
            );
        }

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        bytes32 certId = certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);

        // Now Revoke with sequential nonce = 2
        uint64 revokeNonce = 2;
        bytes32 revokeDigest = certRegistry.computeRevocationDigest(certId, domainHash, revokeNonce);

        P256.Signature memory revokeSig = P256.Signature({
            r: bytes32(uint256(0xEEEE)),
            s: bytes32(uint256(0xFFFF))
        });
        registerValidSig(revokeDigest, revokeSig.r, revokeSig.s, ownerKey.qx, ownerKey.qy);

        certRegistry.revokeCertificate(domain, revokeNonce, revokeSig);

        // Lookup must now report invalid
        (bool isValid, CertRegistry.Certificate memory cert) = certRegistry.isCertificateValid(domain);
        assertFalse(isValid, "Revoked certificate should be reported invalid");
        assertTrue(cert.revoked, "Revoked flag must be true");

        // Second revocation attempt must revert
        vm.expectRevert(CertRegistry.CertificateAlreadyRevoked.selector);
        certRegistry.revokeCertificate(domain, 3, revokeSig);
    }

    function test_ValidatorRegistryTimelockedGovernance() public {
        // Governance proposes new validator
        bytes32 newQx = bytes32(uint256(0x9999));
        bytes32 newQy = bytes32(uint256(0x8888));

        vm.prank(governance);
        uint256 pid = validatorRegistry.proposeAddValidator(newQx, newQy);

        // Trying to execute immediately must revert due to timelock
        vm.prank(governance);
        vm.expectRevert(ValidatorRegistry.TimelockNotMet.selector);
        validatorRegistry.executeProposal(pid);

        // Warp past timelockDelay
        vm.warp(block.timestamp + timelockDelay + 1);

        vm.prank(governance);
        validatorRegistry.executeProposal(pid);

        assertEq(validatorRegistry.totalValidators(), 6);
        assertEq(validatorRegistry.activeValidatorCount(), 6);
    }

    // --- Phase 6: Invariant & Property-Based Fuzz Tests ---

    /// @notice Invariant: Any string containing uppercase characters must be rejected by canonicalizeAndHash
    function testFuzz_CanonicalizeRejectsUppercase(string memory prefix, string memory suffix) public {
        vm.assume(bytes(prefix).length < 20 && bytes(suffix).length < 20);
        string memory nonCanonical = string.concat(prefix, "A", suffix);
        vm.expectRevert(CertRegistry.InvalidDomain.selector);
        certRegistry.canonicalizeAndHash(nonCanonical);
    }

    /// @notice Invariant: Any out-of-sequence nonce != expectedNonce must revert
    function testFuzz_RevertOnOutOfSequenceNonce(uint64 randomNonce) public {
        vm.assume(randomNonce != 1); // Expected nonce for first cert is 1

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: "fuzz.monadtrust.xyz",
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: uint64(block.timestamp + 30 days),
            nonce: randomNonce,
            deadline: uint64(block.timestamp + 30 minutes)
        });

        P256.Signature memory ownerSig = P256.Signature({ r: bytes32(0), s: bytes32(0) });
        uint256[] memory valIndices = new uint256[](3);
        P256.Signature[] memory valSigs = new P256.Signature[](3);

        vm.expectRevert(CertRegistry.InvalidNonce.selector);
        certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);
    }

    /// @notice Invariant: Any high-s scalar (s > n/2) must be strictly rejected
    function testFuzz_MalleabilityHighSAlwaysRejected(uint256 sCandidate) public view {
        uint256 halfN = 0x7FFFFFFF800000007FFFFFFFFFFFFFFFDE737D56D38BCE4279DC65617E3192A8;
        uint256 n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
        vm.assume(sCandidate > halfN && sCandidate < n);

        bytes32 hash = keccak256("fuzz_hash");
        bytes32 r = bytes32(uint256(1));
        bytes32 s = bytes32(sCandidate);
        bytes32 qx = bytes32(uint256(0x1000));
        bytes32 qy = bytes32(uint256(0x1001));

        bool valid = P256.verifySignature(hash, r, s, qx, qy);
        assertFalse(valid, "Any high-s signature must be rejected");
    }

    /// @notice Invariant: Expired certificates are never valid
    function testFuzz_ExpiredCertificateIsNeverValid(uint32 warpSeconds) public {
        vm.assume(warpSeconds > 30 days && warpSeconds < 365 days);

        string memory domain = "fuzzexpiry.monadtrust.xyz";
        bytes32 domainHash = certRegistry.canonicalizeAndHash(domain);
        bytes32 subjectKeyHash = P256.keyHash(ownerKey.qx, ownerKey.qy);

        uint64 nonce = 1;
        uint64 expiresAt = uint64(block.timestamp + 30 days);
        uint64 deadline = uint64(block.timestamp + 30 minutes);

        bytes32 digest = certRegistry.computeIssuanceDigest(
            domainHash,
            subjectKeyHash,
            nonce,
            expiresAt,
            deadline
        );

        P256.Signature memory ownerSig = P256.Signature({
            r: bytes32(uint256(0x1234)),
            s: bytes32(uint256(0x5678))
        });
        registerValidSig(digest, ownerSig.r, ownerSig.s, ownerKey.qx, ownerKey.qy);

        uint256[] memory valIndices = new uint256[](3);
        P256.Signature[] memory valSigs = new P256.Signature[](3);
        for (uint256 i = 0; i < 3; i++) {
            valIndices[i] = i;
            valSigs[i] = P256.Signature({
                r: bytes32(uint256(0x9990 + i)),
                s: bytes32(uint256(0x8880 + i))
            });
            registerValidSig(
                digest,
                valSigs[i].r,
                valSigs[i].s,
                validatorKeys[i].qx,
                validatorKeys[i].qy
            );
        }

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: domain,
            subjectQx: ownerKey.qx,
            subjectQy: ownerKey.qy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        certRegistry.issueCertificate(req, ownerSig, valIndices, valSigs);

        // Warp time into the future past expiration
        vm.warp(block.timestamp + warpSeconds);

        (bool isValid, ) = certRegistry.isCertificateValid(domain);
        assertFalse(isValid, "Expired certificate must return isValid == false");
    }
}
