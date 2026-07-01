#!/usr/bin/env bash
# Create a few oracle-resolved markets ON-CHAIN — settled by the REAL Reflector
# SEP-40 price feed — and write their ids to molfi-backend/onchain_markets.json,
# which the backend serves at /api/onchain/markets so SDK agents + the web app
# know what they can bet on. The threshold for each is the *current* Reflector
# price, so it's a genuine "will X be above now at close?" market.
# Usage: bash scripts/seed_onchain_markets.sh [minutes_to_close]
set -eu
cd "$(dirname "$0")/.."
source deploy/testnet.env
NET=testnet
MINS="${1:-30}"
CLOSE=$(( $(date +%s) + MINS*60 ))
export OUT="../molfi-backend/onchain_markets.json"
ORACLE="${REFLECTOR_ORACLE}"   # real Reflector CEX/DEX feed (decimals 14)

say() { printf "\n\033[1;35m▶ %s\033[0m\n" "$*"; }
send() { local l="$1"; shift; local o; if ! o=$("$@" 2>&1); then { echo "‼ $l:"; echo "$o"|grep -iE "error|#[0-9]"|tail -4; } >&2; return 1; fi; }
price_of() {
  stellar contract invoke --source molfi --network "$NET" --id "$ORACLE" \
    -- lastprice --asset "{\"Other\":\"$1\"}" 2>/dev/null | tail -1 \
    | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).price'
}

SYMS=(BTC ETH SOL)
ENTRIES=()
for SYM in "${SYMS[@]}"; do
  PRICE=$(price_of "$SYM")
  [ -n "$PRICE" ] || { echo "no Reflector price for $SYM, skipping"; continue; }
  MKTID="0c0a$(printf '%060x' $((RANDOM*RANDOM+RANDOM)))"
  Q="Will ${SYM} be above its current price at close? (on-chain · Reflector · ${MINS}m)"
  say "creating on-chain $SYM market (Reflector threshold $PRICE)"
  send create stellar contract invoke --source molfi --network "$NET" --id "$MARKET" \
    -- create_price_market --id "$MKTID" --question "$Q" --close_ts "$CLOSE" \
    --oracle "$ORACLE" --asset "{\"Other\":\"$SYM\"}" --threshold "$PRICE" --op 0 --max_staleness 1800 >/dev/null
  ENTRIES+=("{\"marketId\":\"$MKTID\",\"symbol\":\"$SYM\",\"question\":\"$Q\",\"closeTs\":$((CLOSE*1000)),\"oracle\":\"reflector\",\"resolved\":false}")
done

node -e '
  const fs=require("fs");
  const entries = process.argv.slice(1).map(s=>JSON.parse(s));
  fs.writeFileSync(process.env.OUT, JSON.stringify(entries, null, 2));
  console.log("wrote "+entries.length+" Reflector-settled on-chain markets → "+process.env.OUT);
' "${ENTRIES[@]}"
node -e 'console.log(require("fs").readFileSync(process.env.OUT,"utf8"))'
