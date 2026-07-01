# News API Setup Guide

## CryptoPanic API (FREE)

The market analysis function now supports fetching real-world news/events that might impact prediction markets.

### Features Added
- **OHLC Candle Data**: 15-minute candles for the last 6 hours (24 data points)
- **Technical Analysis Summary**: Trend detection, volume analysis, momentum indicators
- **News Integration**: Recent crypto news for context

### Setup Instructions

1. **Get Free API Key** (Optional but recommended)
   - Visit: https://cryptopanic.com/developers/api/
   - Sign up for free account
   - Get your API key from dashboard
   - Free tier: 200 requests/day

2. **Add to Supabase Secrets**
   ```bash
   # In Supabase Dashboard:
   # Settings → Edge Functions → Secrets
   # Add new secret:
   CRYPTOPANIC_API_KEY=your_api_key_here
   ```

3. **Without API Key**
   - News fetching will be skipped silently
   - Analysis will still work with crypto price + OHLC data
   - No errors or degradation

### Alternative Free News APIs

If CryptoPanic doesn't meet your needs:

#### 1. NewsAPI.org
- **Free Tier**: 100 requests/day
- **Endpoint**: `https://newsapi.org/v2/everything?q=bitcoin&apiKey=YOUR_KEY`
- **Pros**: Broader news coverage
- **Cons**: Requires API key

#### 2. GNews API
- **Free Tier**: 100 requests/day
- **Endpoint**: `https://gnews.io/api/v4/search?q=crypto&apikey=YOUR_KEY`
- **Pros**: Good crypto coverage
- **Cons**: Requires API key

#### 3. RSS Feeds (No API Key)
```typescript
// Example: Parse Google News RSS for crypto news
const response = await fetch('https://news.google.com/rss/search?q=bitcoin+crypto&hl=en-US&gl=US&ceid=US:en');
// Parse XML response
```

### How It Works

1. **Auto-Detection**: Extracts crypto symbols from market title
   - "Will Bitcoin reach $100k?" → Detects `BTC`
   - "Ethereum vs Solana performance" → Detects `ETH` and `SOL`

2. **Data Enrichment**: Fetches three data sources
   ```typescript
   // 1. Real-time price (Binance 24hr ticker)
   const priceData = await fetchCryptoPrice(symbol);
   
   // 2. OHLC candles (Binance klines)
   const ohlcData = await fetchOHLCData(symbol);
   
   // 3. Recent news (CryptoPanic)
   const newsData = await fetchMarketNews([symbol]);
   ```

3. **Technical Summary Generation**
   ```typescript
   // Analyzes 15min candles to generate:
   // - Trend direction (uptrend/downtrend)
   // - Price position in range
   // - Volume trends
   // - Recent momentum
   
   // Example output:
   // "6h uptrend (+5.23%). Price at 78% of range ($23.10-$26.80). 
   //  Volume increasing. Recent momentum: strong bullish."
   ```

4. **Enhanced AI Prompt**
   ```
   Market: Will HYPE reach $50 by January?
   Current Odds: YES 45% / NO 55%
   Trading Volume: $1,200
   
   REAL-TIME CRYPTO DATA (HYPEUSDT):
   - Current Price: $25.43
   - 24h Change: +9.23% (+$2.15)
   - 24h High: $26.80
   - 24h Low: $23.10
   - 24h Volume: 1,523,000 HYPE
   
   TECHNICAL ANALYSIS (15min candles, 6h period):
   6h uptrend (+5.23%). Price at 78% of range ($23.10-$26.80). 
   Volume increasing. Recent momentum: strong bullish.
   
   RECENT NEWS (last 24h):
   - "Hyperliquid announces new token listing" (CoinDesk)
   - "DEX volumes surge 45% in crypto market rally" (CryptoNews)
   ```

### Response Schema

```typescript
interface ConsolidatedResponse {
  consensus: {
    sentiment: "bullish" | "bearish" | "neutral";
    confidence: "high" | "medium" | "low";
    summary: string;
    reasoning: string;
  };
  modelAnalyses: Array<{
    model: string;
    analysis: string;
    sentiment: string;
    confidence: string;
  }>;
  cryptoData?: {
    symbol: string;
    currentPrice: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    candles: Array<{
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    technicalSummary: string;
  };
  news?: Array<{
    title: string;
    source: string;
    publishedAt: string;
    url: string;
  }>;
  metadata: {
    modelsUsed: number;
    timestamp: string;
  };
}
```

### Testing

Test the enhanced analysis:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/market-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "marketTitle": "Will Bitcoin reach $100k by end of 2024?",
    "yesPercentage": 65,
    "noPercentage": 35,
    "volume": "1500000"
  }'
```

Expected response will include:
- ✅ 4 AI model analyses (Gemini Pro, Gemini Flash, Groq, Hugging Face)
- ✅ Structured consensus (sentiment + confidence)
- ✅ Real-time BTC price data from Binance
- ✅ 24 OHLC candles (15min intervals, 6 hours)
- ✅ Technical analysis summary
- ✅ Recent Bitcoin news (if API key configured)

### Benefits

**Better AI Analysis Quality:**
- LLMs see historical price patterns, not just current snapshot
- Real-world context from news helps assess event-driven predictions
- Technical indicators provide objective market signals
- More data = more informed predictions

**Cost-Effective:**
- All APIs use FREE tiers
- No rate limit concerns with current usage
- Binance API: No key required
- CryptoPanic: Optional (200 req/day free)

**Frontend Ready:**
- Structured JSON response
- Can display OHLC charts
- Can show news sidebar
- Technical summary for tooltips
