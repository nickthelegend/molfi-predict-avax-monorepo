import { useState, useEffect } from "react";
import { Search, TrendingUp } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg border border-border w-64 hover:bg-secondary/80 transition-colors"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1 text-left">
          Search everything
        </span>
        <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
          ⌘/
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search markets, pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => handleSelect("/markets")}>
              <TrendingUp className="mr-2 w-4 h-4" />
              Markets
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/portfolio")}>
              <TrendingUp className="mr-2 w-4 h-4" />
              Portfolio
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/dashboard")}>
              <TrendingUp className="mr-2 w-4 h-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/arbitrage")}>
              <TrendingUp className="mr-2 w-4 h-4" />
              Arbitrage
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/leaderboard")}>
              <TrendingUp className="mr-2 w-4 h-4" />
              Leaderboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/rewards")}>
              <TrendingUp className="mr-2 w-4 h-4" />
              Rewards
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
