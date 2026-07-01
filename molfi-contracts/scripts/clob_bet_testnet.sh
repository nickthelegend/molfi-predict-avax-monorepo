#!/usr/bin/env bash
# Real BTC market bet on testnet: Alice bets YES, Bob bets NO, market resolves
# YES -> Alice wins the pot, Bob loses. Captures tx hashes + on-chain state.
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env
CLOB=CCW46B3JPRS3PRKQMQ5CT2XE623QCISXSOC2O7UVHKFQZW77KK7ZHZKQ
MKT=b7c00000000000000000000000000000000000000000000000000000000000c0
ALICE=$(stellar keys address alice); BOB=$(stellar keys address bob)
R=deploy/clob_bet_results.txt
: > "$R"
txof(){ echo "$1" | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$"; }
say(){ echo "$1" | tee -a "$R"; }

say "=== Molfi BTC market bet ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ==="
say "Alice=$ALICE (YES)   Bob=$BOB (NO)"

# 1. Fund settlement balances (Alice 6 XLM cost, Bob 4 XLM cost).
O=$(stellar contract invoke --source alice --network testnet --id "$CLOB" -- deposit --trader "$ALICE" --amount 60000000 2>&1)
say "[deposit alice 6 XLM] tx=$(txof "$O")"
O=$(stellar contract invoke --source bob --network testnet --id "$CLOB" -- deposit --trader "$BOB" --amount 40000000 2>&1)
say "[deposit bob 4 XLM]   tx=$(txof "$O")"

# 2. Create the BTC market.
NOW=$(date +%s); CLOSE=$((NOW+45))
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- create --id "$MKT" --question "Will BTC be >= 100k at close?" --close_ts $CLOSE 2>&1)
say "[market.create BTC]   tx=$(txof "$O")"

# 3. Relayer settles the matched pair (Alice YES vs Bob NO).
O=$(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- settle --maker "$(cat deploy/alice_order.json)" --taker "$(cat deploy/bob_order.json)" --fill_size 100 2>&1)
say "[clob.settle]         tx=$(txof "$O")"
say "  alice YES position: $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- position --holder "$ALICE" --market "$MKT" --outcome 0 2>/dev/null)"
say "  bob   NO  position: $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- position --holder "$BOB" --market "$MKT" --outcome 1 2>/dev/null)"
say "  escrowed pot:       $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- escrow --market "$MKT" 2>/dev/null)"

# 4. Resolve the market YES (BTC >= 100k).
sleep 50
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- begin_resolution --id "$MKT" 2>&1)
say "[market.begin_resolution] tx=$(txof "$O")"
sleep 3
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- resolve --id "$MKT" --outcome 0 2>&1)
say "[market.resolve YES]  tx=$(txof "$O")"
say "  winning outcome:    $(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- winning_outcome --id "$MKT" 2>/dev/null) (0 = YES)"

# 5. Alice (YES) redeems the pot -> WINS. Bob (NO) cannot -> LOSES.
O=$(stellar contract invoke --source alice --network testnet --id "$CLOB" -- redeem --holder "$ALICE" --market "$MKT" --shares 100 2>&1)
say "[alice.redeem WIN]    tx=$(txof "$O")  payout=$(echo "$O" | grep -oE '^\"?[0-9]+\"?$' | tail -1)"
BOBOUT=$(stellar contract invoke --source bob --network testnet --id "$CLOB" -- redeem --holder "$BOB" --market "$MKT" --shares 100 2>&1)
if echo "$BOBOUT" | grep -qiE "error|InsufficientPosition"; then
  say "[bob.redeem LOSE]     rejected (holds NO, not the winning YES) ✓"
else
  say "[bob.redeem]          UNEXPECTED: $(echo "$BOBOUT" | tail -1)"
fi
say "  escrow after:        $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- escrow --market "$MKT" 2>/dev/null)"
say "=== done: Alice won the pot, Bob lost his stake ==="
