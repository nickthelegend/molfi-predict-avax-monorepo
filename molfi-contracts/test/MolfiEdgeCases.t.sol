// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Test} from "forge-std/Test.sol";
import {MolfiMarket, IAggregatorV3} from "../src/MolfiMarket.sol";
import {ConfidentialBetVerifier} from "../src/ConfidentialBetVerifier.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {PredictEscrow, IPredictVerifier, IMarketRef, IERC20 as IEscrowERC20} from "../src/PredictEscrow.sol";

/// Edge-case + integration coverage layered on top of Molfi.t.sol's happy-path
/// suite: PredictEscrow.betZk (real BN254 proof), multi-bettor cross-vault
/// pari-mutuel payouts, double-redeem, unresolved/nonexistent markets, MockUSD
/// ERC20 semantics, and MolfiMarket admin/lifecycle guards.
contract MolfiEdgeCasesTest is Test {
    MolfiMarket market;
    ConfidentialBetVerifier verifier;
    MockUSD musd;
    MockAggregator feed;
    PredictEscrow esc;

    uint256 constant DENOM = 10_000_000; // 1 unit (7 decimals)
    bytes32 constant MID = keccak256("BTC>=60k @ close");
    address vault = address(0xFEE5);

    // Same REAL Groth16 proof fixture as Molfi.t.sol (snarkjs soliditycalldata).
    // pubSignals for betZk = [root, nullifierHash, outcome(0=YES), recipient].
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
    uint256 constant ROOT = 11323959007800747051345298391989773091321271562071727349068255722042326386451;
    uint256 constant NULLIFIER = 21484669546358335811058320782594337224184293469722637179181513335025929373146;
    uint256 constant RECIPIENT_FIELD = 987654321987654321;
    address recipient;

    function setUp() public {
        recipient = address(uint160(RECIPIENT_FIELD));
        verifier = new ConfidentialBetVerifier();
        musd = new MockUSD();
        market = new MolfiMarket();
        feed = new MockAggregator(int256(65000e8), 8); // BTC = $65k (>= $60k → YES)
        esc = new PredictEscrow(
            IEscrowERC20(address(musd)), IPredictVerifier(address(verifier)), IMarketRef(address(market)), vault
        );
    }

    // ── PredictEscrow.betZk: real BN254 proof gates the bet ─────────────────

    function test_BetZkAcceptsValidProofAndEscrows() public {
        musd.mint(recipient, 100 * DENOM);
        vm.startPrank(recipient);
        musd.approve(address(esc), DENOM);
        // pubSignals = [root, nullifierHash, outcome(0=YES), recipient]
        uint256[4] memory pub = [ROOT, NULLIFIER, uint256(0), RECIPIENT_FIELD];
        esc.betZk(MID, 0, DENOM, A, B, C, pub);
        vm.stopPrank();

        assertEq(esc.position(MID, 0, recipient), DENOM);
        assertEq(esc.total(MID), DENOM);
        assertTrue(esc.nullifierUsed(NULLIFIER));
    }

    function test_BetZkRejectsReusedNullifier() public {
        musd.mint(recipient, 100 * DENOM);
        vm.startPrank(recipient);
        musd.approve(address(esc), 2 * DENOM);
        uint256[4] memory pub = [ROOT, NULLIFIER, uint256(0), RECIPIENT_FIELD];
        esc.betZk(MID, 0, DENOM, A, B, C, pub);

        vm.expectRevert(PredictEscrow.NullifierSpent.selector);
        esc.betZk(MID, 0, DENOM, A, B, C, pub);
        vm.stopPrank();
    }

    function test_BetZkRejectsBadProof_WrongOutcome() public {
        musd.mint(recipient, 100 * DENOM);
        vm.startPrank(recipient);
        musd.approve(address(esc), DENOM);
        // Proof commits to outcome 0 (YES); asserting outcome 1 here must fail
        // verification since the public signal is baked into the proof.
        uint256[4] memory pub = [ROOT, NULLIFIER, uint256(1), RECIPIENT_FIELD];
        vm.expectRevert(PredictEscrow.BadProof.selector);
        esc.betZk(MID, 1, DENOM, A, B, C, pub);
        vm.stopPrank();
    }

    function test_BetZkRejectsBadProof_WrongRecipientField() public {
        musd.mint(recipient, 100 * DENOM);
        vm.startPrank(recipient);
        musd.approve(address(esc), DENOM);
        uint256[4] memory pub = [ROOT, NULLIFIER, uint256(0), RECIPIENT_FIELD + 1];
        vm.expectRevert(PredictEscrow.BadProof.selector);
        esc.betZk(MID, 0, DENOM, A, B, C, pub);
        vm.stopPrank();
    }

    // ── Multi-bettor pari-mutuel cross-vault payout (exact 98%/2% split) ────

    function test_MultiBettorPariMutuelExactVaultSplit() public {
        address alice = address(0xA11CE);
        address bob = address(0xB0B);
        address carol = address(0xCA501);
        musd.mint(alice, 100 * DENOM);
        musd.mint(bob, 100 * DENOM);
        musd.mint(carol, 100 * DENOM);

        // Alice 20 YES, Carol 40 YES, Bob 15 NO → total 75, YES pool 60
        vm.startPrank(alice);
        musd.approve(address(esc), 20 * DENOM);
        esc.bet(MID, 0, 20 * DENOM);
        vm.stopPrank();

        vm.startPrank(carol);
        musd.approve(address(esc), 40 * DENOM);
        esc.bet(MID, 0, 40 * DENOM);
        vm.stopPrank();

        vm.startPrank(bob);
        musd.approve(address(esc), 15 * DENOM);
        esc.bet(MID, 1, 15 * DENOM);
        vm.stopPrank();

        assertEq(esc.total(MID), 75 * DENOM);
        assertEq(esc.pool(MID, 0), 60 * DENOM);
        assertEq(esc.pool(MID, 1), 15 * DENOM);

        market.createPriceMarket(MID, "q", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
        market.resolveFromOracle(MID); // YES wins ($65k >= $60k)

        uint256 vaultBefore = musd.balanceOf(vault);

        // Alice: gross = 20/60 * 75 = 25; fee = 25*2% = 0.5; net = 24.5
        uint256 aliceBefore = musd.balanceOf(alice);
        esc.redeem(MID, alice);
        uint256 aliceGot = musd.balanceOf(alice) - aliceBefore;
        assertEq(aliceGot, (25 * DENOM * 9800) / 10_000, "alice net 24.5");

        // Carol: gross = 40/60 * 75 = 50; fee = 1; net = 49
        uint256 carolBefore = musd.balanceOf(carol);
        esc.redeem(MID, carol);
        uint256 carolGot = musd.balanceOf(carol) - carolBefore;
        assertEq(carolGot, (50 * DENOM * 9800) / 10_000, "carol net 49");

        // Exact fee accounting: vault received the sum of both fees (0.5 + 1 = 1.5)
        uint256 vaultGot = musd.balanceOf(vault) - vaultBefore;
        uint256 expectedFees = (25 * DENOM * 200) / 10_000 + (50 * DENOM * 200) / 10_000;
        assertEq(vaultGot, expectedFees, "vault collected exact 2% of both winners' gross");

        // Sanity: winners' net + vault fees == the whole pool they redeemed from
        assertEq(aliceGot + carolGot + vaultGot, 75 * DENOM, "conservation of funds");

        // Bob (loser) cannot redeem
        vm.expectRevert(PredictEscrow.NoWinningPosition.selector);
        esc.redeem(MID, bob);
    }

    function test_DoubleRedeemReverts() public {
        address alice = address(0xA11CE);
        musd.mint(alice, 100 * DENOM);
        vm.startPrank(alice);
        musd.approve(address(esc), 10 * DENOM);
        esc.bet(MID, 0, 10 * DENOM);
        vm.stopPrank();

        market.createPriceMarket(MID, "q", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
        market.resolveFromOracle(MID);

        esc.redeem(MID, alice);
        vm.expectRevert(PredictEscrow.AlreadyRedeemed.selector);
        esc.redeem(MID, alice);
    }

    function test_RedeemBeforeResolutionReverts() public {
        address alice = address(0xA11CE);
        musd.mint(alice, 100 * DENOM);
        vm.startPrank(alice);
        musd.approve(address(esc), 10 * DENOM);
        esc.bet(MID, 0, 10 * DENOM);
        vm.stopPrank();

        // market not even created yet → isResolved() reads default false
        vm.expectRevert(PredictEscrow.NotResolved.selector);
        esc.redeem(MID, alice);
    }

    function test_BetZeroAmountReverts() public {
        address alice = address(0xA11CE);
        musd.mint(alice, 100 * DENOM);
        vm.startPrank(alice);
        musd.approve(address(esc), 10 * DENOM);
        vm.expectRevert(PredictEscrow.ZeroAmount.selector);
        esc.bet(MID, 0, 0);
        vm.stopPrank();
    }

    function test_BetWithoutApprovalReverts() public {
        address alice = address(0xA11CE);
        musd.mint(alice, 100 * DENOM);
        vm.prank(alice);
        vm.expectRevert("allowance");
        esc.bet(MID, 0, 10 * DENOM);
    }

    // ── MockUSD ERC20 semantics ──────────────────────────────────────────────

    function test_MockUSD_ApproveAllowanceTransferFrom() public {
        address alice = address(0xA11CE);
        address spender = address(0xBEEF);
        musd.mint(alice, 100 * DENOM);

        vm.prank(alice);
        musd.approve(spender, 40 * DENOM);
        assertEq(musd.allowance(alice, spender), 40 * DENOM);

        vm.prank(spender);
        musd.transferFrom(alice, spender, 15 * DENOM);
        assertEq(musd.balanceOf(spender), 15 * DENOM);
        assertEq(musd.balanceOf(alice), 85 * DENOM);
        // allowance decreases by exactly the spent amount
        assertEq(musd.allowance(alice, spender), 25 * DENOM);
    }

    function test_MockUSD_TransferFromRevertsOverAllowance() public {
        address alice = address(0xA11CE);
        address spender = address(0xBEEF);
        musd.mint(alice, 100 * DENOM);
        vm.prank(alice);
        musd.approve(spender, 5 * DENOM);

        vm.prank(spender);
        vm.expectRevert("allowance");
        musd.transferFrom(alice, spender, 6 * DENOM);
    }

    function test_MockUSD_InfiniteApprovalNeverDecrements() public {
        address alice = address(0xA11CE);
        address spender = address(0xBEEF);
        musd.mint(alice, 100 * DENOM);
        vm.prank(alice);
        musd.approve(spender, type(uint256).max);

        vm.prank(spender);
        musd.transferFrom(alice, spender, 50 * DENOM);
        assertEq(musd.allowance(alice, spender), type(uint256).max, "infinite approval unchanged");
    }

    function test_MockUSD_TransferRevertsOnInsufficientBalance() public {
        address alice = address(0xA11CE);
        musd.mint(alice, 5 * DENOM);
        vm.prank(alice);
        vm.expectRevert("balance");
        musd.transfer(address(0xBEEF), 6 * DENOM);
    }

    // ── MolfiMarket admin / lifecycle guards ────────────────────────────────

    function test_CreateRevertsForNonAdmin() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(MolfiMarket.NotAdmin.selector);
        market.create(MID, "q", uint64(block.timestamp + 1));
    }

    function test_CreatePriceMarketRevertsForNonAdmin() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(MolfiMarket.NotAdmin.selector);
        market.createPriceMarket(MID, "q", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
    }

    function test_DuplicateCreateReverts() public {
        market.create(MID, "q", uint64(block.timestamp + 1));
        vm.expectRevert(MolfiMarket.Exists.selector);
        market.create(MID, "q2", uint64(block.timestamp + 2));
    }

    function test_DuplicateCreatePriceMarketReverts() public {
        market.createPriceMarket(MID, "q", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
        vm.expectRevert(MolfiMarket.Exists.selector);
        market.createPriceMarket(MID, "q2", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
    }

    function test_ResolveFromOracleRevertsBeforeClose() public {
        market.createPriceMarket(
            MID, "q", uint64(block.timestamp + 3600), address(feed), int256(60000e8), 0, 3600
        );
        vm.expectRevert(MolfiMarket.NotClosed.selector);
        market.resolveFromOracle(MID);
    }

    function test_ResolveFromOracleRevertsIfAlreadyResolved() public {
        market.createPriceMarket(MID, "q", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
        market.resolveFromOracle(MID);
        vm.expectRevert(MolfiMarket.AlreadyResolved.selector);
        market.resolveFromOracle(MID);
    }

    function test_ResolveFromOracleRevertsOnMissingMarket() public {
        vm.expectRevert(MolfiMarket.Missing.selector);
        market.resolveFromOracle(MID);
    }

    function test_ResolveFromOracle_NoOutcome() public {
        // price below threshold → NO (outcome 1)
        feed.setAnswer(int256(40000e8));
        market.createPriceMarket(MID, "q", uint64(block.timestamp), address(feed), int256(60000e8), 0, 3600);
        market.resolveFromOracle(MID);
        assertTrue(market.isResolved(MID));
        assertEq(market.winningOutcome(MID), 1, "NO wins");
        (,, uint8 status, uint32 outcome) = market.getMarket(MID);
        assertEq(status, 2, "Resolved");
        assertEq(outcome, 1);
    }

    function test_AdminResolveFallback() public {
        market.create(MID, "non-price market", uint64(block.timestamp + 1));
        market.resolve(MID, 1);
        assertTrue(market.isResolved(MID));
        assertEq(market.winningOutcome(MID), 1);
    }

    function test_AdminResolveRevertsForNonAdmin() public {
        market.create(MID, "q", uint64(block.timestamp + 1));
        vm.prank(address(0xBAD));
        vm.expectRevert(MolfiMarket.NotAdmin.selector);
        market.resolve(MID, 0);
    }

    function test_AdminResolveRevertsOnMissingMarket() public {
        vm.expectRevert(MolfiMarket.Missing.selector);
        market.resolve(MID, 0);
    }

    function test_WinningOutcomeRevertsIfUnresolved() public {
        market.create(MID, "q", uint64(block.timestamp + 1));
        vm.expectRevert("not resolved");
        market.winningOutcome(MID);
    }

    function test_GetMarketRevertsOnMissing() public {
        vm.expectRevert("missing");
        market.getMarket(MID);
    }

    function test_BetOnNonexistentMarketStillEscrows() public {
        // PredictEscrow.bet doesn't check market existence up front — only
        // redeem() gates on resolution. Confirm the escrow accepts a stake on
        // an id that has no corresponding MolfiMarket entry (yet), and that
        // redeeming against it correctly reverts NotResolved.
        address alice = address(0xA11CE);
        bytes32 ghost = keccak256("no-such-market");
        musd.mint(alice, 10 * DENOM);
        vm.startPrank(alice);
        musd.approve(address(esc), 10 * DENOM);
        esc.bet(ghost, 0, 10 * DENOM);
        vm.stopPrank();
        assertEq(esc.total(ghost), 10 * DENOM);

        vm.expectRevert(PredictEscrow.NotResolved.selector);
        esc.redeem(ghost, alice);
    }
}
