import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coins,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/lib/brand";
import { ui } from "@/lib/copy";
import {
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  MAX_MARGIN_USD,
  MIN_MARGIN_USD,
} from "@/lib/leverx/trade-limits";
import { cn } from "@/lib/utils";
import { isRangeTradingEnabled } from "@/lib/predict/instruments";

const STORAGE_KEY = "leverx_welcome_dismissed";
const STEP_COUNT = 4;

const MARGIN_RANGE = `${MIN_MARGIN_USD}–${MAX_MARGIN_USD} dUSDC`;
const LEVERAGE_RANGE = `${LEVERAGE_MIN}×–${LEVERAGE_MAX}×`;
const rangeEnabled = isRangeTradingEnabled();

type WelcomeStep = {
  title: string;
  description: string;
  icon: ReactNode;
  bullets?: readonly string[];
};

const STEPS: readonly WelcomeStep[] = [
  {
    title: `Welcome to ${APP_NAME}`,
    description: ui.appTagline,
    icon: <Sparkles className="h-5 w-5" aria-hidden />,
    bullets: [
      "Real on-chain markets on Stellar testnet — bet with test mUSDC",
      "Bet YES or NO on where crypto prices finish at expiry",
      "Settled on-chain by the Reflector oracle · bet privately with ZK",
    ],
  },
  {
    title: rangeEnabled ? "UP, DOWN & RANGE" : "UP & DOWN",
    description: rangeEnabled
      ? "Pick a market and choose whether price finishes above, below, or inside a band."
      : "Pick a market and choose whether price finishes above or below your target.",
    icon: (
      <span className="flex items-center gap-1" aria-hidden>
        <TrendingUp className="h-4 w-4 text-[var(--long-text)]" />
        <TrendingDown className="h-4 w-4 text-[var(--short-text)]" />
      </span>
    ),
    bullets: rangeEnabled
      ? [
          "UP pays if price ends above your strike",
          "DOWN pays if price ends below your strike",
          "RANGE pays if price lands inside your band",
        ]
      : [
          "UP pays if price ends above your strike",
          "DOWN pays if price ends below your strike",
          "Each market has its own asset, expiry, and target",
        ],
  },
  {
    title: "Trade with leverage",
    description: `Post ${MARGIN_RANGE} margin and choose ${LEVERAGE_RANGE} leverage to size your position.`,
    icon: <Zap className="h-5 w-5" aria-hidden />,
    bullets: [
      "Extra exposure comes from the shared pool",
      "Charts show when you're ahead or behind",
      "Close anytime or let contracts settle at expiry",
    ],
  },
  {
    title: "Trade or earn",
    description:
      "Connect a Stellar wallet to open positions, or deposit mUSDC to the LP vault and earn from trading fees.",
    icon: <Coins className="h-5 w-5" aria-hidden />,
    bullets: [
      "Browse live markets and open your first trade",
      "Deposit to the pool to earn without trading",
      "Read the full guide anytime from the menu",
    ],
  },
] as const;

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    setStep(0);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) dismiss();
  }

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEP_COUNT - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="welcome-dialog-hero">
          <div className="landing-grid-bg absolute inset-0 opacity-30" aria-hidden />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <AppLogo size="md" className="landing-logo" />
              <span className="brand-name text-xl">{APP_NAME}</span>
            </div>
            <div
              className="welcome-dialog-steps"
              role="tablist"
              aria-label="Welcome steps"
            >
              {STEPS.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={index === step}
                  aria-label={`Step ${index + 1}: ${item.title}`}
                  className={cn(
                    "welcome-dialog-step",
                    index === step && "welcome-dialog-step-active",
                    index < step && "welcome-dialog-step-complete",
                  )}
                  onClick={() => setStep(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <DialogHeader className="text-left">
            <div className="welcome-dialog-step-icon" aria-hidden>
              {current.icon}
            </div>
            <p className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Step {step + 1} of {STEP_COUNT}
            </p>
            <DialogTitle className="font-display text-lg tracking-tight">
              {current.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {current.description}
            </DialogDescription>
          </DialogHeader>

          {current.bullets ? (
            <ul className="welcome-dialog-bullets">
              {current.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            {isLast ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="btn-connect flex-1 gap-1.5">
                  <Link to="/markets" onClick={dismiss}>
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10 flex-1 gap-1.5">
                  <Link to="/guide" onClick={dismiss}>
                    <BookOpen className="h-3.5 w-3.5" />
                    Learn more
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {!isFirst ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1 gap-1.5"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className={cn("btn-connect gap-1.5", !isFirst ? "flex-1" : "w-full")}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
