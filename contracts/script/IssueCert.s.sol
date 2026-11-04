// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/P256.sol";
import "../src/CertRegistry.sol";

contract IssueCertScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0x546caa2bd85ba020a9db4faef841e6e8cbd50ada17fadcd98b62aeb34408491b));
        address certRegistryAddr = vm.envOr("CERT_REGISTRY", address(0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b));

        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/../submission_bundle.json");
        string memory json = vm.readFile(path);

        string memory canonicalDomain = vm.parseJsonString(json, ".canonical_domain");
        bytes32 subjectQx = vm.parseJsonBytes32(json, ".subject_qx");
        bytes32 subjectQy = vm.parseJsonBytes32(json, ".subject_qy");
        uint64 expiresAt = uint64(vm.parseJsonUint(json, ".expires_at"));
        uint64 nonce = uint64(vm.parseJsonUint(json, ".nonce"));
        uint64 deadline = uint64(vm.parseJsonUint(json, ".deadline"));

        bytes32 ownerR = vm.parseJsonBytes32(json, ".owner_pop_r");
        bytes32 ownerS = vm.parseJsonBytes32(json, ".owner_pop_s");

        uint256[] memory validatorIndices = vm.parseJsonUintArray(json, ".validator_indices");
        bytes32[] memory valSigsR = vm.parseJsonBytes32Array(json, ".validator_sigs_r");
        bytes32[] memory valSigsS = vm.parseJsonBytes32Array(json, ".validator_sigs_s");

        P256.Signature[] memory validatorSigs = new P256.Signature[](valSigsR.length);
        for (uint256 i = 0; i < valSigsR.length; i++) {
            validatorSigs[i] = P256.Signature({ r: valSigsR[i], s: valSigsS[i] });
        }

        CertRegistry.IssueRequest memory req = CertRegistry.IssueRequest({
            canonicalDomain: canonicalDomain,
            subjectQx: subjectQx,
            subjectQy: subjectQy,
            expiresAt: expiresAt,
            nonce: nonce,
            deadline: deadline
        });

        P256.Signature memory ownerSig = P256.Signature({ r: ownerR, s: ownerS });

        vm.startBroadcast(deployerPrivateKey);
        CertRegistry certRegistry = CertRegistry(certRegistryAddr);
        bytes32 certId = certRegistry.issueCertificate(req, ownerSig, validatorIndices, validatorSigs);
        console.log("Certificate successfully issued on Monad Testnet!");
        console.logBytes32(certId);
        vm.stopBroadcast();
    }
}
