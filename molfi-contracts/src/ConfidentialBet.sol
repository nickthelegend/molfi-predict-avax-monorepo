// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
}

interface IConfidentialBetVerifier {
    // public signals: [root, nullifierHash, outcome, recipient]
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata pubSignals
    ) external view returns (bool);
}

interface IMolfiMarket {
    function isResolved(bytes32 id) external view returns (bool);
    function winningOutcome(bytes32 id) external view returns (uint32);
}

/// @title ConfidentialBet — hidden-side prediction bets (Avalanche/EVM port of
/// the Soroban `confidential-bet`).
/// @notice You bet by escrowing a FIXED denomination and committing
/// `Poseidon(secret, nullifier, side)` — your side (YES/NO) never touches the
/// chain. After the market resolves (via Chainlink in `MolfiMarket`), you claim
/// by proving in zero-knowledge that your committed note's side equals the
/// resolved winner (the contract injects the winner as a public input, so losers
/// can't prove). The nullifier is burned; the payout is unlinkable to the bet.
///
/// Fixed denomination keeps the amount public per-note, so pari-mutuel accounting
/// works while the SIDE stays hidden. Pair the collateral with a confidential
/// eERC balance and the *amount at rest* is hidden too.
contract ConfidentialBet {
    IERC20 public immutable collateral;
    IConfidentialBetVerifier public immutable verifier;
    IMolfiMarket public immutable market;
    uint256 public immutable denom; // fixed stake per note
    uint256 public constant PAYOUT_MULT = 2; // even-odds binary payout
    address public admin;

    uint256[] public commitments; // note commitments (off-chain Poseidon tree)
    mapping(uint256 => bool) public knownRoot; // checkpointed off-chain roots
    mapping(uint256 => bool) public nullifierUsed; // claimed notes

    event Commit(uint256 indexed index, uint256 commitment, uint256 amount);
    event RootRegistered(uint256 root);
    event Claim(uint256 indexed nullifierHash, address indexed recipient, uint256 amount);

    error NotAdmin();
    error NotResolved();
    error UnknownRoot();
    error NullifierSpent();
    error BadProof();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(IERC20 _collateral, IConfidentialBetVerifier _verifier, IMolfiMarket _market, uint256 _denom) {
        collateral = _collateral;
        verifier = _verifier;
        market = _market;
        denom = _denom;
        admin = msg.sender;
    }

    /// Escrow `denom` and record a hidden-side note `commitment`. Returns the
    /// leaf index (position in the off-chain Poseidon tree).
    function commit(uint256 commitment) external returns (uint256 index) {
        require(collateral.transferFrom(msg.sender, address(this), denom), "transfer failed");
        index = commitments.length;
        commitments.push(commitment);
        emit Commit(index, commitment, denom);
    }

    /// Operator checkpoints a Poseidon tree root computed off-chain from the
    /// commitments (EVM has no native Poseidon, matching the original design).
    function registerRoot(uint256 root) external onlyAdmin {
        knownRoot[root] = true;
        emit RootRegistered(root);
    }

    /// Claim a winning note. Verifies the ZK proof that the note's side equals
    /// the resolved winner, burns the nullifier, and pays `denom * PAYOUT_MULT`.
    /// @param recipient payout address; also bound into the proof (public signal
    ///        `recipient` == uint160(recipient)) so a valid proof can't be
    ///        re-pointed to a different address.
    function claim(
        bytes32 marketId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256 root,
        uint256 nullifierHash,
        address recipient
    ) external {
        if (!market.isResolved(marketId)) revert NotResolved();
        if (!knownRoot[root]) revert UnknownRoot();
        if (nullifierUsed[nullifierHash]) revert NullifierSpent();

        uint32 outcome = market.winningOutcome(marketId);
        uint256[4] memory pub = [root, nullifierHash, uint256(outcome), uint256(uint160(recipient))];
        if (!verifier.verifyProof(a, b, c, pub)) revert BadProof();

        nullifierUsed[nullifierHash] = true;
        uint256 payout = denom * PAYOUT_MULT;
        require(collateral.transfer(recipient, payout), "payout failed");
        emit Claim(nullifierHash, recipient, payout);
    }

    function commitmentCount() external view returns (uint256) {
        return commitments.length;
    }

    function allCommitments() external view returns (uint256[] memory) {
        return commitments;
    }
}
