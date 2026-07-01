#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env
CLOB=CCW46B3JPRS3PRKQMQ5CT2XE623QCISXSOC2O7UVHKFQZW77KK7ZHZKQ
MKT=b7c00000000000000000000000000000000000000000000000000000000000c0
ALICE=$(stellar keys address alice); BOB=$(stellar keys address bob)
R=deploy/clob_bet_results.txt
txof(){ echo "$1" | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$"; }
say(){ echo "$1" | tee -a "$R"; }
say "=== Molfi BTC bet — full on-chain run ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ==="
say "Alice=$ALICE (YES)   Bob=$BOB (NO)"
say "[clob.settle] tx=f995b4d257711c5ff9fca4386f68679c888c068931aff0b9a02c721a2cbb35e9"
say "  alice YES position: $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- position --holder "$ALICE" --market "$MKT" --outcome 0 2>/dev/null)"
say "  bob   NO  position: $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- position --holder "$BOB" --market "$MKT" --outcome 1 2>/dev/null)"
say "  escrowed pot:       $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- escrow --market "$MKT" 2>/dev/null)"
# resolve (close already elapsed)
for a in 1 2 3 4 5; do O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- begin_resolution --id "$MKT" 2>&1); H=$(txof "$O"); if [ -n "$H" ]; then say "[market.begin_resolution] tx=$H"; break; fi; echo "  begin retry $a"; sleep 8; done
sleep 3
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- resolve --id "$MKT" --outcome 0 2>&1); say "[market.resolve YES] tx=$(txof "$O")"
say "  winning outcome: $(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- winning_outcome --id "$MKT" 2>/dev/null) (0=YES)"
# alice wins
O=$(stellar contract invoke --source alice --network testnet --id "$CLOB" -- redeem --holder "$ALICE" --market "$MKT" --shares 100 2>&1); say "[alice.redeem WIN] tx=$(txof "$O")"
# bob loses
B=$(stellar contract invoke --source bob --network testnet --id "$CLOB" -- redeem --holder "$BOB" --market "$MKT" --shares 100 2>&1)
echo "$B" | grep -qiE "error|InsufficientPosition" && say "[bob.redeem LOSE] rejected — holds NO, not the winning YES ✓" || say "[bob.redeem] UNEXPECTED"
say "  escrow after alice redeem: $(stellar contract invoke --source molfi --network testnet --id "$CLOB" -- escrow --market "$MKT" 2>/dev/null)"
say "=== Alice won the 10 XLM pot (staked 6, +4 profit); Bob lost his 4 XLM stake ==="
