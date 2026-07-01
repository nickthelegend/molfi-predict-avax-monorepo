#!/usr/bin/env bash
# Robust: seed remaining crypto markets + a real settlement e2e. Retries TxBadSeq.
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env

RESULTS=deploy/crypto_v3_results.txt
: > "$RESULTS"

WEEK_D=$(date -u -r "$(( $(date +%s) + 604800 ))" "+%b %-d, %Y")
FORT_D=$(date -u -r "$(( $(date +%s) + 1209600 ))" "+%b %-d, %Y")
MONTH_D=$(date -u -r "$(( $(date +%s) + 2592000 ))" "+%b %-d, %Y")

ETH=e74c000000000000000000000000000000000000000000000000000000000011
SOL=501c000000000000000000000000000000000000000000000000000000000012
XLM=a1c0000000000000000000000000000000000000000000000000000000000013

# create with retry (handles TxBadSeq / timeout)
create() {
  local label="$1" id="$2" q="$3" close="$4" a out hash
  for a in 1 2 3 4; do
    out=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- \
      create --id "$id" --question "$q" --close_ts "$close" 2>&1)
    if echo "$out" | grep -qiE "success|^null|MarketExists|#2"; then
      hash=$(echo "$out" | grep -oE "[0-9a-f]{64}" | head -1)
      printf '[%s] OK tx=%s\n' "$label" "${hash:-exists}" | tee -a "$RESULTS"; sleep 6; return
    fi
    echo "  $label attempt $a: $(echo "$out" | grep -oiE 'txbadseq|timeout|error[^"]*' | head -1)"; sleep 8
  done
  printf '[%s] FAILED\n' "$label" | tee -a "$RESULTS"
}

echo "=== seed remaining crypto markets ($(date -u +%FT%TZ)) ===" | tee -a "$RESULTS"
create "ETH" "$ETH" "Will ETH close above \$4,000 on $FORT_D?" "$(( $(date +%s) + 1209600 ))"
create "SOL" "$SOL" "Will SOL close above \$200 on $WEEK_D?"   "$(( $(date +%s) + 604800 ))"
create "XLM" "$XLM" "Will XLM close above \$0.50 on $MONTH_D?" "$(( $(date +%s) + 2592000 ))"

echo "=== settlement e2e ===" | tee -a "$RESULTS"
DEMOID=dec0000000000000000000000000000000000000000000000000000000000019
CLOSE=$(( $(date +%s) + 25 ))
create "DEMO" "$DEMOID" "Live settlement demo — resolves YES" "$CLOSE"

echo "waiting for close…" | tee -a "$RESULTS"; sleep 40

for a in 1 2 3 4 5 6; do
  out=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- begin_resolution --id "$DEMOID" 2>&1)
  if echo "$out" | grep -qiE "success|^null"; then
    hash=$(echo "$out" | grep -oE "[0-9a-f]{64}" | head -1)
    printf '[begin_resolution] OK tx=%s\n' "${hash:-NONE}" | tee -a "$RESULTS"; sleep 6; break
  fi
  echo "  begin attempt $a: $(echo "$out" | grep -oiE 'tooearly|#[0-9]|error[^"]*' | head -1)"; sleep 8
done

out=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- resolve --id "$DEMOID" --outcome 0 2>&1)
printf '[resolve YES] %s tx=%s\n' "$(echo "$out" | grep -oiE 'success|error[^"]*' | head -1)" "$(echo "$out" | grep -oE '[0-9a-f]{64}' | head -1)" | tee -a "$RESULTS"
sleep 5

echo "[verify] settled demo market:" | tee -a "$RESULTS"
stellar contract invoke --source molfi --network testnet --id "$MARKET" -- get_market --id "$DEMOID" 2>&1 | grep -oE '\{.*\}' | tee -a "$RESULTS"

echo "=== total markets on-chain: ===" | tee -a "$RESULTS"
stellar contract invoke --source molfi --network testnet --id "$MARKET" -- markets 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d))" 2>/dev/null | tee -a "$RESULTS"
