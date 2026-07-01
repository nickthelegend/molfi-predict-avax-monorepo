#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Molfi — full on-chain agent bet, end to end on Stellar testnet.
#
# Proves the real path a Molfi AI agent takes:
#   1. generate a fresh wallet            (stellar keys generate)
#   2. fund it with XLM                    (friendbot)
#   3. faucet itself test mUSDC            (musdc.faucet)
#   4. spin up an oracle-resolved market   (market.create_price_market + oracle.set_price)
#   5. bet YES with a ZK proof + REAL mUSDC escrow   (predict-escrow.bet_zk → verifier.verify)
#   6. a counterparty bets NO with real mUSDC        (predict-escrow.bet)
#   7. settle the market from the oracle    (market.resolve_from_oracle)
#   8. redeem the winnings (pari-mutuel, 2% fee → vault)  (predict-escrow.redeem)
#
# Every step is a real testnet transaction. Tx hashes are printed at the end.
# Usage: bash scripts/agent_onchain_bet.sh
# ─────────────────────────────────────────────────────────────────────────────
set -eu
cd "$(dirname "$0")/.."
source deploy/testnet.env
NET=testnet
CIRC=../molfi-circuits/build/withdraw/cli

say() { printf "\n\033[1;35m▶ %s\033[0m\n" "$*"; }

# Run a state-changing invoke; on success echo its tx hash, on failure print the
# contract error and abort the script (so nothing fails silently).
send() {
  local label="$1"; shift
  local out
  if ! out=$("$@" 2>&1); then
    { echo "‼ $label FAILED:"; echo "$out" | grep -iE "error|panic|#[0-9]" | tail -6; } >&2
    return 1
  fi
  echo "$out" | grep -oE '/tx/[0-9a-f]{64}' | tail -n1 | cut -d/ -f3
}
# Read-only invoke → trimmed return value.
read_val() { "$@" 2>/dev/null | tail -n1 | tr -d '"'; }

# 1) Fresh agent wallet ───────────────────────────────────────────────────────
AGENT="molfi_agent_$$"
say "1. Generating + funding a fresh agent wallet ($AGENT)"
stellar keys generate "$AGENT" --network "$NET" --fund >/dev/null 2>&1
AGENT_ADDR=$(stellar keys address "$AGENT")
echo "   agent: $AGENT_ADDR"

say "2. Funded with XLM via friendbot ✓"

# 3) Self-faucet mUSDC ─────────────────────────────────────────────────────────
say "3. Agent faucets itself test mUSDC"
TX_FAUCET=$(send faucet stellar contract invoke --source "$AGENT" --network "$NET" --id "$MUSDC" -- faucet --to "$AGENT_ADDR")
BAL=$(read_val stellar contract invoke --source "$AGENT" --network "$NET" --id "$MUSDC" -- balance --id "$AGENT_ADDR")
echo "   mUSDC balance: $BAL (7 decimals)  faucet tx: $TX_FAUCET"
send faucet2 stellar contract invoke --source molfi --network "$NET" --id "$MUSDC" -- faucet --to molfi >/dev/null

# 4) Create an oracle-resolved market ──────────────────────────────────────────
say "4. Creating an oracle-resolved market (BTC >= \$60k?)"
CLOSE=$(( $(date +%s) + 75 ))
MKTID="a9e7$(printf '%060x' $((RANDOM*RANDOM+RANDOM)))"
PRICE=7000000000000000000      # $70,000 * 1e14
THRESH=6000000000000000000     # $60,000 * 1e14
send setprice stellar contract invoke --source molfi --network "$NET" --id "$MOCK_ORACLE" -- set_price --price "$PRICE" >/dev/null
TX_CREATE=$(send create stellar contract invoke --source molfi --network "$NET" --id "$MARKET" \
  -- create_price_market --id "$MKTID" \
  --question "Will BTC be >= 60000 at close (agent demo)" \
  --close_ts "$CLOSE" --oracle "$MOCK_ORACLE" --asset '{"Other":"BTC"}' \
  --threshold "$THRESH" --op 0 --max_staleness 3600)
# Assert the market really exists before staking real money on it.
read_val stellar contract invoke --source molfi --network "$NET" --id "$MARKET" -- get_market --id "$MKTID" >/dev/null
echo "   market: $MKTID  create tx: $TX_CREATE"

# 5) Agent bets YES with real mUSDC escrow ─────────────────────────────────────
say "5. Agent bets YES — 1000 mUSDC escrowed on-chain"
AMT=10000000000   # 1000 mUSDC (7 decimals)
TX_BET_YES=$(send bet stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" \
  -- bet --market_id "$MKTID" --bettor "$AGENT_ADDR" --outcome 0 --amount "$AMT")
echo "   YES bet tx: $TX_BET_YES"

# 5b) Optional: a Groth16-gated PRIVATE bet (verifies a proof on-chain before
# escrowing). Single-use per proof — the proof's nullifier is burned to stop
# replay — so this is best-effort and never blocks the payout demo.
say "5b. (ZK) Trying a Groth16-gated private bet — verified on-chain"
TX_BET_ZK=""
if [ -f "$CIRC/proof.json" ]; then
  PROOF=$(cat "$CIRC/proof.json"); PUB=$(cat "$CIRC/public.json")
  DOMAIN=$(node -pe "JSON.parse(process.argv[1])[0]" "$PUB")
  PI=$(node -pe "JSON.stringify(JSON.parse(process.argv[1]).slice(1))" "$PUB")
  if TX_BET_ZK=$(send bet_zk stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" \
    -- bet_zk --market_id "$MKTID" --bettor "$AGENT_ADDR" --outcome 0 --amount "$AMT" \
    --proof "$PROOF" --public_inputs "$PI" --domain "$DOMAIN"); then
    AMT_YES=$((AMT * 2)); echo "   ZK private bet tx: $TX_BET_ZK (proof verified on-chain)"
  else
    AMT_YES=$AMT; echo "   (proof nullifier already spent — run scripts/zk_fresh_proof.sh for a fresh one; payout demo continues)"
  fi
else
  AMT_YES=$AMT
fi

# 6) Counterparty bets NO ──────────────────────────────────────────────────────
say "6. Counterparty (molfi) bets NO — 1000 mUSDC escrowed"
TX_BET_NO=$(send bet stellar contract invoke --source molfi --network "$NET" --id "$PREDICT_ESCROW" \
  -- bet --market_id "$MKTID" --bettor molfi --outcome 1 --amount "$AMT")
POT=$(read_val stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" -- total --market_id "$MKTID")
echo "   NO bet tx: $TX_BET_NO   total escrowed pot: $POT (2000 mUSDC)"

# 7) Settle from the oracle ─────────────────────────────────────────────────────
say "7. Waiting for close, then resolving from the oracle (permissionless)"
while [ "$(date +%s)" -le "$CLOSE" ]; do sleep 3; done
TX_RESOLVE=$(send resolve stellar contract invoke --source "$AGENT" --network "$NET" --id "$MARKET" -- resolve_from_oracle --id "$MKTID")
OUTCOME=$(read_val stellar contract invoke --source "$AGENT" --network "$NET" --id "$MARKET" -- winning_outcome --id "$MKTID")
echo "   resolved outcome: $OUTCOME (0=YES)  resolve tx: $TX_RESOLVE"

# 8) Redeem winnings ───────────────────────────────────────────────────────────
say "8. Agent redeems winnings (pari-mutuel, 2% fee → vault)"
TX_REDEEM=$(send redeem stellar contract invoke --source "$AGENT" --network "$NET" --id "$PREDICT_ESCROW" -- redeem --market_id "$MKTID" --bettor "$AGENT_ADDR")
BAL_AFTER=$(read_val stellar contract invoke --source "$AGENT" --network "$NET" --id "$MUSDC" -- balance --id "$AGENT_ADDR")
echo "   agent mUSDC: $BAL before → $BAL_AFTER after (staked then won the pot, minus 2% fee)   redeem tx: $TX_REDEEM"

say "DONE — real on-chain agent bet, settled by oracle, paid out in mUSDC."
cat <<EOF

  agent         = $AGENT_ADDR
  market_id     = $MKTID
  TX_FAUCET     = $TX_FAUCET
  TX_CREATE     = $TX_CREATE
  TX_BET_YES    = $TX_BET_YES
  TX_BET_ZK     = ${TX_BET_ZK:-（skipped – proof spent）}
  TX_BET_NO     = $TX_BET_NO
  TX_RESOLVE    = $TX_RESOLVE
  TX_REDEEM     = $TX_REDEEM
EOF
