import { Link } from 'react-router-dom';
import logo from '@/assets/logo-new.png';
export function Footer() {
  return <footer className="border-t border-border/40 bg-card/50">
      <div className="container py-12 text-secondary bg-[sidebar-primary-foreground] bg-slate-200">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2 rounded-full opacity-75">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Sonex Beats Logo" className="h-9 w-auto" />
            </Link>
            <div className="flex gap-4 text-sm mb-4 text-primary-foreground">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/refunds">Refund Policy</a>
            </div>

            <p className="text-sm text-muted-foreground max-w-md">
              Premium beats crafted with passion. Instant delivery after purchase with professional
              licensing included.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-primary-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Browse Beats
                </Link>
              </li>
              <li>
                <Link to="/licenses" className="hover:text-foreground transition-colors">
                  Licensing Info
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-primary-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Sonex Beats. All rights reserved.</p>
        </div>
      </div>
    </footer>;
}