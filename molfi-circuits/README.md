# molfi-circuits

Circom circuits + **BN254** Groth16 tooling for Molfi's zero-knowledge layer.
Proofs generated here are verified **on-chain** by the Solidity `Groth16Verifier`
on Avalanche Fuji — see the passing `forge test` in
[`molfi-contracts`](../molfi-contracts) (real BN254 proof, not a stub).

> Migrated from the Stellar version's BLS12-381 + Soroban setup. Circom's default
> field is `bn128` (= BN254) and circomlib's Poseidon is BN254-native, so the EVM
> port recompiles the same circuits to the curve the EVM precompiles
> (`0x06`/`0x07`/`0x08`) support. The old BLS12-381 tooling (`scripts/build.sh`,
> `scripts/to_soroban.mjs`) is kept for reference only.

## Circuits

| Circuit | Statement | Public signals |
|---------|-----------|----------------|
| `confidential_bet.circom` | Prediction-market claim: knowledge of `(secret, nullifier, side)` for a commitment in a Poseidon Merkle tree, proving the note's hidden **side == the resolved winner** (injected as a public input) | outputs `[root, nullifierHash, outcome, recipient]` |
| `withdraw.circom` | Privacy-pool exit: knowledge of `(secret, nullifier)` for a commitment in a depth-8 Poseidon Merkle tree | `[root, nullifierHash, recipient, amount]` |
| `solvency.circom` | "I hold ≥ `threshold` collateral" — without revealing the balance | `[domain, threshold]` |
| `mul.circom` | Knowledge of `a,b` with `a·b = c` — minimal encoding canary | `[domain, c]` |

`confidential_bet` is the circuit used by the live product (the agent demo, the
backend ZK service, and the `ConfidentialBet` contract). It computes `root` as a
circuit **output**, so any valid `(secret, nullifier, side, path)` yields a fresh
proof with no field-specific JS hashing needed.

## Toolchain
- **circom 2** (BN254 / `bn128`, the default field) — binary in `bin/circom`
- **snarkjs 0.7** — Groth16 setup / prove / verify + Solidity export
- **circomlib** — Poseidon + comparators (range checks)

## Pipeline

```bash
npm install
# compile + powers-of-tau + setup + prove + off-chain verify (BN254)
bash scripts/build-bn254.sh confidential_bet 14

# export the Solidity verifier + calldata for the on-chain verifier
npx snarkjs zkey export solidityverifier build/confidential_bet/final.zkey Verifier.sol
npx snarkjs zkey export soliditycalldata build/confidential_bet/public.json \
  build/confidential_bet/proof.json
```

The exported `Groth16Verifier` is deployed on Fuji
(`0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB`) and exercised by
`molfi-contracts` `forge test` with a real proof.

## Solidity calldata encoding
`snarkjs ... soliditycalldata` emits `(uint256[2] a, uint256[2][2] b, uint256[2] c,
uint256[] pubSignals)`. Note snarkjs's **G2 coordinates are swapped** relative to
the on-chain verifier — the SDK's `toSol()` / backend `zk.js` handle the swap (see
`molfi-predict-sdk/demo/agent-confidential-bet.mjs`).

## Notes
- `build/` artifacts (ptau, zkey, wasm) are generated; only the `.circom` sources,
  scripts, and committed fixtures are needed to reproduce. The shared
  `pot_final.ptau` must be **power ≥ 14** for the larger circuits.
- Legacy BLS12-381 / Soroban byte-encoding tooling (`build.sh`, `to_soroban.mjs`)
  is retained from the Stellar version and is **not** part of the Avalanche path.
