# 🚀 Quick Deployment Instructions

## Supabase CLI Not Installed - Use Dashboard Instead

Since Supabase CLI is not available, follow these **Dashboard-only** steps:

---

## Step 1: Add CryptoPanic API Key ⏳ **DO THIS FIRST**

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to Secrets**
   - Click: **Settings** (left sidebar)
   - Click: **Edge Functions**
   - Scroll to: **Secrets** section

3. **Add New Secret**
   ```
   Name:  CRYPTOPANIC_API_KEY
   Value: a39083cef050e7d4dfdfbdabfd7d2c15364a98f4
   ```
   - Click **"Add secret"**
   - Click **"Save"** or **"Confirm"**

4. **Verify Existing Secrets**
   Make sure these are already present:
   - ✅ `GOOGLE_API_KEY` (Gemini)
   - ✅ `GROQ_API_KEY` (Groq)

---

## Step 2: Deploy Function via Dashboard 🚀

### Method A: Re-deploy Existing Function

1. **Navigate to Edge Functions**
   - Click: **Edge Functions** (left sidebar)
   - Find: `market-analysis` function
   - Click on it

2. **Deploy Latest Version**
   - Click: **"Deploy"** button (top right)
   - Or: **"Redeploy"** if already deployed
   - Wait for deployment to complete (~30 seconds)

3. **Check Status**
   - Status should show: **"Deployed"** with green indicator
   - Note the function URL (e.g., `https://xxx.supabase.co/functions/v1/market-analysis`)

### Method B: Upload New Code (If function doesn't exist)

1. **Create New Function**
   - Click: **Edge Functions** → **"Create function"**
   - Name: `market-analysis`

2. **Upload Code**
   - Navigate to: `/home/zoopx/zoopx/predifi/predifi-app/supabase/functions/market-analysis/`
   - Upload: `index.ts`
   - Click: **"Deploy"**

---

## Step 3: Test Deployment 🧪

### Get Your Credentials

**From Supabase Dashboard:**
- Go to: **Settings** → **API**
- Copy: `Project URL` (e.g., `https://xxx.supabase.co`)
- Copy: `anon public` key

### Quick Test

```bash
# Replace YOUR_PROJECT_URL and YOUR_ANON_KEY
curl -X POST https://YOUR_PROJECT_URL/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "marketTitle": "Will Bitcoin reach $100k?",
    "yesPercentage": 65,
    "noPercentage": 35,
    "volume": "1500000"
  }'
```

### Expected Response

You should see:
- ✅ `consensus` object (sentiment, confidence)
- ✅ `modelAnalyses` array (4 models)
- ✅ `cryptoData` object (with 24 OHLC candles)
- ✅ `cryptoData.technicalSummary` (trend analysis)
- ✅ `news` array (0-5 items, may be empty if quota reached)

---

## Step 4: Monitor Logs 📊

1. **View Function Logs**
   - Dashboard → **Edge Functions** → `market-analysis`
   - Click: **"Logs"** tab
   - Watch for:
     - ✅ "Fetching Binance data for BTCUSDT..."
     - ✅ "Retrieved X news items from CryptoPanic"
     - ⚠️ Any error messages

2. **Check for Success**
   - Look for: "Analysis generated from 4 models"
   - Check: Response time (should be 2-4 seconds)

---

## 🎯 What to Verify

After deployment, confirm:

1. **Secrets Configured** ✅
   - CRYPTOPANIC_API_KEY added
   - GOOGLE_API_KEY present
   - GROQ_API_KEY present

2. **Function Deployed** ✅
   - Status shows "Deployed"
   - Function URL accessible
   - No deployment errors

3. **Test Response** ✅
   - 4 model analyses returned
   - Crypto data includes 24 candles
   - Technical summary present
   - News array present (even if empty)

4. **Error Handling** ✅
   - Non-crypto markets work (no cryptoData)
   - Graceful fallbacks if components fail
   - No crashes or 500 errors

---

## 📝 Rate Limits to Remember

### CryptoPanic API (Your Plan: Developer)
- **2 requests/second** (enforced in code)
- **100 requests/month** (monitored automatically)
- **24-hour news delay** (not real-time)

If you hit limits:
- News will be skipped (empty array)
- Other components continue normally
- No errors or crashes

---

## 🚨 Troubleshooting

### "Invalid API key" or 401 error
- Check: CRYPTOPANIC_API_KEY is correctly set
- Value: `a39083cef050e7d4dfdfbdabfd7d2c15364a98f4`

### No news items in response
- Normal if rate limit reached
- Check logs for: "CryptoPanic rate limit reached"
- Wait for next month or upgrade plan

### No OHLC candles
- Verify crypto symbol detected in market title
- Test with: "Bitcoin", "Ethereum", "Solana"
- Check Binance API status

### Function not deploying
- Check for syntax errors in code
- Review deployment logs in dashboard
- Verify all required secrets are set

---

## ✅ Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Navigate to Settings → Edge Functions → Secrets
- [ ] Add CRYPTOPANIC_API_KEY secret
- [ ] Go to Edge Functions → market-analysis
- [ ] Click "Deploy" or "Redeploy"
- [ ] Wait for deployment (green status)
- [ ] Copy function URL and anon key
- [ ] Test with curl command above
- [ ] Check logs for success messages
- [ ] Verify response includes all components

---

## 🎉 Done!

Your enhanced market analysis function is now live with:
- ✅ OHLC candle data (15min, 6 hours)
- ✅ Technical analysis summary
- ✅ News integration (CryptoPanic)
- ✅ Rate limiting (2 req/sec, 100/month)
- ✅ Robust error handling

**All enhancements are deployed and ready to use!** 🚀

---

## 📚 Additional Resources

- **Full Documentation**: See `DEPLOYMENT_GUIDE.md` for comprehensive details
- **API Reference**: See `NEWS_API_SETUP.md` for CryptoPanic specifics
- **Feature Summary**: See `ENHANCEMENT_SUMMARY.md` for complete feature list

---

**Need Help?**
- Check function logs in Supabase Dashboard
- Review error messages
- Test individual components (Binance, CryptoPanic, LLMs)
