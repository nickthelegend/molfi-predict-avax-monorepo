#!/usr/bin/env bash
# Seed the (enumerable) market contract with real markets: two open for trading,
# two resolved (YES + NO), so the front-end lists genuine on-chain state.
set -uo pipefail
cd "$(dirname "$0")/.."
MARKET=CDDX7ELEU2XBQWYYS72BFKZN5M642EBLEA6N2X22WZTHNGXPF7YPAXP3
NOW=$(date +%s); FAR=$((NOW+31536000)); SOON=$((NOW+8))
BTC=b7c0000000000000000000000000000000000000000000000000000000000001
ETH=e7e0000000000000000000000000000000000000000000000000000000000002
RAIN=5f5a000000000000000000000000000000000000000000000000000000000003
ELEC=e1ec000000000000000000000000000000000000000000000000000000000004
inv(){ stellar contract invoke --source molfi --network testnet --id "$MARKET" -- "$@" 2>&1 | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$"; }

echo "create BTC  tx=$(inv create --id $BTC --question 'Will BTC be >= 100k by 2026?' --close_ts $FAR)"
echo "create ETH  tx=$(inv create --id $ETH --question 'Will ETH be >= 5k by 2026?' --close_ts $FAR)"
echo "create RAIN tx=$(inv create --id $RAIN --question 'Will it rain in SF today?' --close_ts $SOON)"
echo "create ELEC tx=$(inv create --id $ELEC --question 'Will turnout exceed 60%?' --close_ts $SOON)"
echo "waiting for close..."; sleep 16
inv begin_resolution --id $RAIN >/dev/null; echo "resolve RAIN YES tx=$(inv resolve --id $RAIN --outcome 0)"
inv begin_resolution --id $ELEC >/dev/null; echo "resolve ELEC NO  tx=$(inv resolve --id $ELEC --outcome 1)"
echo "--- markets() enumeration ---"
stellar contract invoke --source molfi --network testnet --id "$MARKET" -- markets 2>/dev/null
