import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, Tag, LogOut, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { PlatformOverview } from '@/components/superadmin/PlatformOverview';
import { TenantsManager } from '@/components/superadmin/TenantsManager';
import { UsersManager } from '@/components/superadmin/UsersManager';
import { PromoCodesManager } from '@/components/superadmin/PromoCodesManager';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Store },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
];

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <li key={id}>
                  <button
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-2 text-sm text-muted-foreground truncate">
            {user.email}
          </div>
          <Link to="/admin">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <Store className="h-5 w-5" />
              Store Admin
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 flex items-center px-8">
          <h1 className="text-xl font-semibold capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
        </header>

        <div className="p-8">
          {activeTab === 'overview' && <PlatformOverview />}
          {activeTab === 'tenants' && <TenantsManager />}
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'promo-codes' && <PromoCodesManager />}
        </div>
      </main>
    </div>
  );
}
