import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://predifi.com";
const PREDIFI_API = "https://api.predifi.com";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

interface TrendingMarket {
  title: string;
  yes_price: number;
  no_price: number;
  volume_total: number;
}

async function fetchTrendingMarkets(): Promise<TrendingMarket[]> {
  try {
    const res = await fetch(`${PREDIFI_API}/markets?status=active&limit=4&sort=volume`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.markets || data || []).slice(0, 4);
  } catch {
    return [];
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function generateDynamicSvg(markets: TrendingMarket[]): string {
  const W = 1200;
  const H = 630;

  let marketRows = "";
  markets.forEach((m, i) => {
    const y = 230 + i * 90;
    const yes = Math.round(m.yes_price ?? 50);
    const no = 100 - yes;
    const vol = (m.volume_total || 0) / 1e6;
    const title = escapeXml(truncate(m.title, 52));
    const barW = 400;
    const yesW = Math.round((yes / 100) * barW);

    marketRows += `
      <text x="60" y="${y}" fill="#E0E0E0" font-size="18" font-family="sans-serif" font-weight="600">${title}</text>
      <rect x="60" y="${y + 10}" width="${barW}" height="20" rx="10" fill="#EF4444" opacity="0.7"/>
      <rect x="60" y="${y + 10}" width="${yesW}" height="20" rx="10" fill="#22C55E" opacity="0.85"/>
      <text x="${60 + barW + 12}" y="${y + 26}" fill="#22C55E" font-size="16" font-family="sans-serif" font-weight="700">${yes}%</text>
      <text x="${60 + barW + 70}" y="${y + 26}" fill="#9CA3AF" font-size="14" font-family="sans-serif">${vol > 0 ? "$" + vol.toFixed(1) + "M" : ""}</text>
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0A0A1A"/>
        <stop offset="100%" stop-color="#1A1040"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="60" y="80" fill="#FFFFFF" font-size="42" font-family="sans-serif" font-weight="800">Predifi</text>
    <text x="260" y="80" fill="#A78BFA" font-size="42" font-family="sans-serif" font-weight="300">Markets</text>
    <text x="60" y="120" fill="#9CA3AF" font-size="18" font-family="sans-serif">🔥 Trending now · Live odds</text>
    <line x1="60" y1="150" x2="${W - 60}" y2="150" stroke="#333" stroke-width="1"/>
    <text x="60" y="195" fill="#A78BFA" font-size="14" font-family="sans-serif" font-weight="700" letter-spacing="2">HOT MARKETS</text>
    ${marketRows}
    <text x="${W - 60}" y="${H - 30}" fill="#555" font-size="13" font-family="sans-serif" text-anchor="end">predifi.com</text>
  </svg>`;
}

function frameHtml(
  imageUrl: string,
  postUrl: string,
  buttons: { label: string; action: string; target?: string }[]
) {
  const buttonMeta = buttons
    .map((b, i) => {
      const idx = i + 1;
      let tags = `<meta property="fc:frame:button:${idx}" content="${b.label}" />`;
      tags += `\n    <meta property="fc:frame:button:${idx}:action" content="${b.action}" />`;
      if (b.target) {
        tags += `\n    <meta property="fc:frame:button:${idx}:target" content="${b.target}" />`;
      }
      return tags;
    })
    .join("\n    ");

  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:post_url" content="${postUrl}" />
    ${buttonMeta}
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:title" content="Predifi - Prediction Markets" />
</head>
<body></body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Dynamic image endpoint: /farcaster-frame?render=image
    if (url.searchParams.get("render") === "image") {
      const markets = await fetchTrendingMarkets();
      if (markets.length === 0) {
        // Fallback to static OG image
        return Response.redirect(OG_IMAGE, 302);
      }
      const svg = generateDynamicSvg(markets);
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // Use HTTPS explicitly for Farcaster compatibility
    const origin = url.origin.replace("http://", "https://");
    const postUrl = `${origin}${url.pathname}`;
    const dynamicImageUrl = `${postUrl}?render=image&t=${Math.floor(Date.now() / 60000)}`;

    // Parse the frame POST body
    let buttonIndex = 1;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        buttonIndex = body?.untrustedData?.buttonIndex || 1;
      } catch {
        // Default to button 1
      }
    }

    // Button 1: refresh with live data
    if (buttonIndex === 1) {
      const html = frameHtml(dynamicImageUrl, postUrl, [
        { label: "🔄 Refresh", action: "post" },
        { label: "⚔️ Arena", action: "link", target: `${BASE_URL}/arena` },
        { label: "💰 Trade Now", action: "link", target: `${BASE_URL}/markets` },
        { label: "🏠 Home", action: "link", target: BASE_URL },
      ]);

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Default: show frame with dynamic image
    const html = frameHtml(dynamicImageUrl, postUrl, [
      { label: "🔥 Hot Markets", action: "post" },
      { label: "⚔️ Arena", action: "link", target: `${BASE_URL}/arena` },
      { label: "💰 Trade Now", action: "link", target: `${BASE_URL}/markets` },
      { label: "🏠 Home", action: "link", target: BASE_URL },
    ]);

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Frame handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
