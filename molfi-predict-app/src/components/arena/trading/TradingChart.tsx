import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  Time, 
  ColorType,
  CandlestickSeries,
} from 'lightweight-charts';
import { getMarketByAddress, GMX_CONFIG } from '@/config/gmx';
import { getGmxCandles, subscribeToGmxPrices, GMX_TOKEN_SYMBOLS, GMX_TIMEFRAMES } from '@/services/gmx-api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Maximize2,
  Camera,
  Crosshair,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TradingChartProps {
  marketAddress: string | null;
  showHeader?: boolean;
}

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | 'D' | 'W' | 'M';

// Map market addresses to GMX token symbols
const MARKET_TO_GMX_SYMBOL: Record<string, string> = {
  [GMX_CONFIG.markets.BTC_USD.address]: 'BTC',
  [GMX_CONFIG.markets.ETH_USD.address]: 'ETH',
  [GMX_CONFIG.markets.SOL_USD.address]: 'SOL',
};

export function TradingChart({ marketAddress, showHeader = false }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleRef = useRef<CandlestickData<Time> | null>(null);
  const priceSubscriptionRef = useRef<(() => void) | null>(null);
  
  const [timeframe, setTimeframe] = useState<TimeFrame>('5m');
  const [ohlcData, setOhlcData] = useState<CandlestickData<Time>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const marketConfig = marketAddress ? getMarketByAddress(marketAddress) : null;
  const gmxSymbol = marketAddress ? MARKET_TO_GMX_SYMBOL[marketAddress] : 'BTC';
  const gmxPeriod = GMX_TIMEFRAMES[timeframe] || '5m';

  // Fetch historical candles from GMX API
  const fetchCandles = useCallback(async () => {
    if (!gmxSymbol) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const candles = await getGmxCandles(gmxSymbol, gmxPeriod, 200);
      
      if (candles.length === 0) {
        setError('No chart data available');
        setOhlcData([]);
        return;
      }
      
      const chartCandles: CandlestickData<Time>[] = candles
        .filter((c) => c.open > 0 && c.close > 0 && c.high > 0 && c.low > 0) // Filter out zero-value candles
        .map((c) => ({
          time: c.timestamp as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
      
      setOhlcData(chartCandles);
      if (chartCandles.length > 0) {
        lastCandleRef.current = chartCandles[chartCandles.length - 1];
      }
    } catch (error: any) {
      console.error('Failed to fetch GMX price data:', error);
      setError(error.message || 'Failed to load chart data. GMX API may be unavailable.');
      setOhlcData([]);
    } finally {
      setIsLoading(false);
    }
  }, [gmxSymbol, gmxPeriod]);

  // Subscribe to real-time price updates from GMX
  const subscribeToUpdates = useCallback(() => {
    if (!gmxSymbol) return;
    
    // Clean up previous subscription
    if (priceSubscriptionRef.current) {
      priceSubscriptionRef.current();
    }
    
    const cleanup = subscribeToGmxPrices(
      [gmxSymbol],
      (prices) => {
        const price = prices[`${gmxSymbol}/USD`];
        if (!price || price <= 0 || !lastCandleRef.current) return;
        
        setIsLive(true);
        setError(null); // Clear error on successful update
        setError(null); // Clear error on successful update
        
        // Update the current candle with latest price
        setOhlcData(prev => {
          if (prev.length === 0) return prev;
          
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          const lastCandle = updated[lastIndex];
          
          updated[lastIndex] = {
            ...lastCandle,
            close: price,
            high: Math.max(lastCandle.high, price),
            low: Math.min(lastCandle.low, price),
          };
          
          lastCandleRef.current = updated[lastIndex];
          return updated;
        });
      },
      undefined, // onError callback (optional)
      5000 // Poll every 5 seconds (chart updates don't need to be as frequent)
    );
    
    priceSubscriptionRef.current = cleanup;
  }, [gmxSymbol]);

  useEffect(() => {
    fetchCandles();
    subscribeToUpdates();
    
    return () => {
      if (priceSubscriptionRef.current) {
        priceSubscriptionRef.current();
        priceSubscriptionRef.current = null;
      }
    };
  }, [fetchCandles, subscribeToUpdates]);

  const currentCandle = ohlcData[ohlcData.length - 1];
  const prevCandle = ohlcData[ohlcData.length - 2];
  const priceChange = currentCandle && prevCandle
    ? ((currentCandle.close - prevCandle.close) / prevCandle.close * 100)
    : 0;

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#787b86',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2e37',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2e37',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e37',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#2a2e37',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { vertTouchDrag: true },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !ohlcData.length) return;
    candleSeriesRef.current.setData(ohlcData);
    
    if (isLoading === false && ohlcData.length > 0) {
      chartRef.current?.timeScale().scrollToRealTime();
    }
  }, [ohlcData, isLoading]);

  useEffect(() => {
    if (!isLoading && ohlcData.length > 0) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [timeframe, isLoading]);

  return (
    <div className="h-full flex flex-col bg-[#131722] rounded-sm overflow-hidden">
      {/* Chart Toolbar */}
      <div className="flex-shrink-0 h-10 px-2 border-b border-[#2a2e37] flex items-center gap-1">
        {/* Timeframe Selector */}
        <div className="flex items-center">
          {(['1m', '5m', '15m', '1h', '4h', 'D', 'W', 'M'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "h-7 px-2 text-xs font-medium rounded transition-colors",
                tf === timeframe 
                  ? "text-white bg-[#2962ff]" 
                  : "text-[#787b86] hover:text-white hover:bg-[#2a2e37]"
              )}
            >
              {tf}
            </button>
          ))}
          <span className="text-[#787b86] mx-1">|</span>
          <button className="h-7 px-2 text-xs text-[#787b86] hover:text-white">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3" />
              Indicators
            </span>
          </button>
        </div>
        
        <div className="flex-1" />
        
        {/* OHLC Display */}
        {currentCandle && (
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono mr-4">
            <span className="text-[#787b86] flex items-center gap-1">
              {marketConfig?.symbol || 'BTC/USD'} · {timeframe}
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-[#787b86] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">GMX uses Chainlink oracles that aggregate prices from multiple exchanges for fair execution.</p>
                </TooltipContent>
              </Tooltip>
            </span>
            <span>
              <span className="text-[#787b86]">O</span>
              <span className="text-white">{currentCandle.open.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-[#787b86]">H</span>
              <span className="text-white">{currentCandle.high.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-[#787b86]">L</span>
              <span className="text-white">{currentCandle.low.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-[#787b86]">C</span>
              <span className="text-white">{currentCandle.close.toFixed(2)}</span>
            </span>
            <span className={cn(
              priceChange >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"
            )}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        )}

        {isLoading && (
          <span className="text-[11px] text-[#787b86] mr-4">Loading...</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#787b86] hover:text-white hover:bg-[#2a2e37]">
            <Camera className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#787b86] hover:text-white hover:bg-[#2a2e37]">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 relative">
        {/* Error Overlay */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/90 z-10">
            <div className="text-center px-4">
              <div className="text-red-500 text-sm font-medium mb-2">
                ⚠️ Chart Unavailable
              </div>
              <div className="text-[#787b86] text-xs max-w-md">
                {error}
              </div>
              <Button
                onClick={fetchCandles}
                size="sm"
                className="mt-4 bg-[#2962ff] hover:bg-[#1e53e5] text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/90 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2962ff] mx-auto mb-2"></div>
              <div className="text-[#787b86] text-xs">Loading chart data...</div>
            </div>
          </div>
        )}
      </div>

      {/* GMX Branding */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2">
        <div className="px-2 py-1 rounded bg-[#2a2e37]/80 text-[9px] text-[#787b86] uppercase tracking-wide">
          GMX Oracle Price
        </div>
      </div>
    </div>
  );
}
