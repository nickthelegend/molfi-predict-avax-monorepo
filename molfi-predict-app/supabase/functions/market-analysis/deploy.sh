#!/bin/bash

# Market Analysis Edge Function - Deployment Script
# Deploys enhanced function with OHLC candles and news integration

set -e

echo "🚀 Deploying Market Analysis Edge Function..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "supabase/functions/market-analysis/index.ts" ]; then
    echo -e "${RED}❌ Error: Must run from /predifi-app directory${NC}"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not installed${NC}"
    echo "Install: npm install -g supabase"
    exit 1
else
    echo -e "${GREEN}✅ Supabase CLI installed${NC}"
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase${NC}"
    echo "Run: supabase login"
    exit 1
else
    echo -e "${GREEN}✅ Logged in to Supabase${NC}"
fi

# Check for required secrets
echo ""
echo "🔑 Checking secrets..."
echo ""
echo "Required secrets (set in Supabase Dashboard → Settings → Edge Functions → Secrets):"
echo "  1. GOOGLE_API_KEY - Gemini API (required)"
echo "  2. GROQ_API_KEY - Groq API (required)"
echo "  3. CRYPTOPANIC_API_KEY - News API (optional)"
echo ""
echo "If CRYPTOPANIC_API_KEY is not set, news fetching will be skipped."
echo ""

read -p "Have you configured the required secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Configure secrets first:"
    echo "1. Go to: https://app.supabase.com/project/_/settings/functions"
    echo "2. Add secrets:"
    echo "   - GOOGLE_API_KEY (your Gemini API key)"
    echo "   - GROQ_API_KEY (from Groq dashboard)"
    echo "   - CRYPTOPANIC_API_KEY (optional, from cryptopanic.com/developers/api/)"
    echo ""
    exit 1
fi

# Deploy
echo ""
echo "📦 Deploying market-analysis function..."
echo ""

supabase functions deploy market-analysis

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🎉 Enhanced features now live:"
    echo "  ✅ OHLC candle data (15min intervals, 6 hours)"
    echo "  ✅ Technical analysis summary"
    echo "  ✅ News integration (if API key configured)"
    echo "  ✅ 4 LLM models (Gemini Pro/Flash, Groq, Hugging Face)"
    echo "  ✅ Structured consensus response"
    echo ""
    echo "📖 Test with:"
    echo ""
    echo "  curl -X POST https://your-project.supabase.co/functions/v1/market-analysis \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "    -d '{
    \"marketTitle\": \"Will Bitcoin reach \$100k by end of 2024?\",
    \"yesPercentage\": 65,
    \"noPercentage\": 35,
    \"volume\": \"1500000\"
  }'"
    echo ""
    echo "📚 Documentation:"
    echo "  - NEWS_API_SETUP.md - News API configuration"
    echo "  - ENHANCEMENT_SUMMARY.md - Complete feature documentation"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Not linked to a project: supabase link --project-ref YOUR_PROJECT_REF"
    echo "  2. Missing secrets: Check Supabase Dashboard → Settings → Edge Functions"
    echo "  3. Syntax errors: Check index.ts for TypeScript errors"
    echo ""
    exit 1
fi
