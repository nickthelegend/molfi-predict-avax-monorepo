#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Molfi — Groth16-gated PRIVATE bet, end to end on Stellar testnet.
#
# Generates a FRESH zk proof (new nullifier), then places a bet through
# predict-escrow.bet_zk, which:
#   • verifies the BLS12-381 Groth16 proof on-chain via the verifier contract,
#   • burns the proof's nullifier (anti-replay), and
#   • escrows real mUSDC.
# Then it resolves the market from the oracle and redeems — so the whole
# private-bet lifecycle is one real on-chain run. Re-runnable (fresh proof each
# time). Usage: bash scripts/zk_onchain_bet.sh
# ─────────────────────────────────────────────────────────────────────────────
set -eu
cd "$(dirname "$0")/.."
source deploy/testnet.env
NET=testnet
CIRCDIR=../molfi-circuits
CIRC="$CIRCDIR/build/withdraw/cli"

say() { printf "\n\033[1;35m▶ %s\033[0m\n" "$*"; }
send() {
  local label="$1"; shift; local out
  if ! out=$("$@" 2>&1); then
    { echo "‼ $label FAILED:"; echo "$out" | grep -iE "error|panic|#[0-9]" | tail -6; } >&2; return 1
  fi
  echo "$out" | grep -oE '/tx/[0-9a-f]{64}' | tail -n1 | cut -d/ -f3
}
read_val() { "$@" 2>/dev/null | tail -n1 | tr -d '"'; }

# 1) Fresh zk proof (unique nullifier + recipient → unique escrow nullifier) ────
say "1. Generating a fresh BLS12-381 Groth16 proof (new nullifier)"
SEED="${RANDOM}${RANDOM}${RANDOM}"
REC="${RANDOM}${RANDOM}${RANDOM}${RANDOM}"
( cd "$CIRCDIR"
  node -e '
    const fs=require("fs"); const f="inputs/withdraw.input.json"; const j=JSON.parse(fs.readFileSync(f));
    j.nullifier=process.argv[1]; j.secret=process.argv[2]; j.recipient=process.argv[3];
    fs.writeFileSync(f, JSON.stringify(j,null,2));
  ' "$SEED" "9${SEED}" "$REC"
  node build/withdraw/withdraw_js/generate_witness.js build/withdraw/withdraw_js/withdraw.wasm inputs/withdraw.input.json build/withdraw/witness.wtns
  npx --no-install snarkjs groth16 prove build/withdraw/final.zkey build/withdraw/witness.wtns build/withdraw/proof.json build/withdraw/public.json >/dev/null
  npx --no-install snarkjs groth16 verify build/withdraw/vkey.json build/withdraw/public.json build/withdraw/proof.json
  node scripts/emit_cli.mjs withdraw >/dev/null
)
echo "   off-chain proof OK; escrow-nullifier = $(node -pe 'JSON.parse(require("fs").readFileSync("'"$CIRC"'/public.json"))[2]' | cut -c1-16)…"

# 2) Fresh agent wallet + faucet ───────────────────────────────────────────────
say "2. Fresh agent wallet + mUSDC faucet"
AGENT="molfi_zk_$$"
stellar keys generate "$AGENT" --network "$NET" --fund >/dev/null 2>&1
AGENT_ADDR=$(stellar keys address "$AGENT")
send faucet stellar contract invoke --source "$AGENT" --network "$NET" --id "$MUSDC" -- faucet --to "$AGENT_ADDR" >/dev/null
echo "   agent: $AGENT_ADDR"

# 3) Oracle market ─────────────────────────────────────────────────────────────
say "3. Oracle market (BTC >= \$60k?)"
CLOSE=$(( $(date +%s) + 60 ))
MKTID="2c2c$(printf '%060x' $((RANDOM*RANDOM+RANDOM)))"
send setprice stellar contract invoke --source molfi --network "$NET" --id "$MOCK_ORACLE" -- set_price --price 7000000000000000000 >/dev/null
TX_CREATE=$(send create stellar contract invoke --source molfi --network "$NET" --id "$MARKET" \
  -- create_price_market --id "$MKTID" --question "ZK private bet demo: BTC >= 60000" \
  --close_ts "$CLOSE" --oracle "$MOCK_ORACLE" --asset '{"Other":"BTC"}' \
  --threshold 6000000000000000000 --op 0 --max_staleness 3600)
echo "   market: $MKTID"

# 4) ZK-gated bet (proof verified on-chain + escrow) ───────────────────────────
say "4. Agent places a Groth16-gated YES bet — proof verified ON-CHAIN + 500 mUSDC escrowed"
PROOF=$(cat "$CIRC/proof.json"); PUB=$(cat "$CIRC/public.json")
DOMAIN=$(node -pe "JSON.parse(process.argv[1])[0]" "$PUB")
PI=$(node -pe "JSON.stringify(JSON.parse(process.argv[1]).slice(1))" "$PUB")
TX_BET_ZK=$(send bet_zk stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" \
  -- bet_zk --market_id "$MKTID" --bettor "$AGENT_ADDR" --outcome 0 --amount 5000000000 \
  --proof "$PROOF" --public_inputs "$PI" --domain "$DOMAIN")
echo "   ✓ ZK bet tx: $TX_BET_ZK"
echo "   nullifier now consumed on-chain: $(read_val stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" -- nullifier_used --nullifier "$(node -pe 'JSON.parse(require("fs").readFileSync("'"$CIRC"'/public.json"))[2]')")"

# 5) Resolve + redeem ──────────────────────────────────────────────────────────
say "5. Resolve from oracle + redeem"
while [ "$(date +%s)" -le "$CLOSE" ]; do sleep 3; done
TX_RESOLVE=$(send resolve stellar contract invoke --source "$AGENT" --network "$NET" --id "$MARKET" -- resolve_from_oracle --id "$MKTID")
TX_REDEEM=$(send redeem stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" -- redeem --market_id "$MKTID" --bettor "$AGENT_ADDR")

say "DONE — private (ZK-verified) bet, settled and redeemed on-chain."
cat <<EOF

  agent       = $AGENT_ADDR
  market_id   = $MKTID
  TX_CREATE   = $TX_CREATE
  TX_BET_ZK   = $TX_BET_ZK   ← Groth16 proof verified on-chain inside this tx
  TX_RESOLVE  = $TX_RESOLVE
  TX_REDEEM   = $TX_REDEEM
EOF
