#!/usr/bin/env bash
# Drive a market through its lifecycle on testnet and capture tx hashes.
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env

MKT=b7000000000000000000000000000000000000000000000000000000000000b8
RESULTS=deploy/e2e_results.txt
inv() {
  local label="$1"; shift
  local out hash res
  out=$(stellar contract invoke --source molfi --network testnet "$@" 2>&1)
  hash=$(echo "$out" | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$")
  res=$(echo "$out" | grep -oE "Success.*|error.*" | head -1 | cut -c1-160)
  printf '[%s]\n  tx:     %s\n  result: %s\n' "$label" "${hash:-NONE}" "${res:-?}" | tee -a "$RESULTS"
  sleep 4
}

echo "=== market lifecycle ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ===" | tee -a "$RESULTS"

# Move past the trading window (close time already elapsed).
for a in 1 2 3 4 5; do
  out=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- begin_resolution --id "$MKT" 2>&1)
  if echo "$out" | grep -q "Success"; then
    hash=$(echo "$out" | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$")
    printf '[market.begin_resolution]\n  tx:     %s\n' "$hash" | tee -a "$RESULTS"
    break
  fi
  echo "  begin_resolution attempt $a: $(echo "$out" | grep -oE 'TooEarly|error.*' | head -1)"
  sleep 8
done

# Resolve YES (outcome 0).
inv "market.resolve (YES)" --id "$MARKET" -- resolve --id "$MKT" --outcome 0

# Read back the settled outcome (0 = YES).
echo "[market.winning_outcome read]" | tee -a "$RESULTS"
stellar contract invoke --source molfi --network testnet --id "$MARKET" -- winning_outcome --id "$MKT" 2>&1 | grep -oE "^[0-9]+$|Success.*" | head -1 | sed 's/^/  outcome: /' | tee -a "$RESULTS"

echo "=== done ===" | tee -a "$RESULTS"
