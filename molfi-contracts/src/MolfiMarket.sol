// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/// Chainlink Data Feed interface (AggregatorV3).
interface IAggregatorV3 {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function decimals() external view returns (uint8);
}

/// @title MolfiMarket — binary (YES/NO) prediction-market lifecycle, resolved
/// from a **Chainlink** price feed. Avalanche/EVM port of the Soroban `market`
/// contract (Reflector SEP-40 → Chainlink AggregatorV3).
/// @notice A price market asks "is `asset price` `op` `threshold` at close?".
/// Anyone can `resolveFromOracle` after close: it reads Chainlink
/// `latestRoundData`, validates freshness against a staleness bound, and sets
/// the winning outcome (0 = YES, 1 = NO) deterministically.
contract MolfiMarket {
    enum Status { Trading, Resolving, Resolved }

    struct Market {
        string question;
        uint64 closeTs;
        address oracle; // Chainlink AggregatorV3 feed
        int256 threshold; // in feed decimals
        uint8 op; // 0 = GTE (YES iff price >= threshold), 1 = LT
        uint64 maxStaleness; // seconds
        Status status;
        uint32 winningOutcome; // 0 = YES, 1 = NO
        bool exists;
        bool hasOracle;
    }

    address public admin;
    mapping(bytes32 => Market) public markets;

    event MarketCreated(bytes32 indexed id, string question, uint64 closeTs, address oracle);
    event Resolved(bytes32 indexed id, uint32 winningOutcome, int256 price);

    error NotAdmin();
    error Exists();
    error Missing();
    error NotClosed();
    error AlreadyResolved();
    error StalePrice();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// Basic (admin-resolved) market.
    function create(bytes32 id, string calldata question, uint64 closeTs) external onlyAdmin {
        if (markets[id].exists) revert Exists();
        markets[id] = Market(question, closeTs, address(0), 0, 0, 0, Status.Trading, 0, true, false);
        emit MarketCreated(id, question, closeTs, address(0));
    }

    /// Chainlink price market: resolves YES iff `price op threshold` at close.
    function createPriceMarket(
        bytes32 id,
        string calldata question,
        uint64 closeTs,
        address oracle,
        int256 threshold,
        uint8 op,
        uint64 maxStaleness
    ) external onlyAdmin {
        if (markets[id].exists) revert Exists();
        markets[id] =
            Market(question, closeTs, oracle, threshold, op, maxStaleness, Status.Trading, 0, true, true);
        emit MarketCreated(id, question, closeTs, oracle);
    }

    /// Permissionless settlement from the Chainlink feed after close.
    function resolveFromOracle(bytes32 id) external {
        Market storage m = markets[id];
        if (!m.exists || !m.hasOracle) revert Missing();
        if (block.timestamp < m.closeTs) revert NotClosed();
        if (m.status == Status.Resolved) revert AlreadyResolved();

        (, int256 price,, uint256 updatedAt,) = IAggregatorV3(m.oracle).latestRoundData();
        // Chainlink freshness: never trust a stale round.
        if (updatedAt == 0 || block.timestamp - updatedAt > m.maxStaleness) revert StalePrice();

        bool yes = m.op == 0 ? (price >= m.threshold) : (price < m.threshold);
        m.winningOutcome = yes ? 0 : 1;
        m.status = Status.Resolved;
        emit Resolved(id, m.winningOutcome, price);
    }

    /// Admin fallback resolution (for non-price markets or emergencies).
    function resolve(bytes32 id, uint32 outcome) external onlyAdmin {
        Market storage m = markets[id];
        if (!m.exists) revert Missing();
        if (m.status == Status.Resolved) revert AlreadyResolved();
        m.winningOutcome = outcome;
        m.status = Status.Resolved;
        emit Resolved(id, outcome, 0);
    }

    // ── views ──────────────────────────────────────────────────────────────
    function isResolved(bytes32 id) external view returns (bool) {
        return markets[id].status == Status.Resolved;
    }

    function winningOutcome(bytes32 id) external view returns (uint32) {
        require(markets[id].status == Status.Resolved, "not resolved");
        return markets[id].winningOutcome;
    }
}
