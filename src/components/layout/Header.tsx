import { ShoppingCart, Music2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
            <Music2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Sonex<span className="text-primary">Lite</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="nav-link text-sm font-medium">
            Beats
          </Link>
          <Link to="/licenses" className="nav-link text-sm font-medium">
            Licensing
          </Link>
          <Link to="/about" className="nav-link text-sm font-medium">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Link to="/admin" className="hidden md:block">
            <Button variant="outline" size="sm">
              Admin
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container flex flex-col gap-4 py-4">
            <Link
              to="/"
              className="nav-link text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Beats
            </Link>
            <Link
              to="/licenses"
              className="nav-link text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Licensing
            </Link>
            <Link
              to="/about"
              className="nav-link text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/admin"
              className="nav-link text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
