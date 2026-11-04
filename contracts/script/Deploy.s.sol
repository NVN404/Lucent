// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/P256.sol";
import "../src/ValidatorRegistry.sol";
import "../src/CertRegistry.sol";

contract DeployMonadTrust is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0x546caa2bd85ba020a9db4faef841e6e8cbd50ada17fadcd98b62aeb34408491b));
        address governance = vm.envOr("GOVERNANCE_ADDRESS", vm.addr(deployerPrivateKey));
        uint64 timelockDelay = uint64(vm.envOr("TIMELOCK_DELAY", uint256(0))); // 0 for testnet demo flexibility
        uint256 quorumThreshold = vm.envOr("QUORUM_THRESHOLD", uint256(3));

        vm.startBroadcast(deployerPrivateKey);

        // 5 Real Validator P-256 Public Keys matching validator_seed_0..4
        P256.PublicKey[] memory initialValidators = new P256.PublicKey[](5);
        initialValidators[0] = P256.PublicKey({
            qx: 0x124649c3248d602f51edc72c347e48d5601a4d627afaa946554f11b3034bb6db,
            qy: 0xcaaa394ea7a5c250c07db3b7b44bb56cf38eda60b72808d1990a2905abb5d5d7
        });
        initialValidators[1] = P256.PublicKey({
            qx: 0x23248ea145bfe7f30a6b0c147da0737e020a908aacb60dc38ddc3a4e2f750885,
            qy: 0x027a3dcb5c69a6cf03576b88ef66c8f186642e74ad1d1c5a30a409b0b1bbab3c
        });
        initialValidators[2] = P256.PublicKey({
            qx: 0xd3935334f9a0e4de8e3a94b767b69132bb333468b9440384b300c903ac03e05d,
            qy: 0x004cb7aaf6412e1f8f330a4b894723360d8f91017aa1da3ff7a97c687f502bc1
        });
        initialValidators[3] = P256.PublicKey({
            qx: 0x0917ad20762593a02c42b36fb73565a28dc7780fe2be6a28ac3be7fb6bc15c44,
            qy: 0x5bd829d353f58a7a8e4d37843ba647ec09bae5e0047c15831efb4a27fd40c8fd
        });
        initialValidators[4] = P256.PublicKey({
            qx: 0xa8471f6778a13db6ebea3d41fff85e16178de048b3e7d7fc2ffb7989078badbb,
            qy: 0xbe429fb7c0245e4741137b25c2350cd02e972a27d71cbf21217631134dc78b24
        });

        ValidatorRegistry validatorRegistry = new ValidatorRegistry(
            initialValidators,
            quorumThreshold,
            governance,
            timelockDelay
        );

        CertRegistry certRegistry = new CertRegistry(address(validatorRegistry));

        console.log("ValidatorRegistry deployed at:", address(validatorRegistry));
        console.log("CertRegistry deployed at:", address(certRegistry));

        vm.stopBroadcast();
    }
}
