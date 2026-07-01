// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MolfiMarket} from "../src/MolfiMarket.sol";
import {ConfidentialBet, IERC20, IConfidentialBetVerifier, IMolfiMarket} from "../src/ConfidentialBet.sol";
import {ConfidentialBetVerifier} from "../src/ConfidentialBetVerifier.sol";
import {MockUSD} from "../src/MockUSD.sol";

// Deploy molfi to Avalanche Fuji, with a demo market on the REAL Chainlink
// BTC/USD feed.
//   PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url fuji --broadcast
contract Deploy is Script {
    // Chainlink BTC/USD on Fuji (8 decimals).
    address constant BTC_USD = 0x31CF013A08c6Ac228C94551d535d5BAfE19c602a;
    uint256 constant DENOM = 10_000_000; // 1 mUSDC (7 decimals)

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address dep = vm.addr(pk);

        vm.startBroadcast(pk);
        ConfidentialBetVerifier verifier = new ConfidentialBetVerifier();
        MockUSD musd = new MockUSD();
        MolfiMarket market = new MolfiMarket();
        ConfidentialBet cbet = new ConfidentialBet(
            IERC20(address(musd)), IConfidentialBetVerifier(address(verifier)), IMolfiMarket(address(market)), DENOM
        );
        // payout liquidity + a faucet balance for the deployer
        musd.mint(address(cbet), 100_000 * DENOM);
        musd.mint(dep, 10_000 * DENOM);

        // Demo market on the LIVE Chainlink BTC/USD feed: YES iff BTC >= $50k at
        // close. closeTs = now, so it can be resolved immediately.
        bytes32 mid = keccak256("molfi-demo:BTC>=50k");
        market.createPriceMarket(
            mid, "Will BTC be >= $50,000 at close?", uint64(block.timestamp), BTC_USD, int256(50000e8), 0, 86400
        );
        vm.stopBroadcast();

        console.log("NULLBET_VERIFIER=%s", address(verifier));
        console.log("MOLFI_MUSD=%s", address(musd));
        console.log("MOLFI_MARKET=%s", address(market));
        console.log("MOLFI_CBET=%s", address(cbet));
        console.log("MOLFI_BTC_USD_FEED=%s", BTC_USD);
        console.logBytes32(mid);
    }
}
