import { useState } from 'react';
import { 
  Music2, 
  Upload, 
  FileText, 
  DollarSign, 
  Settings, 
  LayoutDashboard,
  Package,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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

        <div className="p-4 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <LogOut className="h-5 w-5" />
              Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 flex items-center px-8">
          <h1 className="font-display text-xl font-semibold capitalize">{activeTab}</h1>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'upload' && <UploadContent />}
          {activeTab === 'beats' && <BeatsContent />}
          {activeTab === 'licenses' && <LicensesContent />}
          {activeTab === 'orders' && <OrdersContent />}
          {activeTab === 'settings' && <SettingsContent />}
        </div>
      </main>
    </div>
  );
};

function DashboardContent() {
  const stats = [
    { label: 'Total Revenue', value: '$2,459.00', icon: DollarSign, change: '+12.5%' },
    { label: 'Beats Sold', value: '47', icon: Music2, change: '+8.2%' },
    { label: 'Total Beats', value: '24', icon: Package, change: '+2' },
    { label: 'Pending Orders', value: '3', icon: FileText, change: '0' },
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
                <span className="text-sm text-primary font-medium">{stat.change}</span>
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
            Connect to backend to see recent orders
          </p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display font-semibold mb-4">Top Selling Beats</h3>
          <p className="text-muted-foreground text-sm">
            Connect to backend to see analytics
          </p>
        </div>
      </div>
    </div>
  );
}

function UploadContent() {
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
            Enable backend to activate file uploads
          </p>
        </div>
      </div>
    </div>
  );
}

function BeatsContent() {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">Your Beats</h3>
      <p className="text-muted-foreground text-sm">
        Connect to backend to manage your uploaded beats
      </p>
    </div>
  );
}

function LicensesContent() {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">License Templates</h3>
      <p className="text-muted-foreground text-sm">
        Upload and manage PDF license templates for each tier
      </p>
    </div>
  );
}

function OrdersContent() {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">Orders</h3>
      <p className="text-muted-foreground text-sm">
        Connect to backend to view and manage orders
      </p>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-4">Settings</h3>
      <p className="text-muted-foreground text-sm">
        Configure PayPal integration and store settings
      </p>
    </div>
  );
}

export default Admin;
