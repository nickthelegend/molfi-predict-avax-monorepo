import aiBannerBg from "@/assets/ai-banner.png";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function JarvisAiBanner({ className }: { className?: string }) {
  return (
    <div className={cn("jarvis-ai-banner", className)}>
      <img
        src={aiBannerBg}
        alt=""
        className="jarvis-ai-banner-image"
        aria-hidden
      />
      <div className="jarvis-ai-banner-overlay" aria-hidden />
      <div className="jarvis-ai-banner-inner">
        <div className="jarvis-ai-banner-copy">
          <span className="jarvis-ai-eyebrow">
            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
            Jarvis
          </span>
          <h2 className="jarvis-ai-title">Trade with AI</h2>
          <p className="jarvis-ai-desc">
            Turn on Jarvis to scan markets and manage trades on your account.
          </p>
        </div>
        <Link to="/jarvis" className="jarvis-ai-cta">
          Open Jarvis
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
