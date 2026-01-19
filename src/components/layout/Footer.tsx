import { Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Footer() {
  return <footer className="border-t border-border/40 bg-card/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                <Music2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">
                Sonex
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Premium beats crafted with passion. Instant delivery after purchase with professional
              licensing included.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
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
            <h4 className="font-display font-semibold mb-4">Legal</h4>
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
          <p>© {new Date().getFullYear()} SonexLite. All rights reserved.</p>
        </div>
      </div>
    </footer>;
}