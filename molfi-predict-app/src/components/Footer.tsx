import { Link } from "react-router-dom";
import { Github, Twitter, MessageCircle, Mail } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { brand, getThemedLogo } from "@/config/brand";

const Footer = () => {
  const { theme, resolvedTheme } = useTheme();
  const logo = getThemedLogo(theme, resolvedTheme);
  
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-150">
              <span className="text-xl font-extrabold lowercase tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                molfi
              </span>
            </Link>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Prediction Markets Infrastructure
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/markets" className="hover:text-warning transition-colors duration-150">
                  Markets
                </Link>
              </li>
              <li>
                <Link to="/arbitrage" className="hover:text-warning transition-colors duration-150">
                  Arbitrage
                </Link>
              </li>
              <li>
                <Link to="/earn" className="hover:text-warning transition-colors duration-150">
                  Vaults
                </Link>
              </li>
              <li>
                <a href="https://docs.molfi.com" target="_blank" rel="noopener noreferrer" className="hover:text-warning transition-colors duration-150">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://docs.molfi.com" target="_blank" rel="noopener noreferrer" className="hover:text-warning transition-colors duration-150">
                  Documentation
                </a>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-warning transition-colors duration-150">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/brand-kit" className="hover:text-warning transition-colors duration-150">
                  Brand Kit
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="hover:text-warning transition-colors duration-150">
                  Rewards
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground mb-3">Community</h3>
            <div className="flex gap-3">
              <a href="https://go.molfi.com/twitter" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-warning transition-colors duration-150">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://go.molfi.com/git" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-warning transition-colors duration-150">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://go.molfi.com/telegram" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-warning transition-colors duration-150">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="mailto:admin@molfi.com" className="text-muted-foreground hover:text-warning transition-colors duration-150">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Molfi
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-warning transition-colors duration-150">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="hover:text-warning transition-colors duration-150">
              Terms
            </Link>
            <Link to="/pitch" className="hover:text-warning transition-colors duration-150">
              Pitch
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
