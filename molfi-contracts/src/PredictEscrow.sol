// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
}

interface IPredictVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata pubSignals
    ) external view returns (bool);
}

interface IMarketRef {
    function isResolved(bytes32 id) external view returns (bool);
    function winningOutcome(bytes32 id) external view returns (uint32);
}

/// @title PredictEscrow — real-mUSDC pari-mutuel betting (Avalanche/EVM port of
/// the Soroban `predict-escrow`).
/// @notice Bet mUSDC on a YES/NO outcome; after the market resolves (via
/// Chainlink in `MolfiMarket`), winners redeem their pro-rata share of the whole
/// pool, minus a 2% fee to the LP vault. `betZk` additionally gates a bet behind
/// a single-use Groth16 proof (eligibility + nullifier), verified on-chain.
contract PredictEscrow {
    IERC20 public immutable musdc;
    IPredictVerifier public immutable verifier;
    IMarketRef public immutable market;
    address public vault;
    uint256 public constant FEE_BPS = 200; // 2%

    mapping(bytes32 => mapping(uint32 => uint256)) public pool; // market → outcome → staked
    mapping(bytes32 => uint256) public total; // market → total staked
    mapping(bytes32 => mapping(uint32 => mapping(address => uint256))) public position;
    mapping(bytes32 => mapping(address => bool)) public redeemed;
    mapping(uint256 => bool) public nullifierUsed;

    event Bet(bytes32 indexed marketId, address indexed bettor, uint32 outcome, uint256 amount);
    event Redeem(bytes32 indexed marketId, address indexed bettor, uint256 payout);

    error ZeroAmount();
    error NotResolved();
    error AlreadyRedeemed();
    error NoWinningPosition();
    error NullifierSpent();
    error BadProof();

    constructor(IERC20 _musdc, IPredictVerifier _verifier, IMarketRef _market, address _vault) {
        musdc = _musdc;
        verifier = _verifier;
        market = _market;
        vault = _vault;
    }

    function _escrow(bytes32 marketId, uint32 outcome, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        require(musdc.transferFrom(msg.sender, address(this), amount), "transfer failed");
        pool[marketId][outcome] += amount;
        total[marketId] += amount;
        position[marketId][outcome][msg.sender] += amount;
        emit Bet(marketId, msg.sender, outcome, amount);
    }

    /// Plain pari-mutuel bet.
    function bet(bytes32 marketId, uint32 outcome, uint256 amount) external {
        _escrow(marketId, outcome, amount);
    }

    /// ZK-gated bet: every live bet carries a fresh single-use proof, checked
    /// on-chain before escrow (public signals `[root, nullifierHash, outcome, recipient]`).
    function betZk(
        bytes32 marketId,
        uint32 outcome,
        uint256 amount,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata pubSignals
    ) external {
        uint256 nullifier = pubSignals[1];
        if (nullifierUsed[nullifier]) revert NullifierSpent();
        if (!verifier.verifyProof(a, b, c, pubSignals)) revert BadProof();
        nullifierUsed[nullifier] = true;
        _escrow(marketId, outcome, amount);
    }

    /// Redeem the winning pro-rata share after resolution (2% fee → vault).
    function redeem(bytes32 marketId, address bettor) external returns (uint256 net) {
        if (!market.isResolved(marketId)) revert NotResolved();
        if (redeemed[marketId][bettor]) revert AlreadyRedeemed();
        redeemed[marketId][bettor] = true;

        uint32 win = market.winningOutcome(marketId);
        uint256 stake = position[marketId][win][bettor];
        if (stake == 0) revert NoWinningPosition();

        uint256 winPool = pool[marketId][win];
        uint256 gross = (stake * total[marketId]) / winPool;
        uint256 fee = (gross * FEE_BPS) / 10_000;
        net = gross - fee;
        if (vault != address(0) && fee > 0) musdc.transfer(vault, fee);
        require(musdc.transfer(bettor, net), "payout failed");
        emit Redeem(marketId, bettor, net);
    }
}
