# 🚀 Market Analysis Edge Function - Deployment Guide

## Overview
This guide covers deploying the enhanced market analysis function with OHLC candles, technical analysis, and news integration.

---

## ✅ What's Been Enhanced

### New Features
- **OHLC Candles**: 15-minute intervals for 6 hours (24 data points)
- **Technical Analysis**: Automated trend, volume, and momentum analysis
- **News Integration**: Real-world crypto events via CryptoPanic API
- **Rate Limiting**: Built-in rate limiter (2 req/sec, 100 req/month)
- **Robust Error Handling**: Graceful fallbacks if any component fails

### Error Handling & Resilience
```typescript
✅ Each component is independent - if one fails, others continue
✅ Timeouts on all external API calls (5 seconds)
✅ Rate limiting for CryptoPanic (2 req/sec, 100/month)
✅ Fallback to BUSD if USDT pair unavailable
✅ Empty arrays returned instead of errors (non-blocking)
✅ Detailed error logging for debugging
```

---

## 🔐 Step 1: Configure Secrets

### API Keys Needed

| Secret Name | Value | Status |
|------------|-------|--------|
| `GOOGLE_API_KEY` | Your Gemini API key | ✅ Already configured |
| `GROQ_API_KEY` | `<GROQ_API_KEY_REDACTED — set via env>` | ✅ Already configured |
| `CRYPTOPANIC_API_KEY` | `a39083cef050e7d4dfdfbdabfd7d2c15364a98f4` | ⏳ **Need to add** |

### Method A: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/_/settings/functions
   - Navigate to: Settings → Edge Functions → Secrets

2. **Add CryptoPanic API Key**
   ```
   Secret Name: CRYPTOPANIC_API_KEY
   Secret Value: a39083cef050e7d4dfdfbdabfd7d2c15364a98f4
   ```

3. **Verify Existing Secrets**
   - Confirm `GOOGLE_API_KEY` is present
   - Confirm `GROQ_API_KEY` is present

4. **Click "Add Secret"** and save

### Method B: Supabase CLI (Alternative)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set CRYPTOPANIC_API_KEY=a39083cef050e7d4dfdfbdabfd7d2c15364a98f4

# Verify secrets
supabase secrets list
```

---

## 📦 Step 2: Deploy Function

### Method A: Supabase Dashboard (Easiest)

1. **Navigate to Edge Functions**
   - Go to: https://app.supabase.com/project/_/functions
   - Click on Edge Functions in sidebar

2. **Find market-analysis Function**
   - If it exists: Click on it → Click "Deploy" button
   - If it doesn't exist: Click "Create function" → Upload code

3. **Upload Files**
   - Upload: `/predifi-app/supabase/functions/market-analysis/index.ts`
   - The dashboard will automatically compile and deploy

4. **Wait for Deployment**
   - Status should change to "Deployed"
   - Check logs for any errors

### Method B: Supabase CLI (For developers)

```bash
# Navigate to project root
cd /home/zoopx/zoopx/predifi/predifi-app

# Deploy function
supabase functions deploy market-analysis

# Check deployment status
supabase functions list
```

### Method C: Automated Script

```bash
# Run the automated deployment script
cd /home/zoopx/zoopx/predifi/predifi-app
./deploy-market-analysis.sh
```

---

## 🧪 Step 3: Test Deployment

### Test 1: Basic Crypto Market (Bitcoin)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "Will Bitcoin reach $100k by end of 2024?",
    "yesPercentage": 65,
    "noPercentage": 35,
    "volume": "1500000"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "consensus": {
    "sentiment": "bullish",
    "confidence": "high",
    "summary": "4 AI models analyzed...",
    "reasoning": "3 bullish, 0 bearish, 1 neutral..."
  },
  "modelAnalyses": [
    { "model": "Gemini Pro", "analysis": "...", "sentiment": "bullish", "confidence": "high" },
    { "model": "Gemini Flash", "analysis": "...", "sentiment": "bullish", "confidence": "medium" },
    { "model": "Llama 3.1 8B (Groq)", "analysis": "...", "sentiment": "bullish", "confidence": "medium" },
    { "model": "Mistral 7B (Hugging Face)", "analysis": "...", "sentiment": "neutral", "confidence": "low" }
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
    "technicalSummary": "6h uptrend (+2.35%). Price at 82% of range..."
  },
  "news": [
    {
      "title": "Bitcoin ETF inflows hit record $2B",
      "source": "Bloomberg",
      "publishedAt": "2024-01-15T14:30:00Z",
      "url": "https://..."
    }
    // ... up to 5 news items (24h delayed on Developer plan)
  ],
  "metadata": {
    "modelsUsed": 4,
    "timestamp": "2024-01-15T16:45:23.123Z"
  }
}
```

### Test 2: Check OHLC Candles

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "Will ETH reach $5000?",
    "yesPercentage": 42,
    "noPercentage": 58,
    "volume": "850000"
  }' | jq '.cryptoData.candles | length'

# Expected: 24
```

### Test 3: Check Technical Summary

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "HYPE price prediction",
    "yesPercentage": 50,
    "noPercentage": 50,
    "volume": "500000"
  }' | jq -r '.cryptoData.technicalSummary'

# Expected: "6h uptrend (+X.XX%). Price at XX% of range..."
```

### Test 4: Check News Integration

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "Bitcoin price prediction",
    "yesPercentage": 50,
    "noPercentage": 50,
    "volume": "1000000"
  }' | jq '.news | length'

# Expected: 0-5 (depends on CryptoPanic API availability)
# Note: News is 24h delayed on Developer plan
```

### Test 5: Non-Crypto Market (Fallback Test)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "Will Trump win 2024 election?",
    "yesPercentage": 52,
    "noPercentage": 48,
    "volume": "2500000"
  }' | jq '.'

# Expected: 
# - consensus: present
# - modelAnalyses: 4 items
# - cryptoData: undefined (no crypto detected)
# - news: undefined
```

---

## 📊 Rate Limits & Quotas

### CryptoPanic API (Developer Plan)
- **Rate Limit**: 2 requests/second
- **Monthly Quota**: 100 requests/month
- **News Delay**: 24 hours (real-time on paid plans)
- **Enforcement**: Built-in rate limiter in code

**How Rate Limiting Works:**
```typescript
// Automatic rate limiting
const cryptoPanicRateLimiter = {
  lastRequest: 0,
  minInterval: 500, // 500ms = 2 req/sec
  monthlyCount: 0,
  monthlyLimit: 100,
  
  async waitForSlot(): Promise<boolean> {
    // Enforces 2 req/sec and 100/month limits
    // Returns false if limit reached
  }
};
```

### Other APIs (FREE - No limits)
- **Binance**: Unlimited public endpoint access
- **Groq**: 14,400 requests/day
- **Hugging Face**: No hard limit on inference
- **Gemini**: Your existing quota

---

## 🛡️ Error Handling & Resilience

### Component Independence
Each component operates independently with graceful fallbacks:

```typescript
// If crypto price fails → Analysis continues without crypto data
// If OHLC fails → Uses current price only
// If news fails → Analysis continues without news
// If one LLM fails → Other 3 models continue

Example: If Binance is down
✅ LLM consensus still works
✅ News still fetches (if applicable)
✅ Response returns with warning in logs

Example: If CryptoPanic rate limit hit
✅ Crypto price data still works
✅ OHLC candles still work
✅ LLM analysis continues
⚠️ News field will be empty array
```

### Timeout Protection
All external API calls have 5-second timeouts:

```typescript
fetch(url, {
  signal: AbortSignal.timeout(5000), // 5 second timeout
});

// Prevents hanging requests
// Returns gracefully on timeout
```

### Error Logging
Comprehensive error logging for debugging:

```typescript
✅ "Fetching Binance data for BTCUSDT..."
✅ "Detected crypto: BTC"
✅ "Retrieved 5 news items from CryptoPanic"
❌ "CryptoPanic rate limit reached - skipping news"
❌ "Binance API timeout for BTC"
```

---

## 📁 Deployment Files

### Modified Files
- ✅ `/predifi-app/supabase/functions/market-analysis/index.ts` - Enhanced with OHLC, news, rate limiting

### New Documentation
- ✅ `README.md` - Quick start guide
- ✅ `NEWS_API_SETUP.md` - CryptoPanic API details
- ✅ `ENHANCEMENT_SUMMARY.md` - Complete feature documentation
- ✅ `DEPLOYMENT_GUIDE.md` - This file

### Scripts
- ✅ `deploy.sh` - Original deployment script
- ✅ `deploy-market-analysis.sh` - New automated deployment with secrets
- ✅ `test.sh` - Comprehensive test suite

---

## 🔍 Monitoring & Logs

### View Function Logs

**Supabase Dashboard:**
1. Go to: Edge Functions → market-analysis
2. Click "Logs" tab
3. Filter by error level or search keywords

**Supabase CLI:**
```bash
supabase functions logs market-analysis --follow
```

### Key Metrics to Monitor

1. **Response Time**
   - Target: 2-4 seconds
   - Components: Binance (100ms), News (200ms), LLMs (1-3s)

2. **Success Rate**
   - Target: >95% overall success
   - Allow individual component failures

3. **Rate Limit Hits**
   - Monitor CryptoPanic monthly quota
   - Check logs for "rate limit reached" messages

4. **Error Types**
   - Timeouts: Retry or accept graceful degradation
   - 429/403: Rate limit - wait and retry
   - 500: API server error - temporary issue

---

## 🚨 Troubleshooting

### Issue: No news items in response

**Possible Causes:**
1. `CRYPTOPANIC_API_KEY` not configured
2. Rate limit reached (100 req/month)
3. CryptoPanic API down
4. No crypto symbol detected in market title

**Solution:**
```bash
# Check logs
supabase functions logs market-analysis | grep -i cryptopanic

# Expected logs:
# ✅ "Fetching CryptoPanic news for: BTC"
# ✅ "Retrieved 5 news items from CryptoPanic"
# OR
# ⚠️ "CRYPTOPANIC_API_KEY not configured - skipping news"
# ⚠️ "CryptoPanic rate limit reached - skipping news"
```

### Issue: No OHLC candles in response

**Possible Causes:**
1. No crypto symbol detected
2. Binance API timeout
3. Trading pair doesn't exist

**Solution:**
```bash
# Check logs
supabase functions logs market-analysis | grep -i binance

# Verify trading pair exists
curl https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT

# Test with known crypto markets:
# - Bitcoin
# - Ethereum
# - Solana
```

### Issue: LLM models returning null

**Possible Causes:**
1. API keys missing or invalid
2. Rate limits exceeded
3. Model endpoint down

**Solution:**
```bash
# Check secrets
supabase secrets list

# Verify API keys:
# - GOOGLE_API_KEY (Gemini)
# - GROQ_API_KEY (Groq)

# Check logs for specific model errors
supabase functions logs market-analysis | grep -i "error"
```

### Issue: Slow response times (>10 seconds)

**Possible Causes:**
1. LLM APIs slow
2. Multiple timeouts occurring
3. Rate limiting delays

**Solution:**
- Check which component is slow in logs
- Consider increasing timeout values if needed
- Monitor Binance/CryptoPanic API status

---

## 📈 Performance Expectations

### Typical Response Time Breakdown

| Component | Time | Can Fail? | Fallback |
|-----------|------|-----------|----------|
| Binance 24hr ticker | ~100ms | Yes | Continue without price |
| Binance OHLC | ~100ms | Yes | Continue without candles |
| CryptoPanic news | ~200ms | Yes | Continue without news |
| Gemini Pro | ~1-2s | Yes | Use other 3 models |
| Gemini Flash | ~500ms-1s | Yes | Use other 3 models |
| Groq (Llama 3.1) | ~500ms-1s | Yes | Use other 3 models |
| Hugging Face (Mistral) | ~1-2s | Yes | Use other 3 models |

**Total**: 2-4 seconds typical, up to 8 seconds worst case

---

## ✅ Deployment Checklist

- [ ] **Step 1**: Configure `CRYPTOPANIC_API_KEY` in Supabase Dashboard
- [ ] **Step 2**: Verify existing secrets (`GOOGLE_API_KEY`, `GROQ_API_KEY`)
- [ ] **Step 3**: Deploy function via Dashboard or CLI
- [ ] **Step 4**: Test with Bitcoin market (verify all components)
- [ ] **Step 5**: Test with non-crypto market (verify fallback)
- [ ] **Step 6**: Monitor logs for first few requests
- [ ] **Step 7**: Update frontend to use new response fields (optional)

---

## 🎉 Success Indicators

After deployment, you should see:

1. **4 Model Analyses** in every response
2. **Structured Consensus** with sentiment and confidence
3. **Crypto Data** for crypto markets (with 24 OHLC candles)
4. **Technical Summary** showing trend and momentum
5. **News Items** (0-5 articles, 24h delayed on free tier)
6. **Clean Error Handling** (no crashes, graceful fallbacks)

---

## 📞 Support

If you encounter issues:

1. Check logs: `supabase functions logs market-analysis`
2. Review error handling code in `index.ts`
3. Test individual components (Binance, CryptoPanic, LLMs)
4. Verify all secrets are configured correctly

---

## 🔄 Future Upgrades

Optional enhancements:

- [ ] Upgrade CryptoPanic to Growth plan ($199/mo) for real-time news
- [ ] Add more technical indicators (RSI, MACD, Bollinger Bands)
- [ ] Implement caching layer (Redis) for frequently accessed markets
- [ ] Add sentiment analysis from news articles
- [ ] Track prediction accuracy over time

---

**Ready to deploy? Follow Step 1 above to configure secrets, then proceed to Step 2 for deployment!** 🚀
