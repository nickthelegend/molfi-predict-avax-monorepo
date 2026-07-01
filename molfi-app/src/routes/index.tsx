import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { GsapPageEnter } from "@/components/motion/GsapPageEnter";
import { LandingAssetGrid } from "@/components/landing/LandingAssetGrid";
import { LandingInteractiveGrid } from "@/components/landing/LandingInteractiveGrid";
// import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingChartIllustration } from "@/components/landing/LandingIllustrations";
// import { APP_NAME } from "@/lib/brand";
import { landingCopy } from "@/lib/landing-copy";
import { routePendingOptions } from "@/lib/router/route-options";

export const Route = createFileRoute("/")({
  ...routePendingOptions,
  loader: () => null,
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="landing-page landing-page--viewport">
      {/* <LandingHeader /> */}

      <div className="landing-scroll">
        <section className="landing-hero">
          <div className="landing-hero-bg" aria-hidden>
            <LandingInteractiveGrid />
            <LandingAssetGrid />
          </div>

          <GsapPageEnter stagger className="contents">
            <p className="landing-eyebrow">{landingCopy.eyebrow}</p>

            <h1 className="landing-hero-title">
              {landingCopy.heroTitle}
              <br />
              <span className="landing-hero-accent">{landingCopy.heroTitleAccent}</span>
            </h1>

            <p className="landing-hero-lead">{landingCopy.heroLead}</p>

            <div className="landing-cta-row">
              <Link to="/markets" className="landing-cta-primary">
                {landingCopy.ctaTrade}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="landing-hero-visual">
              <LandingChartIllustration />
            </div>
          </GsapPageEnter>
        </section>
      </div>
    </div>
  );
}
