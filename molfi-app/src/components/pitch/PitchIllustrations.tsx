import { useId, type ReactNode } from "react";
import {
  LandingChartIllustration,
  LandingVaultIllustration,
} from "@/components/landing/LandingIllustrations";
import logo from "@/assets/logo.png";
import { APP_NAME } from "@/lib/brand";
import type { PitchIllustration } from "@/lib/pitch/slides";
import { cn } from "@/lib/utils";

function PitchFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("landing-illus-frame pitch-illus-frame", className)} data-pitch-illus-part>
      <div className="landing-illus-frame-bar">
        <span className="landing-illus-dot" />
        <span className="landing-illus-dot" />
        <span className="landing-illus-dot" />
        <span className="landing-illus-frame-label">{label}</span>
      </div>
      <div className="landing-illus-frame-body">{children}</div>
    </div>
  );
}

function CoverIllustration() {
  return (
    <PitchFrame label={APP_NAME}>
      <div className="pitch-illus-cover">
        <img
          src={logo}
          alt=""
          className="pitch-illus-logo pitch-illus-float"
          data-pitch-illus-part
        />
        <div className="pitch-illus-cover-meta">
          <span className="pitch-illus-badge pitch-illus-pulse" data-pitch-illus-part>
            🔒 ZK-private
          </span>
          <span className="pitch-illus-cover-tag" data-pitch-illus-part>
            Avalanche · Chainlink
          </span>
        </div>
        <svg viewBox="0 0 320 80" className="pitch-illus-cover-spark pitch-illus-draw" aria-hidden>
          <polyline
            className="pitch-illus-stroke"
            points="0,58 48,52 96,44 144,34 192,28 240,18 288,12 320,8"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle className="pitch-illus-chart-dot" cx="320" cy="8" r="4" fill="#38ef7d" />
        </svg>
      </div>
    </PitchFrame>
  );
}

function ProblemIllustration() {
  const cards = [
    { label: "YES", tone: "long", muted: false },
    { label: "NO", tone: "short", muted: false },
    { label: "YOU", tone: "muted", muted: true },
    { label: "$$$", tone: "muted", muted: true },
  ] as const;

  return (
    <PitchFrame label="Today">
      <div className="pitch-illus-problem">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "pitch-illus-problem-card",
              card.muted && "pitch-illus-problem-card--muted",
              card.tone === "long" && "pitch-illus-problem-card--yes",
              card.tone === "short" && "pitch-illus-problem-card--no",
            )}
            data-pitch-illus-part
          >
            <span>{card.label}</span>
            {card.muted ? <span className="pitch-illus-problem-lock">🔒</span> : null}
          </div>
        ))}
      </div>
    </PitchFrame>
  );
}

function LayersIllustration() {
  const layers = [
    { name: "Molfi", sub: "Private bets · ZK proofs", accent: true },
    { name: "Chainlink", sub: "Data Feeds price oracle", accent: false },
    { name: "Avalanche · Fuji", sub: "On-chain settlement", accent: false },
  ];

  return (
    <PitchFrame label="Stack">
      <div className="pitch-illus-layers">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={cn("pitch-illus-layer", layer.accent && "pitch-illus-layer--accent")}
            data-pitch-illus-part
          >
            <span className="pitch-illus-layer-name">{layer.name}</span>
            <span className="pitch-illus-layer-sub">{layer.sub}</span>
          </div>
        ))}
      </div>
    </PitchFrame>
  );
}

function JarvisIllustration() {
  return (
    <div className="pitch-illus-split">
      <PitchFrame label="Jarvis" className="pitch-illus-split-pane">
        <div className="pitch-illus-jarvis">
          <div className="pitch-illus-jarvis-head" data-pitch-illus-part>
            <span className="pitch-illus-live pitch-illus-pulse" />
            Scanning · 3 positions
          </div>
          <div className="pitch-illus-jarvis-row" data-pitch-illus-part>
            <span>BTC UP 5×</span>
            <span className="text-success">+12%</span>
          </div>
          <div className="pitch-illus-jarvis-row" data-pitch-illus-part>
            <span>Risk</span>
            <span>Low</span>
          </div>
        </div>
      </PitchFrame>
      <PitchFrame label="Telegram" className="pitch-illus-split-pane">
        <div className="pitch-illus-telegram" data-pitch-illus-part>
          <code>/up 70k 5x 10</code>
          <code>/markets</code>
          <code>/balance</code>
        </div>
      </PitchFrame>
    </div>
  );
}

function PillarsIllustration() {
  const pillars = [
    { label: "Leverage", h: 72 },
    { label: "UI", h: 58 },
    { label: "Vault", h: 64 },
    { label: "Keepers", h: 50 },
  ];

  return (
    <PitchFrame label="Missing pieces">
      <div className="pitch-illus-pillars">
        {pillars.map((pillar) => (
          <div key={pillar.label} className="pitch-illus-pillar" data-pitch-illus-part>
            <div className="pitch-illus-pillar-bar" style={{ height: `${pillar.h}%` }} />
            <span>{pillar.label}</span>
          </div>
        ))}
      </div>
    </PitchFrame>
  );
}

function FlowIllustration() {
  const steps = ["Connect", "Pick", "Trade", "Earn"];

  return (
    <PitchFrame label="Flow">
      <div className="pitch-illus-flow">
        {steps.map((step, index) => (
          <div key={step} className="pitch-illus-flow-step" data-pitch-illus-part>
            <span className="pitch-illus-flow-num">{index + 1}</span>
            <span>{step}</span>
            {index < steps.length - 1 ? (
              <span className="pitch-illus-flow-arrow pitch-illus-stroke" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </PitchFrame>
  );
}

function PersonasIllustration() {
  const personas = [
    { role: "Trader", icon: "📈" },
    { role: "LP", icon: "💧" },
    { role: "Busy", icon: "🤖" },
    { role: "Builder", icon: "🛠" },
  ];

  return (
    <PitchFrame label="Personas">
      <div className="pitch-illus-personas">
        {personas.map((persona) => (
          <div key={persona.role} className="pitch-illus-persona" data-pitch-illus-part>
            <span className="pitch-illus-persona-icon pitch-illus-float">{persona.icon}</span>
            <span>{persona.role}</span>
          </div>
        ))}
      </div>
    </PitchFrame>
  );
}

function RoadmapIllustration() {
  const fillId = useId();

  return (
    <PitchFrame label="Roadmap">
      <svg viewBox="0 0 360 160" className="landing-illus-svg pitch-illus-draw" aria-hidden>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <line
          className="pitch-illus-stroke"
          x1="24"
          y1="80"
          x2="336"
          y2="80"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        {[
          { x: 48, label: "Mainnet", active: true },
          { x: 144, label: "Composability", active: false },
          { x: 240, label: "Vol-arb", active: false },
          { x: 312, label: "Social", active: false },
        ].map((node) => (
          <g key={node.label} data-pitch-illus-part>
            <circle
              cx={node.x}
              cy="80"
              r={node.active ? 10 : 7}
              fill={node.active ? "var(--color-accent)" : "var(--color-card)"}
              stroke="var(--color-accent)"
              strokeWidth="2"
            />
            <text
              x={node.x}
              y="112"
              textAnchor="middle"
              fill="var(--color-muted-foreground)"
              fontSize="10"
              fontFamily="Barlow"
            >
              {node.label}
            </text>
          </g>
        ))}
        <path
          className="pitch-illus-stroke"
          d="M48,80 Q120,80 144,80"
          fill="none"
          stroke={`url(#${fillId})`}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </PitchFrame>
  );
}

const ILLUSTRATIONS: Record<PitchIllustration, () => ReactNode> = {
  cover: CoverIllustration,
  problem: ProblemIllustration,
  layers: LayersIllustration,
  chart: () => <LandingChartIllustration />,
  vault: () => <LandingVaultIllustration />,
  jarvis: JarvisIllustration,
  pillars: PillarsIllustration,
  flow: FlowIllustration,
  personas: PersonasIllustration,
  roadmap: RoadmapIllustration,
};

export function PitchIllustration({ kind }: { kind: PitchIllustration }) {
  const Illustration = ILLUSTRATIONS[kind];
  return (
    <div className="pitch-illus" data-pitch-illus={kind}>
      <Illustration />
    </div>
  );
}
