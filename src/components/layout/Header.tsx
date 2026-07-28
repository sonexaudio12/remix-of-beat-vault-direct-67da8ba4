import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-new.png';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
export function Header() {
  const {
    itemCount
  } = useCart();
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };
  return <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Sonex Beats" className="h-12 w-auto rounded-full" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/beats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('beats')}
          </Link>
          <Link to="/sound-kits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('soundKits')}
          </Link>
          <Link to="/licenses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('licensing')}
          </Link>
          <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('services')}
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('about')}
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="hidden sm:inline-flex text-xs font-semibold">
            {language === 'en' ? 'ES' : 'EN'}
          </Button>
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5 rounded-none" />
              {itemCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {itemCount}
                </span>}
            </Button>
          </Link>

          {/* User Menu - Admin Only */}
          {user && isAdmin ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <User className="h-5 w-5 border-primary-foreground bg-background text-muted-foreground" />
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
            </DropdownMenu> : user ? <Link to="/account" className="hidden md:flex">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link> : <Link to="/login" className="hidden md:block">
              <Button variant="outline" size="sm">
                {t('signIn')}
              </Button>
            </Link>}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container py-3 flex flex-col gap-0">
            <Link to="/beats" className="py-3 px-2 text-sm font-medium active:bg-secondary/50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              {t('beats')}
            </Link>
            <Link to="/sound-kits" className="py-3 px-2 text-sm font-medium active:bg-secondary/50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              {t('soundKits')}
            </Link>
            <Link to="/licenses" className="py-3 px-2 text-sm font-medium active:bg-secondary/50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              {t('licensing')}
            </Link>
            <Link to="/services" className="py-3 px-2 text-sm font-medium active:bg-secondary/50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              {t('services')}
            </Link>
            <Link to="/about" className="py-3 px-2 text-sm font-medium active:bg-secondary/50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              {t('about')}
            </Link>
            <div className="border-t border-border/40 my-2" />
            <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="py-2 text-sm font-medium text-left text-primary">
              {t('language')}: {language === 'en' ? 'Español' : 'English'}
            </button>
            {user && isAdmin ? <>
                <Link to="/admin" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Admin Dashboard
                </Link>
                <button onClick={() => {
            handleSignOut();
            setMobileMenuOpen(false);
          }} className="py-2 text-sm font-medium text-left text-destructive">
                  Sign Out
                </button>
              </> : user ? <Link to="/account" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                My Account
              </Link> : <Link to="/login" className="py-2 text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
              {t('signIn')}
              </Link>}
          </nav>
        </div>}
    </header>;
}
