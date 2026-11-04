// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./P256.sol";

/**
 * @title ValidatorRegistry
 * @notice Manages the authorized P-256 validator set and quorum rules for MonadTrust.
 * @dev Stores P-256 public keys (qx, qy) directly (not EVM addresses).
 *      Eliminates single master key risk by handing governance to a Timelocked multisig/governance address at deployment.
 */
contract ValidatorRegistry {
    using P256 for bytes32;

    struct Validator {
        bytes32 qx;
        bytes32 qy;
        bool active;
        uint64 registeredAt;
    }

    enum ActionType { AddValidator, RemoveValidator, SetQuorum, SetGovernance }

    struct GovernanceProposal {
        ActionType action;
        bytes32 qx;
        bytes32 qy;
        uint256 targetIndex;
        uint256 newQuorum;
        address newGovernance;
        uint64 eta; // Earliest execution timestamp
        bool executed;
        bool canceled;
    }

    /// @notice Authorized governance address (e.g. 3-of-5 multisig)
    address public governance;

    /// @notice Configurable timelock delay (seconds)
    uint64 public immutable timelockDelay;

    /// @notice Minimum number of validator signatures required for issuance (e.g. 3)
    uint256 public quorumThreshold;

    /// @notice Total active validators
    uint256 public activeValidatorCount;

    /// @notice Array of all registered validators
    Validator[] public validators;

    /// @notice Mapping from validator public key hash keccak256(qx, qy) to index in validators array + 1 (0 = not found)
    mapping(bytes32 => uint256) public keyHashToIndex;

    /// @notice Governance proposals
    uint256 public proposalCount;
    mapping(uint256 => GovernanceProposal) public proposals;

    // Events
    event ValidatorAdded(uint256 indexed index, bytes32 qx, bytes32 qy);
    event ValidatorRemoved(uint256 indexed index);
    event QuorumThresholdUpdated(uint256 oldQuorum, uint256 newQuorum);
    event GovernanceTransferred(address indexed oldGovernance, address indexed newGovernance);
    event ProposalCreated(uint256 indexed proposalId, ActionType action, uint64 eta);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // Errors
    error OnlyGovernance();
    error TimelockNotMet();
    error ProposalAlreadyHandled();
    error InvalidValidator();
    error InvalidQuorum();
    error DuplicateValidator();
    error ValidatorNotFound();

    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernance();
        _;
    }

    /**
     * @notice Initializes the validator registry.
     * @param _initialValidators List of initial validator P-256 public keys
     * @param _quorumThreshold Initial quorum threshold (e.g., 3)
     * @param _governance Address of the governance multisig/timelock
     * @param _timelockDelay Delay in seconds before a queued change can be executed
     */
    constructor(
        P256.PublicKey[] memory _initialValidators,
        uint256 _quorumThreshold,
        address _governance,
        uint64 _timelockDelay
    ) {
        if (_governance == address(0)) revert OnlyGovernance();
        if (_quorumThreshold == 0 || _quorumThreshold > _initialValidators.length) revert InvalidQuorum();

        governance = _governance;
        timelockDelay = _timelockDelay;
        quorumThreshold = _quorumThreshold;

        for (uint256 i = 0; i < _initialValidators.length; i++) {
            _addValidator(_initialValidators[i].qx, _initialValidators[i].qy);
        }
    }

    function _addValidator(bytes32 qx, bytes32 qy) internal {
        if (qx == bytes32(0) || qy == bytes32(0)) revert InvalidValidator();

        bytes32 kh = keccak256(abi.encodePacked(qx, qy));
        if (keyHashToIndex[kh] != 0) revert DuplicateValidator();

        uint256 index = validators.length;
        validators.push(Validator({
            qx: qx,
            qy: qy,
            active: true,
            registeredAt: uint64(block.timestamp)
        }));

        keyHashToIndex[kh] = index + 1; // 1-indexed to differentiate from 0
        activeValidatorCount++;

        emit ValidatorAdded(index, qx, qy);
    }

    // --- Governance Actions (Queue -> Timelock -> Execute) ---

    function proposeAddValidator(bytes32 qx, bytes32 qy) external onlyGovernance returns (uint256 proposalId) {
        proposalId = ++proposalCount;
        uint64 eta = uint64(block.timestamp) + timelockDelay;
        proposals[proposalId] = GovernanceProposal({
            action: ActionType.AddValidator,
            qx: qx,
            qy: qy,
            targetIndex: 0,
            newQuorum: 0,
            newGovernance: address(0),
            eta: eta,
            executed: false,
            canceled: false
        });
        emit ProposalCreated(proposalId, ActionType.AddValidator, eta);
    }

    function proposeRemoveValidator(uint256 index) external onlyGovernance returns (uint256 proposalId) {
        if (index >= validators.length || !validators[index].active) revert ValidatorNotFound();
        if (activeValidatorCount - 1 < quorumThreshold) revert InvalidQuorum();

        proposalId = ++proposalCount;
        uint64 eta = uint64(block.timestamp) + timelockDelay;
        proposals[proposalId] = GovernanceProposal({
            action: ActionType.RemoveValidator,
            qx: bytes32(0),
            qy: bytes32(0),
            targetIndex: index,
            newQuorum: 0,
            newGovernance: address(0),
            eta: eta,
            executed: false,
            canceled: false
        });
        emit ProposalCreated(proposalId, ActionType.RemoveValidator, eta);
    }

    function proposeSetQuorum(uint256 newQuorum) external onlyGovernance returns (uint256 proposalId) {
        if (newQuorum == 0 || newQuorum > activeValidatorCount) revert InvalidQuorum();

        proposalId = ++proposalCount;
        uint64 eta = uint64(block.timestamp) + timelockDelay;
        proposals[proposalId] = GovernanceProposal({
            action: ActionType.SetQuorum,
            qx: bytes32(0),
            qy: bytes32(0),
            targetIndex: 0,
            newQuorum: newQuorum,
            newGovernance: address(0),
            eta: eta,
            executed: false,
            canceled: false
        });
        emit ProposalCreated(proposalId, ActionType.SetQuorum, eta);
    }

    function executeProposal(uint256 proposalId) external onlyGovernance {
        GovernanceProposal storage p = proposals[proposalId];
        if (p.executed || p.canceled) revert ProposalAlreadyHandled();
        if (block.timestamp < p.eta) revert TimelockNotMet();

        p.executed = true;

        if (p.action == ActionType.AddValidator) {
            _addValidator(p.qx, p.qy);
        } else if (p.action == ActionType.RemoveValidator) {
            validators[p.targetIndex].active = false;
            activeValidatorCount--;
            emit ValidatorRemoved(p.targetIndex);
        } else if (p.action == ActionType.SetQuorum) {
            uint256 oldQuorum = quorumThreshold;
            quorumThreshold = p.newQuorum;
            emit QuorumThresholdUpdated(oldQuorum, p.newQuorum);
        } else if (p.action == ActionType.SetGovernance) {
            address oldGov = governance;
            governance = p.newGovernance;
            emit GovernanceTransferred(oldGov, p.newGovernance);
        }

        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external onlyGovernance {
        GovernanceProposal storage p = proposals[proposalId];
        if (p.executed || p.canceled) revert ProposalAlreadyHandled();
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // --- View Functions ---

    function totalValidators() external view returns (uint256) {
        return validators.length;
    }

    function isValidatorActive(uint256 index) external view returns (bool) {
        if (index >= validators.length) return false;
        return validators[index].active;
    }

    function getValidator(uint256 index) external view returns (bytes32 qx, bytes32 qy, bool active) {
        if (index >= validators.length) revert ValidatorNotFound();
        Validator storage v = validators[index];
        return (v.qx, v.qy, v.active);
    }
}
