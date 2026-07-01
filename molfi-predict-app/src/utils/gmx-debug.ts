/**
 * GMX API Debug Utilities
 * Run these functions in browser console to diagnose API issues
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Import: import { testGmxApi } from '@/utils/gmx-debug'
 * 3. Run: testGmxApi()
 */

const GMX_API_PRIMARY = 'https://arbitrum-api.gmxinfra.io';
const GMX_API_FALLBACKS = [
  'https://arbitrum-api-fallback.gmxinfra.io',
  'https://arbitrum-api-fallback.gmxinfra2.io',
];

interface TestResult {
  endpoint: string;
  status: 'success' | 'failed';
  statusCode?: number;
  responseTime?: number;
  data?: any;
  error?: string;
}

/**
 * Test a single GMX API endpoint
 */
async function testEndpoint(url: string, endpointName: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        endpoint: endpointName,
        status: 'failed',
        statusCode: response.status,
        responseTime,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    
    return {
      endpoint: endpointName,
      status: 'success',
      statusCode: response.status,
      responseTime,
      data: Array.isArray(data) ? `${data.length} items` : typeof data,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint: endpointName,
      status: 'failed',
      responseTime,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Test all GMX API endpoints
 */
export async function testGmxApi(): Promise<void> {
  console.log('🔍 Testing GMX API Endpoints...\n');
  
  const endpoints = [
    { name: 'Ping', url: `${GMX_API_PRIMARY}/ping` },
    { name: 'Tickers', url: `${GMX_API_PRIMARY}/prices/tickers` },
    { name: 'BTC Candles (1h)', url: `${GMX_API_PRIMARY}/prices/candles?tokenSymbol=BTC&period=1h&limit=10` },
    { name: 'ETH Candles (5m)', url: `${GMX_API_PRIMARY}/prices/candles?tokenSymbol=ETH&period=5m&limit=10` },
    { name: 'Markets Info', url: `${GMX_API_PRIMARY}/markets/info` },
    { name: 'Signed Prices', url: `${GMX_API_PRIMARY}/signed_prices/latest` },
  ];
  
  const results: TestResult[] = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.url, endpoint.name);
    results.push(result);
    
    const icon = result.status === 'success' ? '✅' : '❌';
    const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
    
    console.log(`${icon} ${result.endpoint} (${time})`);
    
    if (result.status === 'success') {
      console.log(`   Status: ${result.statusCode}, Data: ${result.data}`);
    } else {
      console.error(`   Error: ${result.error}`);
    }
    console.log('');
  }
  
  // Test fallback endpoints
  console.log('🔄 Testing Fallback Endpoints...\n');
  
  for (const fallbackUrl of GMX_API_FALLBACKS) {
    const result = await testEndpoint(`${fallbackUrl}/ping`, `Fallback: ${fallbackUrl}`);
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}`);
    if (result.status === 'failed') {
      console.error(`   Error: ${result.error}`);
    }
    console.log('');
  }
  
  // Summary
  const successCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Summary: ${successCount}/${totalCount} endpoints working`);
  
  if (successCount === totalCount) {
    console.log('✅ All GMX APIs are operational!');
  } else {
    console.warn('⚠️ Some GMX APIs are failing. Check errors above.');
  }
}

/**
 * Test price data formatting
 */
export async function testPriceData(): Promise<void> {
  console.log('💰 Testing Price Data Parsing...\n');
  
  try {
    const response = await fetch(`${GMX_API_PRIMARY}/prices/tickers`);
    const tickers = await response.json();
    
    const btcTicker = tickers.find((t: any) => t.tokenSymbol === 'BTC');
    const ethTicker = tickers.find((t: any) => t.tokenSymbol === 'ETH');
    const solTicker = tickers.find((t: any) => t.tokenSymbol === 'SOL');
    
    console.log('BTC Price:');
    if (btcTicker) {
      const minPrice = parseFloat(btcTicker.minPrice) / 1e30;
      const maxPrice = parseFloat(btcTicker.maxPrice) / 1e30;
      const avgPrice = (minPrice + maxPrice) / 2;
      console.log(`  Min: $${minPrice.toLocaleString()}`);
      console.log(`  Max: $${maxPrice.toLocaleString()}`);
      console.log(`  Avg: $${avgPrice.toLocaleString()}`);
      console.log(`  Spread: ${((maxPrice - minPrice) / minPrice * 100).toFixed(4)}%`);
    } else {
      console.error('  ❌ BTC ticker not found');
    }
    console.log('');
    
    console.log('ETH Price:');
    if (ethTicker) {
      const minPrice = parseFloat(ethTicker.minPrice) / 1e30;
      const maxPrice = parseFloat(ethTicker.maxPrice) / 1e30;
      const avgPrice = (minPrice + maxPrice) / 2;
      console.log(`  Min: $${minPrice.toLocaleString()}`);
      console.log(`  Max: $${maxPrice.toLocaleString()}`);
      console.log(`  Avg: $${avgPrice.toLocaleString()}`);
    } else {
      console.error('  ❌ ETH ticker not found');
    }
    console.log('');
    
    console.log('SOL Price:');
    if (solTicker) {
      const minPrice = parseFloat(solTicker.minPrice) / 1e30;
      const maxPrice = parseFloat(solTicker.maxPrice) / 1e30;
      const avgPrice = (minPrice + maxPrice) / 2;
      console.log(`  Min: $${minPrice.toLocaleString()}`);
      console.log(`  Max: $${maxPrice.toLocaleString()}`);
      console.log(`  Avg: $${avgPrice.toLocaleString()}`);
    } else {
      console.error('  ❌ SOL ticker not found');
    }
    
  } catch (error: any) {
    console.error('❌ Failed to fetch price data:', error.message);
  }
}

/**
 * Test candle data
 */
export async function testCandleData(): Promise<void> {
  console.log('📈 Testing Candle Data...\n');
  
  try {
    const response = await fetch(`${GMX_API_PRIMARY}/prices/candles?tokenSymbol=BTC&period=1h&limit=5`);
    const data = await response.json();
    
    console.log('BTC 1h Candles (last 5):');
    console.log(`Period: ${data.period}`);
    console.log(`Candles: ${data.candles.length}`);
    console.log('');
    
    data.candles.forEach((candle: number[], i: number) => {
      const [timestamp, open, high, low, close] = candle;
      const date = new Date(timestamp * 1000).toLocaleString();
      console.log(`Candle ${i + 1} (${date}):`);
      console.log(`  Open:  $${open.toLocaleString()}`);
      console.log(`  High:  $${high.toLocaleString()}`);
      console.log(`  Low:   $${low.toLocaleString()}`);
      console.log(`  Close: $${close.toLocaleString()}`);
      console.log('');
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch candle data:', error.message);
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.clear();
  console.log('╔════════════════════════════════════════╗');
  console.log('║   GMX API Diagnostic Test Suite       ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  await testGmxApi();
  console.log('\n');
  await testPriceData();
  console.log('\n');
  await testCandleData();
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Tests Complete!                      ║');
  console.log('╚════════════════════════════════════════╝');
}

// Auto-run in console if imported directly
if (typeof window !== 'undefined' && (window as any).__GMX_DEBUG_AUTO_RUN) {
  runAllTests();
}
