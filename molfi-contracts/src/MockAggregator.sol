// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/// Minimal Chainlink AggregatorV3 mock for tests / demo markets on Fuji where a
/// live feed isn't wired. In production, point MolfiMarket at a real Chainlink
/// feed (e.g. BTC/USD on Fuji).
contract MockAggregator {
    int256 public answer;
    uint8 public immutable dec;
    uint256 public updatedAt;
    uint80 public round;

    constructor(int256 initial, uint8 decimals_) {
        answer = initial;
        dec = decimals_;
        updatedAt = block.timestamp;
        round = 1;
    }

    function setAnswer(int256 a) external {
        answer = a;
        updatedAt = block.timestamp;
        round += 1;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 ans, uint256 startedAt, uint256 upAt, uint80 answeredInRound)
    {
        return (round, answer, updatedAt, updatedAt, round);
    }

    function decimals() external view returns (uint8) {
        return dec;
    }
}
