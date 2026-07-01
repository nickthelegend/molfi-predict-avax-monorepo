import { LayoutGrid, Wallet, type LucideIcon } from "lucide-react";

export type MobileNavItem = {
  label: string;
  icon: LucideIcon;
  to: string;
  isActive: (pathname: string) => boolean;
  /** Center hero tab. */
  featured?: boolean;
};

export const MOBILE_BOTTOM_NAV: MobileNavItem[] = [
  {
    label: "Markets",
    icon: LayoutGrid,
    to: "/markets",
    isActive: (pathname) =>
      pathname.startsWith("/markets") || pathname.startsWith("/predictions"),
  },
  {
    label: "Portfolio",
    icon: Wallet,
    to: "/portfolio",
    isActive: (pathname) => pathname.startsWith("/portfolio"),
  },
];
