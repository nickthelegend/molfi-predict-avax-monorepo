// Molfi — agent-native CONFIDENTIAL bet on Avalanche Fuji. No human in the loop.
//
// An autonomous agent spins up a fresh EVM wallet, is funded, generates a
// Groth16 proof for a HIDDEN side, commits the bet, then — after the market
// resolves from a REAL Chainlink BTC/USD feed — claims its winnings by proving
// in zero-knowledge that its note backed the winner. The side never touches the
// chain; the payout is unlinkable to the bet.
//
//   OPERATOR_KEY=0x... node demo/agent-confidential-bet.mjs
import { createPublicClient, createWalletClient, http, defineChain, parseEther, keccak256, toHex } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { groth16 } from "snarkjs";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

// ── deployed molfi contracts on Fuji (shared with the molfi-app deployment) ───
const MARKET = "0xF260A7a44c7e6868D124dFcC4F13982C2eF42f8f";
const CBET = "0xEd1db687779eE2646162b70Bd3838AF8f4EeF6B3";
const MUSD = "0xADE818616EA14903278E9cE11c2BfFfa4eEB682C";
const BTC_USD = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a"; // Chainlink BTC/USD (Fuji)
const DENOM = 10_000_000n;
const RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const HERE = fileURLToPath(new URL(".", import.meta.url));
const WASM = `${HERE}../../molfi-circuits/build/confidential_bet/confidential_bet_js/confidential_bet.wasm`;
const ZKEY = `${HERE}../../molfi-circuits/build/confidential_bet/final.zkey`;
const snow = (h) => `https://testnet.snowtrace.io/tx/${h}`;

const OP_KEY = process.env.OPERATOR_KEY;
if (!OP_KEY) { console.error("Set OPERATOR_KEY (deployer/admin/funder)."); process.exit(1); }

const chain = defineChain({ id: 43113, name: "fuji", nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const pub = createPublicClient({ chain, transport: http(RPC) });
const opWallet = createWalletClient({ account: privateKeyToAccount(OP_KEY), chain, transport: http(RPC) });

const MUSD_ABI = [
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
];
const MARKET_ABI = [
  { type: "function", name: "createPriceMarket", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }, { type: "string" }, { type: "uint64" }, { type: "address" }, { type: "int256" }, { type: "uint8" }, { type: "uint64" }], outputs: [] },
  { type: "function", name: "resolveFromOracle", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }], outputs: [] },
  { type: "function", name: "winningOutcome", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint32" }] },
];
const CBET_ABI = [
  { type: "function", name: "commit", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "registerRoot", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [
      { type: "bytes32" }, { type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }, { type: "uint256" }, { type: "uint256" }, { type: "address" }], outputs: [] },
];

const send = async (wallet, args) => { const h = await wallet.writeContract(args); await pub.waitForTransactionReceipt({ hash: h }); return h; };
const toSol = (p) => ({
  a: [BigInt(p.pi_a[0]), BigInt(p.pi_a[1])],
  b: [[BigInt(p.pi_b[0][1]), BigInt(p.pi_b[0][0])], [BigInt(p.pi_b[1][1]), BigInt(p.pi_b[1][0])]],
  c: [BigInt(p.pi_c[0]), BigInt(p.pi_c[1])],
});

console.log("\n  🤖 Molfi agent — confidential bet on Avalanche (no human)\n");

// 1) fresh agent wallet, funded by the operator (gas + mUSDC bankroll)
const agentKey = generatePrivateKey();
const agent = privateKeyToAccount(agentKey);
const agentWallet = createWalletClient({ account: agent, chain, transport: http(RPC) });
console.log(`  agent wallet: ${agent.address}`);
await send(opWallet, { address: MUSD, abi: MUSD_ABI, functionName: "mint", args: [agent.address, DENOM * 5n] });
const fundTx = await opWallet.sendTransaction({ to: agent.address, value: parseEther("0.05") });
await pub.waitForTransactionReceipt({ hash: fundTx });
console.log("  funded: 0.05 AVAX (gas) + mUSDC bankroll\n");

// 2) the agent decides a HIDDEN side and proves it in zero-knowledge
const side = 0; // 0 = YES (hidden — never goes on-chain)
const seed = BigInt(keccak256(toHex(agent.address + Date.now()))) % (2n ** 240n);
const input = {
  secret: String(seed), nullifier: String(seed + 1n), outcome: String(side),
  recipient: BigInt(agent.address).toString(),
  pathElements: ["1", "2", "3", "4", "5", "6", "7", "8"], pathIndices: ["0", "1", "0", "1", "0", "0", "1", "0"],
};
console.log("  generating Groth16 proof for a hidden-side bet…");
const { proof, publicSignals } = await groth16.fullProve(input, WASM, ZKEY);
const root = BigInt(publicSignals[0]); const nullifierHash = BigInt(publicSignals[1]);
const { a, b, c } = toSol(proof);

// 3) commit the bet (escrow denom) — side stays hidden
await send(agentWallet, { address: MUSD, abi: MUSD_ABI, functionName: "approve", args: [CBET, DENOM] });
const commitTx = await send(agentWallet, { address: CBET, abi: CBET_ABI, functionName: "commit", args: [nullifierHash] });
console.log(`  committed hidden bet · ${snow(commitTx)}`);

// 4) operator opens a market on the LIVE Chainlink BTC/USD feed + checkpoints root
const mid = keccak256(toHex(`molfi-agent-${agent.address}-${Date.now()}`));
const now = BigInt(Math.floor(Date.now() / 1000));
await send(opWallet, { address: MARKET, abi: MARKET_ABI, functionName: "createPriceMarket", args: [mid, "Will BTC be >= $50,000?", now, BTC_USD, 50000n * 10n ** 8n, 0, 86400n] });
await send(opWallet, { address: CBET, abi: CBET_ABI, functionName: "registerRoot", args: [root] });

// 5) resolve from Chainlink (permissionless)
const resolveTx = await send(opWallet, { address: MARKET, abi: MARKET_ABI, functionName: "resolveFromOracle", args: [mid] });
const winner = await pub.readContract({ address: MARKET, abi: MARKET_ABI, functionName: "winningOutcome", args: [mid] });
console.log(`  market resolved from Chainlink → winner ${winner === 0 ? "YES" : "NO"} · ${snow(resolveTx)}`);

// 6) the agent CLAIMS — proving its hidden side == the winner, unlinkable
const before = await pub.readContract({ address: MUSD, abi: MUSD_ABI, functionName: "balanceOf", args: [agent.address] });
const claimTx = await send(agentWallet, { address: CBET, abi: CBET_ABI, functionName: "claim", args: [mid, a, b, c, root, nullifierHash, agent.address] });
const after = await pub.readContract({ address: MUSD, abi: MUSD_ABI, functionName: "balanceOf", args: [agent.address] });
console.log(`  confidential claim · ${snow(claimTx)}`);
console.log(`\n  payout: ${Number(after - before) / 1e7} mUSDC (2× denom) — side never revealed on-chain`);
console.log(after - before === DENOM * 2n ? "\n  ✅ agent bet privately and won — end to end on Avalanche\n" : "\n  ✗ payout mismatch\n");
process.exit(after - before === DENOM * 2n ? 0 : 1);
