#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
source deploy/testnet.env
MKT=b7000000000000000000000000000000000000000000000000000000000000c1
R=deploy/market_lifecycle.txt
txof(){ echo "$1" | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$"; }
NOW=$(date +%s); CLOSE=$((NOW+6))
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- create --id "$MKT" --question "Will ETH be >= 5k at close?" --close_ts $CLOSE 2>&1)
echo "[market.create] tx=$(txof "$O")" | tee "$R"
sleep 20
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- begin_resolution --id "$MKT" 2>&1)
echo "[market.begin_resolution] tx=$(txof "$O")" | tee -a "$R"
sleep 4
O=$(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- resolve --id "$MKT" --outcome 0 2>&1)
echo "[market.resolve YES] tx=$(txof "$O")" | tee -a "$R"
