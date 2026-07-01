import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { SiteNavEarnMenu } from "@/components/SiteNavEarnMenu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/lib/brand";
import { isNavDropdown, SITE_NAV_ENTRIES } from "@/lib/site-nav";

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const earnEntry = SITE_NAV_ENTRIES.find(
    (e): e is Extract<typeof e, { type: "dropdown" }> =>
      isNavDropdown(e) && e.label === "Earn",
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link to="/" className="landing-header-brand" onClick={closeMenu}>
          <AppLogo size="md" className="landing-logo" />
          <span className="landing-brand-name hidden sm:inline">{APP_NAME}</span>
        </Link>

        <nav className="landing-header-nav" aria-label="Landing navigation">
          <Link to="/guide" className="landing-header-link" onClick={closeMenu}>
            Guide
          </Link>
          {earnEntry ? (
            <div className="hidden lg:block">
              <SiteNavEarnMenu
                entry={earnEntry}
                onNavigate={closeMenu}
                triggerClassName="landing-header-link"
              />
            </div>
          ) : null}
        </nav>

        <div className="landing-header-actions">
          <ThemeToggle />
          <Link to="/markets" className="landing-header-cta" onClick={closeMenu}>
            Launch app
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen((o) => !o)}
            className="btn-icon inline-flex lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open ? (
        <>
          <Button
            type="button"
            variant="ghost"
            className="fixed inset-0 z-40 h-auto w-auto rounded-none bg-black/60 hover:bg-black/60 lg:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <div className="landing-mobile-menu lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Landing navigation">
              <Link to="/guide" className="landing-mobile-menu-link" onClick={closeMenu}>
                Guide
              </Link>
              {earnEntry ? (
                <SiteNavEarnMenu entry={earnEntry} onNavigate={closeMenu} vertical />
              ) : null}
            </nav>
            <Link
              to="/markets"
              className="landing-header-cta mt-3 w-full justify-center"
              onClick={closeMenu}
            >
              Launch app
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </>
      ) : null}
    </header>
  );
}
