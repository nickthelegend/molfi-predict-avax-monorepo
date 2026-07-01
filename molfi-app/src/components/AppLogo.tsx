import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-7 w-7 sm:h-8 sm:w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

interface Props {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
}

/**
 * Molfi mark — a gradient badge with an ascending "M" drawn as price-chart
 * peaks (the prediction-market motif). Crisp inline SVG at any size; themeable.
 */
export function AppLogo({ className, size = "sm" }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Molfi"
      className={cn("shrink-0", SIZE_CLASS[size], className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="molfiMark" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c899ff" />
          <stop offset="0.55" stopColor="#9a6bff" />
          <stop offset="1" stopColor="#6d4aff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#molfiMark)" />
      {/* "M" as ascending chart peaks */}
      <path
        d="M8 23 L8 11 L16 18 L24 11 L24 23"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* spark on the rising right peak */}
      <circle cx="24" cy="11" r="2.1" fill="#ffffff" />
      <circle cx="24" cy="11" r="3.6" fill="#ffffff" opacity="0.28" />
    </svg>
  );
}
