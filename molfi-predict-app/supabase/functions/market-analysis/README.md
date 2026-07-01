# Market Analysis Edge Function

Multi-model AI market analysis with **OHLC candles**, **technical analysis**, and **news integration**.

## 🎯 Features

### Core Features
- **4 AI Models**: Gemini Pro, Gemini Flash, Groq Llama 3.1 8B, Mistral 7B
- **Structured Consensus**: Aggregated sentiment and confidence from all models
- **Real-time Crypto Data**: Binance API integration for live prices
- **Free Tier Friendly**: Uses free APIs (Groq, Hugging Face, Binance)

### New Enhancements ✨
- **OHLC Candles**: 15-minute intervals for last 6 hours (24 data points)
- **Technical Analysis**: Automated trend, volume, and momentum analysis
- **News Integration**: Real-world events via CryptoPanic API (optional)
- **Rich Context**: LLMs receive historical price patterns + news for better predictions

## 📦 Quick Start

### 1. Configure Secrets

Add to Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# Required
GOOGLE_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Optional (for news integration)
CRYPTOPANIC_API_KEY=your_cryptopanic_key  # Get from: https://cryptopanic.com/developers/api/
```

**Note:** If `CRYPTOPANIC_API_KEY` is not set, news fetching will be skipped. Analysis still works with price + OHLC data.

### 2. Deploy Function

**Option A: Using deployment script**
```bash
cd /home/zoopx/zoopx/predifi/predifi-app/supabase/functions/market-analysis
./deploy.sh
```

**Option B: Manual deployment**
```bash
cd /home/zoopx/zoopx/predifi/predifi-app
supabase functions deploy market-analysis
```

### 3. Test Deployment

```bash
# Set your environment variables
export SUPABASE_FUNCTION_URL="https://your-project.supabase.co/functions/v1/market-analysis"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9odnNyYXB5b3BnYnNpc3NidnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjkwODIsImV4cCI6MjA4NTcwNTA4Mn0.DE4tBkzdyfz4KTogozry3TrUzlQvn5lOngK9rZpheNs"

# Run test suite
./test.sh
```

## 💻 Usage

### Basic Request

```bash
curl -X POST https://your-project.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "Will Bitcoin reach $100k by end of 2024?",
    "yesPercentage": 65,
    "noPercentage": 35,
    "volume": "1500000"
  }'
```

### Example Response

```json
{
  "consensus": {
    "sentiment": "bullish",
    "confidence": "high",
    "summary": "4 AI models analyzed with strong agreement. Sentiment: BULLISH",
    "reasoning": "3 bullish, 0 bearish, 1 neutral. YES 65% / NO 35%. Volume: $1500000."
  },
  "modelAnalyses": [
    {
      "model": "Gemini Pro",
      "analysis": "Bitcoin's current momentum suggests a strong possibility of reaching $100k...",
      "sentiment": "bullish",
      "confidence": "high"
    },
    // ... 3 more models
  ],
  "cryptoData": {
    "symbol": "BTCUSDT",
    "currentPrice": 96500.00,
    "priceChange24h": 3220.00,
    "priceChangePercent24h": 3.45,
    "high24h": 97200.00,
    "low24h": 93280.00,
    "volume24h": 25432.15,
    "candles": [
      {
        "timestamp": 1700000000000,
        "open": 94100.00,
        "high": 94500.00,
        "low": 93900.00,
        "close": 94300.00,
        "volume": 123.45
      }
      // ... 23 more candles
    ],
    "technicalSummary": "6h uptrend (+2.35%). Price at 82% of range ($94,100-$97,200). Volume increasing. Recent momentum: strong bullish."
  },
  "news": [
    {
      "title": "Bitcoin ETF inflows hit record $2B in single day",
      "source": "Bloomberg",
      "publishedAt": "2024-01-15T14:30:00Z",
      "url": "https://..."
    }
    // ... up to 5 news items
  ],
  "metadata": {
    "modelsUsed": 4,
    "timestamp": "2024-01-15T16:45:23.123Z"
  }
}
```

## 📊 What's New

### OHLC Candles (15min, 6 hours)
- 24 data points showing price movement
- Open, High, Low, Close, Volume for each candle
- Frontend can render candlestick charts

### Technical Analysis
Automatically generated summary includes:
- Trend direction (uptrend/downtrend)
- Price position in range (0-100%)
- Volume trends (increasing/decreasing)
- Recent momentum (bullish/bearish/mixed)

### News Integration
- Recent crypto news from CryptoPanic API
- Up to 5 most relevant articles
- Optional feature (graceful fallback)

## 📁 Documentation

- **README.md** (this file) - Quick start guide
- **NEWS_API_SETUP.md** - News API configuration details
- **ENHANCEMENT_SUMMARY.md** - Complete feature documentation
- **deploy.sh** - Automated deployment script
- **test.sh** - Test suite

## 🧪 Testing

Run full test suite:
```bash
./test.sh
```

Manual testing:
```bash
# Check OHLC candles
curl -X POST $FUNCTION_URL ... | jq '.cryptoData.candles | length'
# Expected: 24

# Check technical summary
curl -X POST $FUNCTION_URL ... | jq -r '.cryptoData.technicalSummary'
# Expected: "6h uptrend (+X.XX%). Price at XX%..."

# Check news (if configured)
curl -X POST $FUNCTION_URL ... | jq '.news | length'
# Expected: 0-5 (depends on API key)
```

## 🚀 Performance

- **Response Time:** ~2-4 seconds
- **API Calls:** 6-7 per request (all FREE)
- **Rate Limits:** Well within free tiers

## 🐛 Troubleshooting

**No OHLC candles?**
- Check if crypto symbol detected in market title
- Verify Binance API accessible

**No news items?**
- Normal if `CRYPTOPANIC_API_KEY` not configured
- Check API key validity and rate limits

**LLM models failing?**
- Verify secrets in Supabase Dashboard
- Check API key validity

## 📄 License

Part of PrediFi prediction market platform.
