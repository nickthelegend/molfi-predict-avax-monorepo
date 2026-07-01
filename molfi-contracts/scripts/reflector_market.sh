#!/usr/bin/env bash
# Prove the REAL oracle path: create a price market wired to the live Reflector
# SEP-40 oracle, wait for close, then resolve_from_oracle — which reads
# Reflector's on-chain price and settles the outcome. No mock anywhere.
# Usage: bash scripts/reflector_market.sh [SYMBOL] [seconds_to_close]
set -eu
cd "$(dirname "$0")/.."
source deploy/testnet.env
NET=testnet
SYM="${1:-BTC}"
SECS="${2:-30}"
ORACLE="${REFLECTOR_ORACLE}"
txof() { grep -oE '/tx/[0-9a-f]{64}' | tail -n1 | cut -d/ -f3 || true; }
say() { printf "\n\033[1;35m▶ %s\033[0m\n" "$*"; }

say "1. Reading live $SYM price from Reflector ($ORACLE)"
PRICE=$(stellar contract invoke --source molfi --network "$NET" --id "$ORACLE" \
  -- lastprice --asset "{\"Other\":\"$SYM\"}" 2>/dev/null | tail -1 \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).price')
echo "   live price (1e14): $PRICE  (~\$$(node -pe "($PRICE/1e14).toLocaleString()"))"
# Threshold a hair below current so the live feed resolves YES deterministically.
THRESH=$(node -pe "Math.floor($PRICE*0.99).toString()")

CLOSE=$(( $(date +%s) + SECS ))
MKTID="5ef10000$(printf '%056x' $((RANDOM*RANDOM+RANDOM)))"
say "2. Creating market: Will $SYM be >= 99% of now, at close? (real Reflector)"
TX_CREATE=$(stellar contract invoke --source molfi --network "$NET" --id "$MARKET" \
  -- create_price_market --id "$MKTID" \
  --question "Will $SYM hold above its level at close? (real Reflector oracle)" \
  --close_ts "$CLOSE" --oracle "$ORACLE" --asset "{\"Other\":\"$SYM\"}" \
  --threshold "$THRESH" --op 0 --max_staleness 1800 2>&1 | txof)
echo "   create tx: $TX_CREATE"

say "3. Waiting for close, then resolving from Reflector"
while [ "$(date +%s)" -le "$CLOSE" ]; do sleep 3; done
TX_RESOLVE=$(stellar contract invoke --source molfi --network "$NET" --id "$MARKET" \
  -- resolve_from_oracle --id "$MKTID" 2>&1 | txof)
OUTCOME=$(stellar contract invoke --source molfi --network "$NET" --id "$MARKET" \
  -- winning_outcome --id "$MKTID" 2>/dev/null | tr -d '"')
echo "   resolve tx: $TX_RESOLVE"
echo "   outcome: $OUTCOME (0=YES, 1=NO) — settled by the live Reflector feed"

cat <<EOF

  market_id  = $MKTID
  oracle     = $ORACLE (Reflector, real)
  TX_CREATE  = $TX_CREATE
  TX_RESOLVE = $TX_RESOLVE
EOF
