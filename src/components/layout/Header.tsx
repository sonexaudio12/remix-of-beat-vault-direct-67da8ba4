import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-new.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function Header() {
  const { itemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Sonex Beats" className="h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/beats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Beats
          </Link>
          <Link to="/sound-kits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sound Kits
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

          {/* User Menu - Admin Only */}
          {user && isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !user ? (
            <Link to="/login" className="hidden md:block">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          ) : null}

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
            <Link to="/beats" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Beats
            </Link>
            <Link to="/sound-kits" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Sound Kits
            </Link>
            <Link to="/licenses" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Licensing
            </Link>
            <Link to="/about" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <div className="border-t border-border/40 my-2" />
            {user && isAdmin ? (
              <>
                <Link to="/admin" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Admin Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-sm font-medium text-left text-destructive"
                >
                  Sign Out
                </button>
              </>
            ) : !user ? (
              <Link to="/login" className="py-2 text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                Admin Login
              </Link>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
