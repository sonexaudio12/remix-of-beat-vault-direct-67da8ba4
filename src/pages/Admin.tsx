import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Upload, FileText, DollarSign, Settings, LayoutDashboard, Package, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BeatUploadForm } from '@/components/admin/BeatUploadForm';
import { BeatsManager } from '@/components/admin/BeatsManager';
import { OrdersManager } from '@/components/admin/OrdersManager';
import { LicenseTemplatesManager } from '@/components/admin/LicenseTemplatesManager';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
const navItems = [{
  icon: LayoutDashboard,
  label: 'Dashboard',
  id: 'dashboard'
}, {
  icon: Upload,
  label: 'Upload Beat',
  id: 'upload'
}, {
  icon: Music2,
  label: 'Manage Beats',
  id: 'beats'
}, {
  icon: FileText,
  label: 'License Templates',
  id: 'licenses'
}, {
  icon: Package,
  label: 'Orders',
  id: 'orders'
}, {
  icon: Settings,
  label: 'Settings',
  id: 'settings'
}];
const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    user,
    isLoading,
    signOut
  } = useAuth();
  const isAdmin = !!user;
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!user) {
    return null;
  }
  return <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Sonex Beats" className="h-9 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return <li key={item.id}>
                  <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </li>;
          })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-2 text-sm text-muted-foreground truncate">
            {user.email}
          </div>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <Music2 className="h-5 w-5" />
              View Store
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-8">
          <h1 className="font-display text-xl font-semibold capitalize">
            {activeTab === 'upload' ? 'Upload Beat' : activeTab}
          </h1>
          {!isAdmin && <span className="text-xs flex items-center gap-1 text-sidebar">
              <AlertCircle className="h-3 w-3" />
              Limited access
            </span>}
        </header>

        <div className="p-8">
          {!isAdmin && <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                You don't have admin privileges yet. Contact the site owner to be granted admin access.
              </AlertDescription>
            </Alert>}
          
          {activeTab === 'dashboard' && <DashboardContent isAdmin={isAdmin} setActiveTab={setActiveTab} />}
          {activeTab === 'upload' && <UploadContent isAdmin={isAdmin} onSuccess={() => setActiveTab('beats')} />}
          {activeTab === 'beats' && <BeatsContent isAdmin={isAdmin} />}
          {activeTab === 'licenses' && <LicensesContent isAdmin={isAdmin} />}
          {activeTab === 'orders' && <OrdersContent isAdmin={isAdmin} />}
          {activeTab === 'settings' && <SettingsContent isAdmin={isAdmin} />}
        </div>
      </main>
    </div>;
};
function DashboardContent({
  isAdmin,
  setActiveTab
}: {
  isAdmin: boolean;
  setActiveTab: (tab: string) => void;
}) {
  const [stats, setStats] = useState({
    revenue: 0,
    beatsSold: 0,
    totalBeats: 0,
    pendingOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch completed orders for revenue
        const {
          data: orders
        } = await supabase.from('orders').select('total, status');
        const completedOrders = orders?.filter(o => o.status === 'completed') || [];
        const revenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const pending = orders?.filter(o => o.status === 'pending').length || 0;

        // Fetch beats count
        const {
          count: beatsCount
        } = await supabase.from('beats').select('id', {
          count: 'exact',
          head: true
        });

        // Fetch order items count for beats sold
        const {
          count: itemsCount
        } = await supabase.from('order_items').select('id', {
          count: 'exact',
          head: true
        });
        setStats({
          revenue,
          beatsSold: itemsCount || 0,
          totalBeats: beatsCount || 0,
          pendingOrders: pending
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isAdmin) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);
  const statItems = [{
    label: 'Total Revenue',
    value: `$${stats.revenue.toFixed(2)}`,
    icon: DollarSign
  }, {
    label: 'Beats Sold',
    value: stats.beatsSold.toString(),
    icon: Music2
  }, {
    label: 'Total Beats',
    value: stats.totalBeats.toString(),
    icon: Package
  }, {
    label: 'Pending Orders',
    value: stats.pendingOrders.toString(),
    icon: FileText
  }];
  return <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map(stat => {
        const Icon = stat.icon;
        return <div key={stat.label} className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>;
      })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled={!isAdmin} onClick={() => setActiveTab('upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Beat
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={!isAdmin} onClick={() => setActiveTab('orders')}>
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={!isAdmin} onClick={() => setActiveTab('beats')}>
              <Music2 className="h-4 w-4 mr-2" />
              Manage Beats
            </Button>
          </div>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display font-semibold mb-4">Getting Started</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-muted-foreground">Upload your beats with cover art and audio files</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-muted-foreground">Set license prices for MP3, WAV, and Stems</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p className="text-muted-foreground">Share your store and start selling!</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
function UploadContent({
  isAdmin,
  onSuccess
}: {
  isAdmin: boolean;
  onSuccess?: () => void;
}) {
  if (!isAdmin) {
    return <div className="rounded-xl bg-card border border-border p-6">
        <p className="text-muted-foreground text-sm">Admin access required to upload beats.</p>
      </div>;
  }
  return <div className="max-w-3xl">
      <BeatUploadForm onSuccess={onSuccess} />
    </div>;
}
function BeatsContent({
  isAdmin
}: {
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return <div className="rounded-xl bg-card border border-border p-6">
        <p className="text-muted-foreground text-sm">Admin access required to manage beats.</p>
      </div>;
  }
  return <BeatsManager />;
}
function LicensesContent({
  isAdmin
}: {
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return <div className="rounded-xl bg-card border border-border p-6">
        <p className="text-muted-foreground text-sm">Admin access required to manage license templates.</p>
      </div>;
  }
  return <LicenseTemplatesManager />;
}
function OrdersContent({
  isAdmin
}: {
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return <div className="rounded-xl bg-card border border-border p-6">
        <p className="text-muted-foreground text-sm">Admin access required to view orders.</p>
      </div>;
  }
  return <OrdersManager />;
}
function SettingsContent({
  isAdmin
}: {
  isAdmin: boolean;
}) {
  return <div className="space-y-6">
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold mb-4">PayPal Integration</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {isAdmin ? 'PayPal is configured and ready to accept payments.' : 'Admin access required to manage settings.'}
        </p>
        {isAdmin && <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-green-400">Connected</span>
          </div>}
      </div>

      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold mb-4">Store Settings</h3>
        <p className="text-muted-foreground text-sm">
          Additional store configuration options coming soon.
        </p>
      </div>
    </div>;
}
export default Admin;