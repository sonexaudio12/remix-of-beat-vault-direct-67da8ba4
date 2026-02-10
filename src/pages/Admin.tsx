import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music2, Upload, FileText, DollarSign, Settings, LayoutDashboard, Package, LogOut, Loader2, Archive, ScrollText, Users, BarChart3, MessageSquare, Headphones, ClipboardList, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BeatUploadForm } from '@/components/admin/BeatUploadForm';
import { BeatsManager } from '@/components/admin/BeatsManager';
import { OrdersManager } from '@/components/admin/OrdersManager';
import { LicenseTemplatesManager } from '@/components/admin/LicenseTemplatesManager';
import { GeneratedLicensesManager } from '@/components/admin/GeneratedLicensesManager';
import { SoundKitUploadForm } from '@/components/admin/SoundKitUploadForm';
import { SoundKitsManager } from '@/components/admin/SoundKitsManager';
import { PaymentSettingsManager } from '@/components/admin/PaymentSettingsManager';
import { ContactSettingsManager } from '@/components/admin/ContactSettingsManager';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { DashboardAnalytics } from '@/components/admin/DashboardAnalytics';
import { ExclusiveOffersManager } from '@/components/admin/ExclusiveOffersManager';
import { ServicesManager } from '@/components/admin/ServicesManager';
import { ServiceOrdersManager } from '@/components/admin/ServiceOrdersManager';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import { VisualPageBuilder } from '@/components/admin/VisualPageBuilder';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const navItems = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard
}, {
  id: 'analytics',
  label: 'Analytics',
  icon: BarChart3
}, {
  id: 'upload',
  label: 'Upload Beat',
  icon: Upload
}, {
  id: 'beats',
  label: 'Manage Beats',
  icon: Music2
}, {
  id: 'upload-soundkit',
  label: 'Upload Sound Kit',
  icon: Archive
}, {
  id: 'soundkits',
  label: 'Manage Sound Kits',
  icon: Archive
}, {
  id: 'exclusive-offers',
  label: 'Exclusive Offers',
  icon: MessageSquare
}, {
  id: 'licenses',
  label: 'License Templates',
  icon: FileText
}, {
  id: 'generated-licenses',
  label: 'Generated Licenses',
  icon: ScrollText
}, {
  id: 'orders',
  label: 'Orders',
  icon: Package
}, {
  id: 'services-manage',
  label: 'Manage Services',
  icon: Headphones
}, {
  id: 'service-orders',
  label: 'Service Orders',
  icon: ClipboardList
}, {
  id: 'section-editor',
  label: 'Page Builder',
  icon: LayoutDashboard
}, {
  id: 'theme-editor',
  label: 'Theme Editor',
  icon: Paintbrush
}, {
  id: 'admins',
  label: 'Admin Users',
  icon: Users
}, {
  id: 'settings',
  label: 'Settings',
  icon: Settings
}];

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    user,
    isAdmin,
    isLoading,
    signOut
  } = useAuth();
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
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!user) return null;
  return <div className="min-h-screen flex bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img alt="Sonex Beats" className="h-9 w-auto" src="/lovable-uploads/db65a914-2de4-4b0b-8ad2-99b00fbd856a.png" />
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({
            id,
            label,
            icon: Icon
          }) => {
            const isActive = activeTab === id;
            return <li key={id}>
                  <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <Icon className="h-5 w-5" />
                    {label}
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

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                               */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 flex items-center px-8">
          <h1 className="text-xl font-semibold capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
        </header>

        <div className="p-8 bg-popover text-secondary-foreground">
          {activeTab === 'dashboard' && <DashboardWithAnalytics isAdmin={isAdmin} setActiveTab={setActiveTab} />}
          {activeTab === 'analytics' && <AnalyticsContent isAdmin={isAdmin} />}
          {activeTab === 'upload' && <UploadContent isAdmin={isAdmin} onSuccess={() => setActiveTab('beats')} />}
          {activeTab === 'beats' && <BeatsContent isAdmin={isAdmin} />}
          {activeTab === 'upload-soundkit' && <SoundKitUploadContent isAdmin={isAdmin} onSuccess={() => setActiveTab('soundkits')} />}
          {activeTab === 'soundkits' && <SoundKitsContent isAdmin={isAdmin} />}
          {activeTab === 'exclusive-offers' && <ExclusiveOffersContent isAdmin={isAdmin} />}
          {activeTab === 'licenses' && <LicensesContent isAdmin={isAdmin} />}
          {activeTab === 'generated-licenses' && <GeneratedLicensesContent isAdmin={isAdmin} />}
          {activeTab === 'orders' && <OrdersContent isAdmin={isAdmin} />}
          {activeTab === 'services-manage' && <ServicesManageContent isAdmin={isAdmin} />}
          {activeTab === 'service-orders' && <ServiceOrdersContent isAdmin={isAdmin} />}
          {activeTab === 'section-editor' && isAdmin && <VisualPageBuilder />}
          {activeTab === 'theme-editor' && isAdmin && <ThemeEditor />}
          {activeTab === 'admins' && <AdminUsersContent isAdmin={isAdmin} />}
          {activeTab === 'settings' && <SettingsContent isAdmin={isAdmin} />}
        </div>
      </main>
    </div>;
}

/* -------------------------------------------------------------------------- */
/*                               Sub Components                               */
/* -------------------------------------------------------------------------- */

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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadStats = async () => {
      const {
        data: orders
      } = await supabase.from('orders').select('total,status');
      const completed = orders?.filter(o => o.status === 'completed') ?? [];
      const pending = orders?.filter(o => o.status === 'pending').length ?? 0;
      const revenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
      const {
        count: totalBeats
      } = await supabase.from('beats').select('id', {
        count: 'exact',
        head: true
      });
      const {
        count: beatsSold
      } = await supabase.from('order_items').select('id', {
        count: 'exact',
        head: true
      });
      setStats({
        revenue,
        beatsSold: beatsSold ?? 0,
        totalBeats: totalBeats ?? 0,
        pendingOrders: pending
      });
      setLoading(false);
    };
    if (isAdmin) loadStats();else setLoading(false);
  }, [isAdmin]);
  const cards = [{
    label: 'Revenue',
    value: `$${stats.revenue.toFixed(2)}`,
    icon: DollarSign
  }, {
    label: 'Beats Sold',
    value: stats.beatsSold,
    icon: Music2
  }, {
    label: 'Total Beats',
    value: stats.totalBeats,
    icon: Package
  }, {
    label: 'Pending Orders',
    value: stats.pendingOrders,
    icon: FileText
  }];
  return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({
      label,
      value,
      icon: Icon
    }) => <div key={label} className="p-6 rounded-xl bg-card border">
          <Icon className="h-5 w-5 text-primary mb-3" />
          <div className="text-2xl font-bold">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : value}
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>)}
    </div>;
}

/* ---------- Guards ---------- */

function Guard({
  isAdmin,
  message
}: {
  isAdmin: boolean;
  message: string;
}) {
  if (isAdmin) return null;
  return <div className="rounded-xl bg-card border p-6 text-sm text-muted-foreground">
      {message}
    </div>;
}
function UploadContent({
  isAdmin,
  onSuccess
}: any) {
  return <>
      <Guard isAdmin={isAdmin} message="Admin access required." />
      {isAdmin && <BeatUploadForm onSuccess={onSuccess} />}
    </>;
}
function BeatsContent({
  isAdmin
}: any) {
  return isAdmin ? <BeatsManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function SoundKitUploadContent({
  isAdmin,
  onSuccess
}: any) {
  return isAdmin ? <SoundKitUploadForm onSuccess={onSuccess} /> : <Guard isAdmin={false} message="Admin access required." />;
}
function SoundKitsContent({
  isAdmin
}: any) {
  return isAdmin ? <SoundKitsManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function AnalyticsContent({
  isAdmin
}: any) {
  return isAdmin ? <AnalyticsDashboard /> : <Guard isAdmin={false} message="Admin access required." />;
}
function ExclusiveOffersContent({
  isAdmin
}: any) {
  return isAdmin ? <ExclusiveOffersManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function LicensesContent({
  isAdmin
}: any) {
  return isAdmin ? <LicenseTemplatesManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function GeneratedLicensesContent({
  isAdmin
}: any) {
  return isAdmin ? <GeneratedLicensesManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function OrdersContent({
  isAdmin
}: any) {
  return isAdmin ? <OrdersManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function ServicesManageContent({
  isAdmin
}: any) {
  return isAdmin ? <ServicesManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function ServiceOrdersContent({
  isAdmin
}: any) {
  return isAdmin ? <ServiceOrdersManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function AdminUsersContent({
  isAdmin
}: any) {
  return isAdmin ? <AdminUsersManager /> : <Guard isAdmin={false} message="Admin access required." />;
}
function SettingsContent({
  isAdmin
}: any) {
  if (!isAdmin) {
    return <Guard isAdmin={false} message="Admin access required." />;
  }
  return <div className="space-y-6">
      <ContactSettingsManager />
      <PaymentSettingsManager />
    </div>;
}
function DashboardWithAnalytics({
  isAdmin,
  setActiveTab
}: {
  isAdmin: boolean;
  setActiveTab: (tab: string) => void;
}) {
  return <div className="space-y-8">
      <DashboardContent isAdmin={isAdmin} setActiveTab={setActiveTab} />
      {isAdmin && <DashboardAnalytics />}
    </div>;
}