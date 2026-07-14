import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const BACKEND_URL =
  (import.meta.env.VITE_MOLFI_BACKEND_URL as string | undefined) ?? "http://localhost:4000";

function ServiceStatus({ label, online }: { label: string; online: boolean }) {
  return (
    <span className="site-footer-status">
      <span
        className={cn(
          "site-footer-dot",
          online ? "site-footer-dot--on" : "site-footer-dot--off",
        )}
        aria-hidden
      />
      {label} {online ? "online" : "offline"}
    </span>
  );
}

export function SiteFooter() {
  const { data: engine } = useQuery({
    queryKey: ["molfi-backend-health"],
    queryFn: async () => {
      const r = await fetch(`${BACKEND_URL}/api/health`);
      return r.ok ? r.json() : null;
    },
    refetchInterval: 20_000,
    retry: 0,
  });

  return (
    <footer className="site-footer pb-[calc(50px+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="site-footer-inner">
        <div className="site-footer-statuses" aria-label="Service status">
          <ServiceStatus label="Markets engine" online={engine?.ok === true} />
          <ServiceStatus label="Avalanche Fuji" online />
        </div>
        <nav className="site-footer-links" aria-label="Legal">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
