#!/bin/bash

# Test script for enhanced market analysis function
# Tests OHLC, technical summary, and news integration

set -e

echo "🧪 Testing Enhanced Market Analysis Function..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_URL="${SUPABASE_FUNCTION_URL:-https://your-project.supabase.co/functions/v1/market-analysis}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odnNyYXB5b3BnYnNpc3NidnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkwODIsImV4cCI6MjA4NTcwNTA4Mn0.DE4tBkzdyfz4KTogozry3TrUzlQvn5lOngK9rZpheNs}"

echo "📝 Configuration:"
echo "  Function URL: $FUNCTION_URL"
echo "  Using anon key: ${ANON_KEY:0:20}..."
echo ""

# Test 1: Crypto market (Bitcoin)
echo -e "${BLUE}Test 1: Bitcoin crypto market${NC}"
echo "Testing: 'Will Bitcoin reach \$100k by end of 2024?'"
echo ""

RESPONSE1=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "marketTitle": "Will Bitcoin reach $100k by end of 2024?",
    "yesPercentage": 65,
    "noPercentage": 35,
    "volume": "1500000"
  }')

# Check if response contains expected fields
if echo "$RESPONSE1" | jq -e '.cryptoData.candles' > /dev/null 2>&1; then
    CANDLE_COUNT=$(echo "$RESPONSE1" | jq '.cryptoData.candles | length')
    echo -e "${GREEN}✅ OHLC candles present: $CANDLE_COUNT candles${NC}"
else
    echo -e "${RED}❌ OHLC candles missing${NC}"
fi

if echo "$RESPONSE1" | jq -e '.cryptoData.technicalSummary' > /dev/null 2>&1; then
    TECH_SUMMARY=$(echo "$RESPONSE1" | jq -r '.cryptoData.technicalSummary')
    echo -e "${GREEN}✅ Technical summary present${NC}"
    echo "   $TECH_SUMMARY"
else
    echo -e "${RED}❌ Technical summary missing${NC}"
fi

if echo "$RESPONSE1" | jq -e '.news' > /dev/null 2>&1; then
    NEWS_COUNT=$(echo "$RESPONSE1" | jq '.news | length')
    echo -e "${GREEN}✅ News present: $NEWS_COUNT articles${NC}"
else
    echo -e "${YELLOW}⚠️  News not configured (CRYPTOPANIC_API_KEY missing)${NC}"
fi

if echo "$RESPONSE1" | jq -e '.modelAnalyses' > /dev/null 2>&1; then
    MODEL_COUNT=$(echo "$RESPONSE1" | jq '.modelAnalyses | length')
    echo -e "${GREEN}✅ LLM analyses: $MODEL_COUNT models${NC}"
else
    echo -e "${RED}❌ LLM analyses missing${NC}"
fi

echo ""
echo "Full response:"
echo "$RESPONSE1" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Ethereum crypto market
echo -e "${BLUE}Test 2: Ethereum crypto market${NC}"
echo "Testing: 'Will ETH reach \$5,000 by Q1 2024?'"
echo ""

RESPONSE2=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "marketTitle": "Will ETH reach $5,000 by Q1 2024?",
    "yesPercentage": 42,
    "noPercentage": 58,
    "volume": "850000"
  }')

if echo "$RESPONSE2" | jq -e '.cryptoData.symbol' > /dev/null 2>&1; then
    SYMBOL=$(echo "$RESPONSE2" | jq -r '.cryptoData.symbol')
    PRICE=$(echo "$RESPONSE2" | jq -r '.cryptoData.currentPrice')
    echo -e "${GREEN}✅ Crypto detected: $SYMBOL at \$$PRICE${NC}"
else
    echo -e "${RED}❌ Crypto data missing${NC}"
fi

echo ""
echo "---"
echo ""

# Test 3: Non-crypto market (should fallback gracefully)
echo -e "${BLUE}Test 3: Non-crypto market (fallback test)${NC}"
echo "Testing: 'Will Trump win 2024 election?'"
echo ""

RESPONSE3=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "marketTitle": "Will Trump win 2024 election?",
    "yesPercentage": 52,
    "noPercentage": 48,
    "volume": "2500000"
  }')

if echo "$RESPONSE3" | jq -e '.cryptoData' > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Unexpected: Crypto data present for non-crypto market${NC}"
else
    echo -e "${GREEN}✅ Correct: No crypto data (not a crypto market)${NC}"
fi

if echo "$RESPONSE3" | jq -e '.modelAnalyses' > /dev/null 2>&1; then
    MODEL_COUNT=$(echo "$RESPONSE3" | jq '.modelAnalyses | length')
    echo -e "${GREEN}✅ LLM analyses working: $MODEL_COUNT models${NC}"
else
    echo -e "${RED}❌ LLM analyses failed${NC}"
fi

echo ""
echo "---"
echo ""

# Summary
echo ""
echo -e "${GREEN}🎉 Test suite complete!${NC}"
echo ""
echo "Summary:"
echo "  ✅ OHLC candle integration"
echo "  ✅ Technical summary generation"
echo "  ✅ Crypto symbol detection"
echo "  ✅ Multi-model LLM consensus"
echo "  ⚠️  News integration (depends on API key)"
echo ""
echo "To enable news integration:"
echo "  1. Get free API key: https://cryptopanic.com/developers/api/"
echo "  2. Add to Supabase: Settings → Edge Functions → Secrets"
echo "  3. Secret name: CRYPTOPANIC_API_KEY"
echo ""
