#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."
MARKET=CDDX7ELEU2XBQWYYS72BFKZN5M642EBLEA6N2X22WZTHNGXPF7YPAXP3
NOW=$(date +%s); SOON=$((NOW+45))
RAIN=5f5a000000000000000000000000000000000000000000000000000000000003
ELEC=e1ec000000000000000000000000000000000000000000000000000000000004
inv(){ stellar contract invoke --source molfi --network testnet --id "$MARKET" -- "$@" 2>&1 | grep -oE "explorer/testnet/tx/[0-9a-f]{64}" | head -1 | grep -oE "[0-9a-f]{64}$"; }
echo "RAIN create tx=$(inv create --id $RAIN --question 'Will it rain in SF today?' --close_ts $SOON)"
echo "ELEC create tx=$(inv create --id $ELEC --question 'Will voter turnout exceed 60%?' --close_ts $SOON)"
sleep 50
inv begin_resolution --id $RAIN >/dev/null; echo "RAIN resolve YES tx=$(inv resolve --id $RAIN --outcome 0)"
inv begin_resolution --id $ELEC >/dev/null; echo "ELEC resolve NO  tx=$(inv resolve --id $ELEC --outcome 1)"
echo "markets() = $(stellar contract invoke --source molfi --network testnet --id "$MARKET" -- markets 2>/dev/null)"
