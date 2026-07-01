#!/usr/bin/env bash
# Seed properly-timed crypto markets + run a real settlement e2e on testnet.
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env

RESULTS=deploy/crypto_v2_results.txt
: > "$RESULTS"

NOW=$(date +%s)
WEEK=$((NOW + 604800))     # +7d
FORT=$((NOW + 1209600))    # +14d
MONTH=$((NOW + 2592000))   # +30d
DEMO=$((NOW + 30))         # +30s (settlement demo)

WEEK_D=$(date -u -r "$WEEK" "+%b %-d, %Y")
FORT_D=$(date -u -r "$FORT" "+%b %-d, %Y")
MONTH_D=$(date -u -r "$MONTH" "+%b %-d, %Y")

# New market ids (32-byte hex) — distinct from the originally-seeded set.
BTC=c17c000000000000000000000000000000000000000000000000000000000010
ETH=e74c000000000000000000000000000000000000000000000000000000000011
SOL=501c000000000000000000000000000000000000000000000000000000000012
XLM=delc000000000000000000000000000000000000000000000000000000000013
DEMOID=dec0000000000000000000000000000000000000000000000000000000000019

inv() {
  local label="$1"; shift
  local out hash
  out=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- "$@" 2>&1)
  hash=$(echo "$out" | grep -oE "[0-9a-f]{64}" | head -1)
  printf '[%s] tx=%s %s\n' "$label" "${hash:-NONE}" "$(echo "$out" | grep -oiE 'error[^"]*' | head -1)" | tee -a "$RESULTS"
  sleep 3
}

echo "=== seed crypto markets ($(date -u +%FT%TZ)) ===" | tee -a "$RESULTS"
inv "create BTC"  create --id $BTC --question "Will BTC close above \$100,000 on $WEEK_D?"  --close_ts $WEEK
inv "create ETH"  create --id $ETH --question "Will ETH close above \$4,000 on $FORT_D?"    --close_ts $FORT
inv "create SOL"  create --id $SOL --question "Will SOL close above \$200 on $WEEK_D?"      --close_ts $WEEK
inv "create XLM"  create --id $XLM --question "Will XLM close above \$0.50 on $MONTH_D?"    --close_ts $MONTH

echo "=== settlement e2e (short-close demo market) ===" | tee -a "$RESULTS"
inv "create DEMO" create --id $DEMOID --question "Will BTC be above \$60k right now? (live settlement demo)" --close_ts $DEMO

echo "waiting for close (45s)…" | tee -a "$RESULTS"; sleep 45

for a in 1 2 3 4 5; do
  out=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- begin_resolution --id "$DEMOID" 2>&1)
  if echo "$out" | grep -qi "success\|^null"; then
    hash=$(echo "$out" | grep -oE "[0-9a-f]{64}" | head -1)
    printf '[begin_resolution] tx=%s\n' "${hash:-NONE}" | tee -a "$RESULTS"; break
  fi
  echo "  begin attempt $a: $(echo "$out" | grep -oiE 'tooearly|error[^"]*' | head -1)"; sleep 8
done

inv "resolve YES" resolve --id $DEMOID --outcome 0

echo "[verify] demo market state:" | tee -a "$RESULTS"
stellar contract invoke --source molfi --network testnet --id "$MARKET" -- get_market --id "$DEMOID" 2>&1 | tee -a "$RESULTS"

echo "=== done — markets now on-chain: ===" | tee -a "$RESULTS"
stellar contract invoke --source molfi --network testnet --id "$MARKET" -- markets 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print('count',len(d))" 2>/dev/null | tee -a "$RESULTS"
