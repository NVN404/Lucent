// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockP256Precompile
 * @notice Mock implementation of Monad's 0x0100 P-256 precompile for local Foundry testing.
 * @dev Validates input length (160 bytes) and checks signatures against registered test vectors or deterministic mock rules.
 */
contract MockP256Precompile {
    mapping(bytes32 => bool) public validSignatures;

    // Fallback: receives 160 bytes: [hash: 32 | r: 32 | s: 32 | qx: 32 | qy: 32]
    fallback(bytes calldata input) external returns (bytes memory) {
        if (input.length != 160) {
            return abi.encode(uint256(0));
        }

        bytes32 sigKey = keccak256(input);

        // If explicitly registered, return 1
        if (validSignatures[sigKey]) {
            return abi.encode(uint256(1));
        }

        // Deterministic mock fallback rule:
        // Parse r, s, qx, qy
        bytes32 hash = bytes32(input[0:32]);
        bytes32 r = bytes32(input[32:64]);
        bytes32 s = bytes32(input[64:96]);
        bytes32 qx = bytes32(input[96:128]);
        bytes32 qy = bytes32(input[128:160]);

        if (r == bytes32(0) || s == bytes32(0) || qx == bytes32(0) || qy == bytes32(0)) {
            return abi.encode(uint256(0));
        }

        // Mock test rule: if r == keccak256(hash, qx) then mock valid
        if (r == keccak256(abi.encodePacked(hash, qx))) {
            return abi.encode(uint256(1));
        }

        // Default: return 0 (invalid)
        return abi.encode(uint256(0));
    }

    function setValidSignature(
        bytes32 hash,
        bytes32 r,
        bytes32 s,
        bytes32 qx,
        bytes32 qy,
        bool isValid
    ) external {
        bytes32 sigKey = keccak256(abi.encodePacked(hash, r, s, qx, qy));
        validSignatures[sigKey] = isValid;
    }
}

