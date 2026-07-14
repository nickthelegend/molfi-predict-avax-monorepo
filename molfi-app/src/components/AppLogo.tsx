import { cn } from "@/lib/utils";
import logoUrl from "@/assets/logo.png";

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
 * Molfi brand mark — the official purple gradient logo (src/assets/logo.png).
 * `object-contain` keeps the mark crisp and correctly proportioned at any size.
 */
export function AppLogo({ className, size = "sm" }: Props) {
  return (
    <img
      src={logoUrl}
      alt="Molfi"
      draggable={false}
      className={cn("shrink-0 object-contain", SIZE_CLASS[size], className)}
    />
  );
}
