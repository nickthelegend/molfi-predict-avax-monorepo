// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {MolfiMarket, IAggregatorV3} from "../src/MolfiMarket.sol";
import {ConfidentialBet, IERC20, IConfidentialBetVerifier, IMolfiMarket} from "../src/ConfidentialBet.sol";
import {ConfidentialBetVerifier} from "../src/ConfidentialBetVerifier.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {PredictEscrow, IPredictVerifier, IMarketRef, IERC20 as IEscrowERC20} from "../src/PredictEscrow.sol";

// Uses the REAL Groth16 proof (BN254) exported from molfi-circuits
// (build/confidential_bet/calldata.txt) to prove the on-chain confidential-bet
// claim: hidden side, verified against the Chainlink-resolved winner.
contract MolfiTest is Test {
    MolfiMarket market;
    ConfidentialBet cbet;
    ConfidentialBetVerifier verifier;
    MockUSD musd;
    MockAggregator feed;

    uint256 constant DENOM = 10_000_000; // 1 unit (7 decimals)
    bytes32 constant MID = keccak256("BTC>=60k @ close");
    address recipient; // must equal uint160(pub[3])

    // Real proof (snarkjs soliditycalldata)
    uint256[2] A = [
        0x2a672cfe8e14c48bebc633b2d30811cde71870ce6d41300298b5faf881c884db,
        0x139039992459d896ea46d1b42a3442b9a9e4972dfa38142e57dd1f3285a021b2
    ];
    uint256[2][2] B = [
        [
            0x1bf2023e4beaf589a6ef7b86c0b7a959e337623d84dafcfde94bd9a5c6bb14f3,
            0x2dc997bfd032beba1c2a761968785c395dfb253ee9d4e395279ce2ee10e679fd
        ],
        [
            0x2dd2ecf78c3e7f8610abbc7ad1bef71ee776cc935cf1db06bf2d6d719b7ce837,
            0x0e649a859e1ab4a500ae902dc3724599675e0526d231a0cf6ac2940bd3e4acad
        ]
    ];
    uint256[2] C = [
        0x076889a9ac4001d6bdb19f3f78547a818d1ee4c12d170d50cbc0f33b9009a230,
        0x0e9f60c5e1d82993e52e10e346a6811cb9d1774e367ce39beb91a304f46a3a56
    ];
    // [root, nullifierHash, outcome(0=YES), recipient]
    uint256 constant ROOT = 11323959007800747051345298391989773091321271562071727349068255722042326386451;
    uint256 constant NULLIFIER = 21484669546358335811058320782594337224184293469722637179181513335025929373146;
    uint256 constant RECIPIENT_FIELD = 987654321987654321;

    function setUp() public {
        recipient = address(uint160(RECIPIENT_FIELD));
        verifier = new ConfidentialBetVerifier();
        musd = new MockUSD();
        market = new MolfiMarket();
        feed = new MockAggregator(int256(65000e8), 8); // BTC = $65k (>= $60k → YES)
        cbet = new ConfidentialBet(IERC20(address(musd)), IConfidentialBetVerifier(address(verifier)), IMolfiMarket(address(market)), DENOM);

        // seed payout liquidity + a bettor's stake
        musd.mint(address(cbet), 100 * DENOM);
        musd.mint(address(this), DENOM);
        musd.approve(address(cbet), DENOM);
    }

    function test_ChainlinkResolvesYesAndConfidentialClaimPays() public {
        // create a Chainlink price market: YES iff BTC >= $60k, closes now
        market.createPriceMarket(MID, "Will BTC be >= $60k at close?", uint64(block.timestamp + 1), address(feed), int256(60000e8), 0, 3600);

        // a hidden-side bet (commitment is opaque; side is off-chain)
        cbet.commit(uint256(0xC0FFEE));

        // resolve permissionlessly from Chainlink (warp to close first)
        vm.warp(block.timestamp + 1);
        market.resolveFromOracle(MID);
        assertTrue(market.isResolved(MID));
        assertEq(market.winningOutcome(MID), 0, "YES wins");

        // operator checkpoints the off-chain Poseidon root the proof references
        cbet.registerRoot(ROOT);

        // claim: prove in ZK the note's hidden side == winner (YES)
        uint256 before = musd.balanceOf(recipient);
        cbet.claim(MID, A, B, C, ROOT, NULLIFIER, recipient);
        assertEq(musd.balanceOf(recipient) - before, DENOM * 2, "2x payout");
        assertTrue(cbet.nullifierUsed(NULLIFIER), "nullifier burned");
    }

    function test_ReplayRejected() public {
        market.createPriceMarket(MID, "q", uint64(block.timestamp + 1), address(feed), int256(60000e8), 0, 3600);
        vm.warp(block.timestamp + 1);
        market.resolveFromOracle(MID);
        cbet.registerRoot(ROOT);
        cbet.claim(MID, A, B, C, ROOT, NULLIFIER, recipient);
        vm.expectRevert(ConfidentialBet.NullifierSpent.selector);
        cbet.claim(MID, A, B, C, ROOT, NULLIFIER, recipient);
    }

    function test_LoserCannotClaim() public {
        // resolve NO (BTC below threshold) → the YES proof's outcome(0) != winner(1)
        feed.setAnswer(int256(50000e8)); // $50k < $60k → NO
        market.createPriceMarket(MID, "q", uint64(block.timestamp + 1), address(feed), int256(60000e8), 0, 3600);
        vm.warp(block.timestamp + 1);
        market.resolveFromOracle(MID);
        assertEq(market.winningOutcome(MID), 1, "NO wins");
        cbet.registerRoot(ROOT);
        // proof asserts outcome 0 (YES); contract injects winner 1 (NO) → verify fails
        vm.expectRevert(ConfidentialBet.BadProof.selector);
        cbet.claim(MID, A, B, C, ROOT, NULLIFIER, recipient);
    }

    function test_StaleFeedRejected() public {
        market.createPriceMarket(MID, "q", uint64(block.timestamp + 1), address(feed), int256(60000e8), 0, 60);
        vm.warp(block.timestamp + 120); // past close; feed now stale (>60s)
        vm.expectRevert(MolfiMarket.StalePrice.selector);
        market.resolveFromOracle(MID);
    }

    function test_MarketEnumeration() public {
        market.createPriceMarket(MID, "Q?", uint64(block.timestamp + 1), address(feed), int256(60000e8), 0, 3600);
        assertEq(market.markets().length, 1);
        (string memory q,, uint8 status,) = market.getMarket(MID);
        assertEq(q, "Q?");
        assertEq(status, 0); // Trading
    }

    // ── PredictEscrow: public pari-mutuel bet + redeem ──────────────────────────
    function test_PredictEscrowPariMutuel() public {
        PredictEscrow esc = new PredictEscrow(
            IEscrowERC20(address(musd)), IPredictVerifier(address(verifier)), IMarketRef(address(market)), address(0)
        );
        address alice = address(0xA11CE);
        address bob = address(0xB0B);
        musd.mint(alice, 100 * DENOM);
        musd.mint(bob, 100 * DENOM);

        // Alice bets 30 on YES(0), Bob bets 10 on NO(1)
        vm.startPrank(alice);
        musd.approve(address(esc), 30 * DENOM);
        esc.bet(MID, 0, 30 * DENOM);
        vm.stopPrank();
        vm.startPrank(bob);
        musd.approve(address(esc), 10 * DENOM);
        esc.bet(MID, 1, 10 * DENOM);
        vm.stopPrank();

        assertEq(esc.total(MID), 40 * DENOM);
        assertEq(esc.pool(MID, 0), 30 * DENOM);

        // resolve YES from Chainlink (BTC $65k >= $60k)
        market.createPriceMarket(MID, "q", uint64(block.timestamp + 1), address(feed), int256(60000e8), 0, 3600);
        vm.warp(block.timestamp + 1);
        market.resolveFromOracle(MID);

        // Alice (sole YES bettor) redeems the whole 40 pool minus 2% fee
        uint256 before = musd.balanceOf(alice);
        esc.redeem(MID, alice);
        uint256 got = musd.balanceOf(alice) - before;
        assertEq(got, (40 * DENOM * 9800) / 10_000, "40 pool minus 2% fee");

        // Bob (loser) can't redeem
        vm.expectRevert(PredictEscrow.NoWinningPosition.selector);
        esc.redeem(MID, bob);
    }
}
