// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MolfiMarket} from "../src/MolfiMarket.sol";
import {ConfidentialBet, IERC20, IConfidentialBetVerifier, IMolfiMarket} from "../src/ConfidentialBet.sol";
import {PredictEscrow, IPredictVerifier, IMarketRef, IERC20 as IEscrowERC20} from "../src/PredictEscrow.sol";
import {MockUSD} from "../src/MockUSD.sol";

// Deploy the FULL molfi trading stack the React app talks to: the enhanced
// (enumerable) MolfiMarket, the public pari-mutuel PredictEscrow, and the
// confidential ConfidentialBet — reusing the already-deployed mUSDC + verifier —
// then seed a spread of markets on the LIVE Chainlink BTC/USD feed.
//   PRIVATE_KEY=0x... forge script script/DeployApp.s.sol --rpc-url fuji --broadcast
contract DeployApp is Script {
    address constant BTC_USD = 0x31CF013A08c6Ac228C94551d535d5BAfE19c602a; // Chainlink Fuji, 8 decimals
    address constant MUSD = 0xADE818616EA14903278E9cE11c2BfFfa4eEB682C; // existing mUSDC
    address constant VERIFIER = 0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB; // existing Groth16 verifier
    uint256 constant DENOM = 10_000_000; // 1 mUSDC (7 decimals)

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address dep = vm.addr(pk);

        vm.startBroadcast(pk);
        MolfiMarket market = new MolfiMarket();
        ConfidentialBet cbet = new ConfidentialBet(
            IERC20(MUSD), IConfidentialBetVerifier(VERIFIER), IMolfiMarket(address(market)), DENOM
        );
        PredictEscrow escrow = new PredictEscrow(
            IEscrowERC20(MUSD), IPredictVerifier(VERIFIER), IMarketRef(address(market)), dep
        );

        // payout liquidity for confidential 2x claims + a faucet balance for the deployer
        MockUSD(MUSD).mint(address(cbet), 100_000 * DENOM);
        MockUSD(MUSD).mint(dep, 50_000 * DENOM);

        // A spread of markets on the LIVE Chainlink BTC/USD feed. `op` 0 = YES iff
        // price >= threshold. closeTs = now → resolvable immediately; +7d → open.
        uint64 nowTs = uint64(block.timestamp);
        uint64 wk = nowTs + 7 days;
        _seed(market, "molfi:BTC>=50k@now", "Is BTC >= $50,000 right now?", nowTs, int256(50_000e8));
        _seed(market, "molfi:BTC>=100k@now", "Is BTC >= $100,000 right now?", nowTs, int256(100_000e8));
        _seed(market, "molfi:BTC>=75k@7d", "Will BTC be >= $75,000 in 7 days?", wk, int256(75_000e8));
        _seed(market, "molfi:BTC>=120k@7d", "Will BTC hit $120,000 within 7 days?", wk, int256(120_000e8));
        _seed(market, "molfi:BTC>=90k@7d", "Will BTC be >= $90,000 in 7 days?", wk, int256(90_000e8));
        vm.stopBroadcast();

        console.log("MOLFI_MARKET=%s", address(market));
        console.log("MOLFI_CBET=%s", address(cbet));
        console.log("MOLFI_ESCROW=%s", address(escrow));
        console.log("MOLFI_MUSD=%s", MUSD);
        console.log("MOLFI_VERIFIER=%s", VERIFIER);
        console.log("MOLFI_BTC_USD_FEED=%s", BTC_USD);
        console.log("market count:", market.markets().length);
    }

    function _seed(MolfiMarket market, string memory key, string memory q, uint64 closeTs, int256 threshold)
        internal
    {
        bytes32 id = keccak256(bytes(key));
        market.createPriceMarket(id, q, closeTs, BTC_USD, threshold, 0, 86400);
        console.logBytes32(id);
    }
}
