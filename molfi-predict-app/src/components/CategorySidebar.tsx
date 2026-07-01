import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Trophy, Vote, Bitcoin, Landmark, Clapperboard, Microscope,
  Briefcase, Clock, Timer, CalendarDays, CalendarRange,
  Zap, Globe, Star, type LucideIcon,
} from "lucide-react";

interface Subcategory {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface CategoryConfig {
  subcategories: Subcategory[];
}

const categorySubcategories: Record<string, CategoryConfig> = {
  crypto: {
    subcategories: [
      { label: "All", value: "all", icon: Bitcoin },
      { label: "15 min", value: "15m", icon: Zap },
      { label: "1 Hour", value: "1h", icon: Timer },
      { label: "4 Hour", value: "4h", icon: Clock },
      { label: "Daily", value: "1d", icon: CalendarDays },
      { label: "Weekly", value: "1w", icon: CalendarRange },
    ],
  },
  sports: {
    subcategories: [
      { label: "All", value: "all", icon: Trophy },
      { label: "NBA", value: "nba", icon: Trophy },
      { label: "NFL", value: "nfl", icon: Trophy },
      { label: "MLB", value: "mlb", icon: Trophy },
      { label: "Soccer", value: "soccer", icon: Trophy },
      { label: "UFC / MMA", value: "ufc", icon: Trophy },
      { label: "Tennis", value: "tennis", icon: Trophy },
      { label: "F1", value: "f1", icon: Trophy },
    ],
  },
  politics: {
    subcategories: [
      { label: "All", value: "all", icon: Vote },
      { label: "US", value: "us", icon: Vote },
      { label: "Global", value: "global", icon: Globe },
      { label: "Congress", value: "congress", icon: Landmark },
      { label: "Elections", value: "elections", icon: Vote },
    ],
  },
  elections: {
    subcategories: [
      { label: "All", value: "all", icon: Vote },
      { label: "US", value: "us", icon: Vote },
      { label: "Global", value: "global", icon: Globe },
    ],
  },
  economics: {
    subcategories: [
      { label: "All", value: "all", icon: Landmark },
      { label: "Fed / Rates", value: "fed", icon: Landmark },
      { label: "GDP", value: "gdp", icon: Landmark },
      { label: "Inflation", value: "inflation", icon: Landmark },
    ],
  },
  pop_culture: {
    subcategories: [
      { label: "All", value: "all", icon: Star },
      { label: "Movies", value: "movies", icon: Clapperboard },
      { label: "Music", value: "music", icon: Clapperboard },
      { label: "Awards", value: "awards", icon: Star },
    ],
  },
  business: {
    subcategories: [
      { label: "All", value: "all", icon: Briefcase },
      { label: "Tech", value: "tech", icon: Briefcase },
      { label: "IPOs", value: "ipos", icon: Briefcase },
      { label: "Earnings", value: "earnings", icon: Briefcase },
    ],
  },
  science: {
    subcategories: [
      { label: "All", value: "all", icon: Microscope },
      { label: "Space", value: "space", icon: Microscope },
      { label: "Climate", value: "climate", icon: Globe },
      { label: "Health", value: "health", icon: Microscope },
    ],
  },
};

export function CategorySidebar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";
  const currentSub = searchParams.get("sub") || "all";

  const config = categorySubcategories[currentCategory];

  // Don't render if no category selected or no subcategories defined
  if (!config || currentCategory === "all") return null;

  const handleSubClick = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("sub");
    } else {
      params.set("sub", value);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <aside className="w-44 flex-shrink-0 border-r border-border bg-background hidden md:block">
      <nav className="sticky top-0 py-4 px-2 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Filter
        </p>
        {config.subcategories.map((sub) => {
          const isActive = sub.value === currentSub ||
            (sub.value === "all" && currentSub === "all");
          const Icon = sub.icon;

          return (
            <button
              key={sub.value}
              onClick={() => handleSubClick(sub.value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{sub.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
