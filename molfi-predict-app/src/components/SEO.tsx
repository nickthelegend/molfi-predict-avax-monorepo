import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { brand } from "@/config/brand";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

// Page-specific Farcaster Frame configurations
function getFrameConfig(pathname: string) {
  const baseUrl = "https://molfi.com";

  if (pathname.startsWith("/markets") || pathname.startsWith("/market")) {
    return {
      buttons: [
        { label: "Browse Markets", action: "post" },
        { label: "Trade Now", action: "link", target: `${baseUrl}/markets` },
      ],
    };
  }
  if (pathname.startsWith("/arena")) {
    return {
      buttons: [
        { label: "View Competitions", action: "post" },
        { label: "Join Arena", action: "link", target: `${baseUrl}/arena` },
      ],
    };
  }
  if (pathname.startsWith("/wallet")) {
    return {
      buttons: [
        { label: "Check Balance", action: "post" },
        { label: "Open Wallet", action: "link", target: `${baseUrl}/wallet` },
      ],
    };
  }
  if (pathname.startsWith("/leaderboard")) {
    return {
      buttons: [
        { label: "View Rankings", action: "post" },
        { label: "Compete Now", action: "link", target: `${baseUrl}/arena` },
      ],
    };
  }
  // Default
  return {
    buttons: [
      { label: "Explore Markets", action: "post" },
      { label: "Join Molfi", action: "link", target: `${baseUrl}` },
    ],
  };
}

export function SEO({ 
  title = brand.seo.defaultTitle,
  description = brand.seo.defaultDescription,
  image = brand.seo.defaultImage,
  type = "website"
}: SEOProps) {
  const location = useLocation();
  const url = `https://molfi.com${location.pathname}`;
  const ogImage = `https://molfi.com${image}`;
  const frameConfig = getFrameConfig(location.pathname);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Molfi",
    "description": description,
    "url": url,
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const framePostUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farcaster-frame`;
  const dynamicFrameImage = `${framePostUrl}?render=image&t=${Math.floor(Date.now() / 60000)}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Farcaster Frame - uses dynamic image with live market data */}
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content={dynamicFrameImage} />
      <meta property="fc:frame:post_url" content={framePostUrl} />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      <meta property="fc:frame:button:1" content={frameConfig.buttons[0].label} />
      <meta property="fc:frame:button:1:action" content={frameConfig.buttons[0].action} />
      <meta property="fc:frame:button:2" content={frameConfig.buttons[1].label} />
      <meta property="fc:frame:button:2:action" content={frameConfig.buttons[1].action} />
      {frameConfig.buttons[1].target && (
        <meta property="fc:frame:button:2:target" content={frameConfig.buttons[1].target} />
      )}
      {/* Telegram Mini App */}
      <meta name="telegram-web-app" content="true" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
