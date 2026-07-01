import { useEffect, useRef, useState, useMemo } from "react";
import { useMarketBaseline, fetchPeriodBaseline } from "@/hooks/useMarketBaseline";
import { usePriceTicker, getTickerPrice } from "@/hooks/usePriceTicker";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/* ── Types ── */
interface ResolutionChartProps {
  asset: string;
  timeframe: "hourly" | "daily";
  periodStart?: number;
  periodEnd?: number;
  periodState?: "past" | "current" | "future";
}

interface PricePoint {
  time: number; // ms
  price: number;
}

/* ── Constants ── */
const PAD = { top: 30, right: 80, bottom: 30, left: 12 };
const GREEN = "#22c55e";
const RED = "#ef4444";
const BASELINE_CLR = "#6366f1";
const GRID_CLR = "rgba(148,163,184,0.15)";
const TEXT_CLR = "rgba(148,163,184,0.8)";

const COINBASE_API = "https://api.exchange.coinbase.com";
const PAIR_MAP: Record<string, string> = {
  BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", DOGE: "DOGE-USD", XRP: "XRP-USD",
};

/* ── Helpers ── */
function fmtPrice(p: number) {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/* ═══════════════════════════════════════════════════════
   ResolutionChart — time-progressive countdown chart
   
   DATA MODEL:
   - Baseline: from useMarketBaseline (candle fetch, once per period)
   - Live price: from usePriceTicker (WebSocket, continuous)
   - Chart points: built from ticker ticks, NOT from candles
   ═══════════════════════════════════════════════════════ */
export function ResolutionChart({ asset, timeframe, periodStart, periodEnd, periodState = "current" }: ResolutionChartProps) {
  const isDaily = timeframe === "daily";
  const pair = PAIR_MAP[asset] || `${asset}-USD`;

  const isLive = periodState === "current";
  const isFuture = periodState === "future";

  /* ── Baseline from shared hook (fetches candles ONCE per period) ── */
  const { baseline: liveBaseline, periodStart: livePeriodStart, periodEnd: livePeriodEnd, isLoading: baselineLoading } = useMarketBaseline(asset, timeframe);

  /* ── Real-time price from WebSocket ticker ── */
  const { price: tickerPrice } = usePriceTicker(asset);

  /* ── Period boundaries ── */
  const windowStart = periodStart ?? livePeriodStart;
  const windowEnd = periodEnd ?? livePeriodEnd;

  /* ── Refs for animation-loop data (never cause re-renders) ── */
  const pointsRef = useRef<PricePoint[]>([]);
  const baselineRef = useRef(0);
  const lastPriceRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval>>();

  /* ── Past-period state ── */
  const [pastPoints, setPastPoints] = useState<PricePoint[]>([]);
  const [pastBaseline, setPastBaseline] = useState(0);
  const [pastLoading, setPastLoading] = useState(false);

  /* ── Countdown (for header display only) ── */
  const [countdown, setCountdown] = useState({ m: 0, s: 0 });
  const [resetKey, setResetKey] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const handleRefreshChart = () => {
    pointsRef.current = [];
    lastPriceRef.current = 0;
    setResetKey(k => k + 1);
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
  };

  /* ═══ LIVE: sync baseline from hook into ref ═══ */
  useEffect(() => {
    if (!isLive) return;
    if (liveBaseline > 0) baselineRef.current = liveBaseline;
  }, [isLive, liveBaseline]);

  /* ═══ LIVE: sync ticker price into ref ═══ */
  useEffect(() => {
    if (!isLive) return;
    if (tickerPrice > 0) lastPriceRef.current = tickerPrice;
  }, [isLive, tickerPrice]);

  /* ═══ LIVE: 1-second ticker — injects a point from real-time feed every second ═══ */
  useEffect(() => {
    if (!isLive) return;
    const tick = () => {
      const now = Date.now();
      const price = lastPriceRef.current;
      if (price <= 0) return;

      const pts = pointsRef.current;
      // Simply append — one point per tick, no complex dedup
      pts.push({ time: now, price });

      // Trim old points — only keep 40s buffer for rolling 30s window
      const cutoff = now - 40_000;
      while (pts.length > 0 && pts[0].time < cutoff) pts.shift();

      // Update countdown
      const diff = Math.max(0, windowEnd - now);
      const totalSecs = Math.floor(diff / 1000);
      setCountdown({ m: Math.floor(totalSecs / 60), s: totalSecs % 60 });
    };
    tick();
    tickerRef.current = setInterval(tick, 1000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [isLive, windowEnd, resetKey]);

  /* ═══ PAST: fetch historical candles for past period view ═══ */
  useEffect(() => {
    if (isLive || isFuture) { setPastPoints([]); setPastBaseline(0); return; }
    let dead = false;
    setPastLoading(true);
    (async () => {
      try {
        // Fetch baseline for this past period
        const bl = await fetchPeriodBaseline(asset, timeframe, windowStart);
        if (dead) return;
        setPastBaseline(bl);

        // Fetch chart candles for the past period
        const span = windowEnd - windowStart;
        const gran = span > 4 * 3600_000 ? 300 : 60;
        const url = `${COINBASE_API}/products/${pair}/candles?granularity=${gran}&start=${new Date(windowStart).toISOString()}&end=${new Date(windowEnd).toISOString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Coinbase ${res.status}`);
        const raw: number[][] = await res.json();
        if (dead) return;
        const pts = raw
          .map(([ts, , , , close]) => ({ time: ts * 1000, price: close }))
          .reverse();
        setPastPoints(pts);
      } catch (e) { console.error("Past period load error:", e); }
      finally { if (!dead) setPastLoading(false); }
    })();
    return () => { dead = true; };
  }, [isLive, isFuture, windowStart, windowEnd, pair, asset, timeframe]);

  /* ═══ RENDER LOOP ═══ */
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) { rafRef.current = requestAnimationFrame(render); return; }

      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + "px"; canvas.style.height = h + "px";
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(render); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const NOW = Date.now();
      const baseline = isLive ? baselineRef.current : pastBaseline;
      const WINDOW = 30_000; // 30-second rolling heartbeat

      /* Determine points, tMin, tMax */
      let pts: PricePoint[];
      let tMin: number;
      let tMax: number;

      if (isLive) {
        // Rolling 30s window: tMax = NOW, tMin = NOW - 30s
        tMax = NOW;
        tMin = NOW - WINDOW;
        pts = pointsRef.current.filter(p => p.time >= tMin && p.time <= NOW);

        // Inject "now" point so line always reaches right edge
        const price = lastPriceRef.current;
        if (price > 0 && pts.length > 0) {
          const last = pts[pts.length - 1];
          if (NOW - last.time > 100) {
            pts.push({ time: NOW, price });
          } else {
            pts[pts.length - 1] = { time: NOW, price };
          }
        } else if (price > 0) {
          pts = [{ time: NOW, price }];
        }
      } else {
        pts = pastPoints;
        tMin = windowStart;
        tMax = windowEnd;
      }

      const tRange = Math.max(tMax - tMin, 1000);
      const chartW = w - PAD.left - PAD.right;
      const chartH = h - PAD.top - PAD.bottom;

      /* Empty state */
      if (pts.length < 1 || baseline <= 0) {
        ctx.fillStyle = TEXT_CLR;
        ctx.font = "12px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isFuture ? "Market opens soon" : "Waiting for price data…", w / 2, h / 2);
        if (isLive) rafRef.current = requestAnimationFrame(render);
        return;
      }

      const toX = (t: number) => PAD.left + ((t - tMin) / tRange) * chartW;
      const toY = (p: number) => PAD.top + (1 - (p - yMin) / yRange) * chartH;

      /* Y range — ALWAYS include baseline so it never scrolls off */
      const prices = pts.map(p => p.price);
      prices.push(baseline); // baseline is ALWAYS in Y range
      let yMin = Math.min(...prices);
      let yMax = Math.max(...prices);
      const yPad = (yMax - yMin) * 0.2 || yMax * 0.002;
      yMin -= yPad; yMax += yPad;
      const yRange = yMax - yMin || 1;

      /* Grid */
      ctx.strokeStyle = GRID_CLR; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const yVal = yMin + (i / 5) * yRange;
        const y = toY(yVal);
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(w - PAD.right, y); ctx.stroke();
        ctx.fillStyle = TEXT_CLR; ctx.font = "10px system-ui,sans-serif"; ctx.textAlign = "left";
        ctx.fillText(fmtPrice(yVal), w - PAD.right + 4, y + 3);
      }

      /* X labels (UTC) */
      const xTicks = isLive ? 5 : Math.min(6, Math.floor(chartW / 90));
      ctx.fillStyle = TEXT_CLR; ctx.font = "10px system-ui,sans-serif"; ctx.textAlign = "center";
      for (let i = 0; i <= xTicks; i++) {
        const t = tMin + (i / xTicks) * tRange;
        ctx.fillText(fmtTime(t), toX(t), h - 8);
      }
      // UTC label
      ctx.fillStyle = "rgba(148,163,184,0.5)"; ctx.font = "9px system-ui,sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("UTC", w - PAD.right, h - 8);

      /* Baseline */
      const blY = toY(baseline);
      ctx.setLineDash([8, 4]); ctx.strokeStyle = BASELINE_CLR; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD.left, blY); ctx.lineTo(w - PAD.right, blY); ctx.stroke();
      ctx.setLineDash([]);

      // Baseline label — centered pill on the line
      const blLabel = `Price to beat  ${fmtPrice(baseline)}`;
      ctx.font = "bold 10px system-ui,sans-serif";
      const blLabelW = ctx.measureText(blLabel).width;
      const blLabelX = PAD.left + (chartW - blLabelW) / 2;
      const pillPadX = 8, pillPadY = 4, pillH = 16;
      // Background pill
      ctx.fillStyle = "rgba(15,23,42,0.88)";
      ctx.beginPath();
      const pillR = 4;
      const px = blLabelX - pillPadX, py = blY - pillH / 2 - pillPadY / 2;
      const pw = blLabelW + pillPadX * 2, ph = pillH + pillPadY;
      ctx.roundRect(px, py, pw, ph, pillR);
      ctx.fill();
      // Text
      ctx.fillStyle = BASELINE_CLR; ctx.textAlign = "left";
      ctx.fillText(blLabel, blLabelX, blY + 4);

      /* Price line */
      const lastPrice = pts[pts.length - 1].price;
      const above = lastPrice >= baseline;
      const clr = above ? GREEN : RED;

      // Fill under curve
      const grad = ctx.createLinearGradient(0, PAD.top, 0, h - PAD.bottom);
      grad.addColorStop(0, above ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].time), toY(pts[0].price));
      for (let i = 1; i < pts.length; i++) {
        // Smooth curve using quadratic bezier for each segment
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (toX(prev.time) + toX(curr.time)) / 2;
        ctx.quadraticCurveTo(toX(prev.time), toY(prev.price), cpx, (toY(prev.price) + toY(curr.price)) / 2);
      }
      // Final segment to last point
      if (pts.length > 1) {
        const last = pts[pts.length - 1];
        ctx.lineTo(toX(last.time), toY(last.price));
      }
      ctx.lineTo(toX(pts[pts.length - 1].time), h - PAD.bottom);
      ctx.lineTo(toX(pts[0].time), h - PAD.bottom);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      // Stroke — smooth line
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].time), toY(pts[0].price));
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (toX(prev.time) + toX(curr.time)) / 2;
        ctx.quadraticCurveTo(toX(prev.time), toY(prev.price), cpx, (toY(prev.price) + toY(curr.price)) / 2);
      }
      if (pts.length > 1) {
        const last = pts[pts.length - 1];
        ctx.lineTo(toX(last.time), toY(last.price));
      }
      ctx.strokeStyle = clr; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();

      /* Live dot */
      if (isLive) {
        const lp = pts[pts.length - 1];
        const lx = toX(lp.time), ly = toY(lp.price);
        const pulse = (Math.sin(NOW / 400) + 1) / 2;
        ctx.beginPath(); ctx.arc(lx, ly, 6 + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = above ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"; ctx.fill();
        ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = clr; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = clr; ctx.font = "bold 11px system-ui,sans-serif"; ctx.textAlign = "left";
        ctx.fillText(fmtPrice(lp.price), lx + 10, ly + 4);
      }

      /* Resolved badge for past */
      if (!isLive && !isFuture) {
        const res = lastPrice >= baseline ? "YES" : "NO";
        ctx.fillStyle = res === "YES" ? GREEN : RED;
        ctx.font = "bold 14px system-ui,sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`Resolved: ${res}`, w / 2, PAD.top - 8);
      }

      /* Continue loop only for live */
      if (isLive) rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isLive, isFuture, windowStart, windowEnd, pastPoints, pastBaseline]);

  /* ── Derived values for header ── */
  const baseline = isLive ? liveBaseline : pastBaseline;
  const currentPrice = isLive ? tickerPrice : (pastPoints.length > 0 ? pastPoints[pastPoints.length - 1].price : 0);
  const isAbove = currentPrice >= baseline && baseline > 0;
  const priceDiff = baseline > 0 ? currentPrice - baseline : 0;

  /* ── Loading / Future guards ── */
  if ((isLive && baselineLoading && tickerPrice === 0) || (!isLive && !isFuture && pastLoading)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isFuture) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-semibold mb-1">Upcoming Market</div>
            <div className="text-xs">This market period hasn't started yet.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-4 pb-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price to beat</span>
          <div className="text-xl font-bold tabular-nums text-foreground">{fmtPrice(baseline)}</div>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isLive ? "Current Price" : "Final Price"}{" "}
            {baseline > 0 && (
              <span className={cn("ml-1", isAbove ? "text-emerald-500" : "text-red-500")}>
                {isAbove ? "▲" : "▼"} {fmtPrice(Math.abs(priceDiff))}
              </span>
            )}
          </span>
          <div className={cn("text-xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
            {fmtPrice(currentPrice)}
          </div>
        </div>
        {isLive && (
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
                {String(countdown.m).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-semibold uppercase text-muted-foreground">Mins</span>
              <span className={cn("text-2xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
                {String(countdown.s).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-semibold uppercase text-muted-foreground">Secs</span>
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {isDaily ? "Closes midnight UTC" : "Closes top of hour UTC"}
            </div>
          </div>
        )}
        {!isLive && (
          <div className="text-right">
            <div className={cn(
              "text-sm font-bold px-3 py-1 rounded-full",
              isAbove ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
            )}>
              Resolved {isAbove ? "YES" : "NO"}
            </div>
          </div>
        )}
      </div>

      {/* Resolution indicators */}
      <div className="flex items-center gap-3 px-4 pb-2">
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          isAbove ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Yes — Above baseline
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          !isAbove ? "bg-red-500/15 text-red-500" : "bg-muted text-muted-foreground"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          No — Below baseline
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        <canvas
          key={resetKey}
          ref={canvasRef}
          className="absolute inset-0 w-full h-full animate-fade-in"
        />
        {isLive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRefreshChart}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-500", spinning && "animate-spin")} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">Refresh chart</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
