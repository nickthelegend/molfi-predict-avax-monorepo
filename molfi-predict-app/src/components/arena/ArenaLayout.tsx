import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

interface ArenaLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function ArenaLayout({ children, title, description }: ArenaLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={title || "Arena - Competitive Trading | Molfi"}
        description={description || "Season-based trading competitions. Fixed capital. Observable performance. Tradable belief."}
      />
      
      {/* Arena Mode Banner */}
      <div className="bg-muted border-b border-border">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.12em] text-warning font-medium">
              ARENA
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              // COMPETITIVE MODE
            </span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            SEASON 0 — PILOT
          </div>
        </div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <Footer />
    </div>
  );
}
