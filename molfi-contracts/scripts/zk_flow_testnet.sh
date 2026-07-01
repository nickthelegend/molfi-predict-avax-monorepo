#!/usr/bin/env bash
# Run the ZK confidential-withdrawal flow on Stellar testnet and capture tx hashes.
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env

P=../molfi-circuits/build/withdraw/cli
PUB=$(cat "$P/public.json")     # ["root","nullifierHash","recipient","amount"]
PROOF=$(cat "$P/proof.json")    # {"a":..,"b":..,"c":..}
PUB0=$(node -pe "JSON.parse(process.argv[1])[0]" "$PUB")
PI=$(node -pe "JSON.stringify(JSON.parse(process.argv[1]).slice(1))" "$PUB")

RESULTS=deploy/e2e_results.txt
inv() { # $1=label, rest=invoke args (after the global options)
  local label="$1"; shift
  local out hash res
  out=$(stellar contract invoke --source molfi --network testnet "$@" 2>&1)
  hash=$(echo "$out" | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$")
  res=$(echo "$out" | grep -oE "Success.*|error.*" | head -1 | cut -c1-160)
  printf '[%s]\n  tx:     %s\n  result: %s\n' "$label" "${hash:-NONE}" "${res:-?}" | tee -a "$RESULTS"
  sleep 4
}

echo "=== ZK confidential-withdrawal flow ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ===" | tee -a "$RESULTS"

# 1. Standalone: verify the REAL Groth16 proof on-chain (returns true).
inv "verifier.verify (real Groth16 proof)" --id "$VERIFIER" -- verify --proof "$PROOF" --public_inputs "$PI" --domain "$PUB0"

# 2. Deposit 10 XLM collateral into the privacy pool.
inv "privacy_pool.deposit (10 XLM)" --id "$PRIVACY_POOL" -- deposit --from "$DEPLOYER" --commitment 0500000000000000000000000000000000000000000000000000000000000005 --amount 100000000

# 3. Checkpoint the circuit's Merkle root.
inv "privacy_pool.register_root" --id "$PRIVACY_POOL" -- register_root --root "$PUB0"

# 4. Confidential withdrawal, gated by the REAL proof + nullifier check.
inv "privacy_pool.withdraw (proof-gated)" --id "$PRIVACY_POOL" -- withdraw --proof "$PROOF" --public_signals "$PUB" --to "$DEPLOYER" --amount 100000000

echo "=== done ===" | tee -a "$RESULTS"
