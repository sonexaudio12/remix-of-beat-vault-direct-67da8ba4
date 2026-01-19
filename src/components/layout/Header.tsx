import { ShoppingCart, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export function Header() {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Sonex Beats" className="h-9 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Beats
          </Link>
          <Link to="/licenses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Licensing
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Link to="/admin" className="hidden md:block">
            <Button variant="ghost" size="sm">
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
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            <Link to="/" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Beats
            </Link>
            <Link to="/licenses" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Licensing
            </Link>
            <Link to="/about" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/admin" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Admin Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
