import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Music2, 
  Upload, 
  FileText, 
  DollarSign, 
  Settings, 
  LayoutDashboard,
  Package,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Upload, label: 'Upload Beat', id: 'upload' },
  { icon: Music2, label: 'Manage Beats', id: 'beats' },
  { icon: FileText, label: 'License Templates', id: 'licenses' },
  { icon: Package, label: 'Orders', id: 'orders' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isAdmin, isLoading, signOut } = useAuth();
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
              <Music2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Sonex<span className="text-primary">Lite</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
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
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <Music2 className="h-5 w-5" />
              View Store
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-8">
          <h1 className="font-display text-xl font-semibold capitalize">{activeTab}</h1>
          {!isAdmin && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Limited access
            </span>
          )}
        </header>

        <div className="p-8">
          {!isAdmin && (
            <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                You don't have admin privileges yet. Contact the site owner to be granted admin access.
              </AlertDescription>
            </Alert>
          )}
          
          {activeTab === 'dashboard' && <DashboardContent isAdmin={isAdmin} />}
          {activeTab === 'upload' && <UploadContent isAdmin={isAdmin} />}
          {activeTab === 'beats' && <BeatsContent isAdmin={isAdmin} />}
          {activeTab === 'licenses' && <LicensesContent isAdmin={isAdmin} />}
          {activeTab === 'orders' && <OrdersContent isAdmin={isAdmin} />}
          {activeTab === 'settings' && <SettingsContent isAdmin={isAdmin} />}
        </div>
      </main>
    </div>
  );
};

function DashboardContent({ isAdmin }: { isAdmin: boolean }) {
  const stats = [
    { label: 'Total Revenue', value: '$0.00', icon: DollarSign, change: '-' },
    { label: 'Beats Sold', value: '0', icon: Music2, change: '-' },
    { label: 'Total Beats', value: '0', icon: Package, change: '-' },
    { label: 'Pending Orders', value: '0', icon: FileText, change: '-' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for charts/recent orders */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display font-semibold mb-4">Recent Orders</h3>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? 'No orders yet. Orders will appear here after customers make purchases.' : 'Admin access required to view orders.'}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled={!isAdmin}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Beat
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={!isAdmin}>
              <FileText className="h-4 w-4 mr-2" />
              Manage License Templates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadContent({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) {
    return (
      <div className="rounded-xl bg-card border border-border p-6">
        <p className="text-muted-foreground text-sm">Admin access required to upload beats.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="p-8 rounded-xl bg-card border border-border border-dashed">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">Upload New Beat</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Upload MP3, WAV, and STEMS files along with artwork
          </p>
          <p className="text-xs text-muted-foreground">
            Beat upload form coming soon. Use the database to add beats directly for now.
          </p>
        </div>
      </div>
    </div>
  );
}

function BeatsContent({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">Your Beats</h3>
      <p className="text-muted-foreground text-sm">
        {isAdmin ? 'No beats uploaded yet. Add your first beat using the upload tab.' : 'Admin access required to manage beats.'}
      </p>
    </div>
  );
}

function LicensesContent({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">License Templates</h3>
      <p className="text-muted-foreground text-sm">
        {isAdmin ? 'Upload and manage PDF license templates for each tier (MP3, WAV, Stems, Exclusive).' : 'Admin access required to manage license templates.'}
      </p>
    </div>
  );
}

function OrdersContent({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">Orders</h3>
      <p className="text-muted-foreground text-sm">
        {isAdmin ? 'No orders yet. Orders will appear here after customers complete purchases.' : 'Admin access required to view orders.'}
      </p>
    </div>
  );
}

function SettingsContent({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">Settings</h3>
      <p className="text-muted-foreground text-sm">
        {isAdmin ? 'Configure PayPal integration and store settings here.' : 'Admin access required to manage settings.'}
      </p>
    </div>
  );
}

export default Admin;
