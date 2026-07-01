// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MolfiMarket} from "../src/MolfiMarket.sol";
import {ConfidentialBet} from "../src/ConfidentialBet.sol";
import {MockUSD} from "../src/MockUSD.sol";

// Live molfi demo on Fuji: resolve a market from the REAL Chainlink BTC/USD feed,
// then claim a confidential (hidden-side) bet with a real BN254 ZK proof.
//   PRIVATE_KEY=0x... forge script script/LiveDemo.s.sol --rpc-url fuji --broadcast
contract LiveDemo is Script {
    address constant MARKET = 0x0B484b26906015eD387Ccd99C5199fB31f5F4683;
    address constant CBET = 0x784261E3959dE9EaA422102Ee5b67781448aAF21;
    address constant MUSD = 0xADE818616EA14903278E9cE11c2BfFfa4eEB682C;
    bytes32 constant MID = 0x3c452ecbcd4e5777da11955059dbfaa5f8a7dc38f9309e379d978a6459aaf501;
    uint256 constant DENOM = 10_000_000;

    uint256[2] A = [
        0x2a672cfe8e14c48bebc633b2d30811cde71870ce6d41300298b5faf881c884db,
        0x139039992459d896ea46d1b42a3442b9a9e4972dfa38142e57dd1f3285a021b2
    ];
    uint256[2][2] B = [
        [0x1bf2023e4beaf589a6ef7b86c0b7a959e337623d84dafcfde94bd9a5c6bb14f3, 0x2dc997bfd032beba1c2a761968785c395dfb253ee9d4e395279ce2ee10e679fd],
        [0x2dd2ecf78c3e7f8610abbc7ad1bef71ee776cc935cf1db06bf2d6d719b7ce837, 0x0e649a859e1ab4a500ae902dc3724599675e0526d231a0cf6ac2940bd3e4acad]
    ];
    uint256[2] C = [
        0x076889a9ac4001d6bdb19f3f78547a818d1ee4c12d170d50cbc0f33b9009a230,
        0x0e9f60c5e1d82993e52e10e346a6811cb9d1774e367ce39beb91a304f46a3a56
    ];
    uint256 constant ROOT = 11323959007800747051345298391989773091321271562071727349068255722042326386451;
    uint256 constant NULLIFIER = 21484669546358335811058320782594337224184293469722637179181513335025929373146;
    uint256 constant RECIPIENT_FIELD = 987654321987654321;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address recipient = address(uint160(RECIPIENT_FIELD));

        vm.startBroadcast(pk);
        // 1) resolve from the LIVE Chainlink BTC/USD feed (permissionless)
        if (!MolfiMarket(MARKET).isResolved(MID)) {
            MolfiMarket(MARKET).resolveFromOracle(MID);
        }
        // 2) a hidden-side bet + checkpoint the off-chain Poseidon root
        MockUSD(MUSD).approve(CBET, DENOM);
        ConfidentialBet(CBET).commit(uint256(0xC0FFEE));
        ConfidentialBet(CBET).registerRoot(ROOT);
        // 3) confidential claim: prove the note's hidden side == Chainlink winner
        uint256 before = MockUSD(MUSD).balanceOf(recipient);
        ConfidentialBet(CBET).claim(MID, A, B, C, ROOT, NULLIFIER, recipient);
        vm.stopBroadcast();

        console.log("Chainlink winner (0=YES,1=NO):", MolfiMarket(MARKET).winningOutcome(MID));
        console.log("recipient payout (mUSDC base units):", MockUSD(MUSD).balanceOf(recipient) - before);
        console.log("nullifier burned:", ConfidentialBet(CBET).nullifierUsed(NULLIFIER));
    }
}
