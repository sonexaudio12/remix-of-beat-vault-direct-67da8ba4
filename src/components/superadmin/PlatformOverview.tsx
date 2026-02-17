import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Store, DollarSign, ShoppingCart } from 'lucide-react';

export function PlatformOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTenants: 0,
    activeTenants: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: totalUsers },
        { data: tenants },
        { data: orders },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tenants').select('id, status'),
        supabase.from('orders').select('total, status'),
      ]);

      const activeTenants = tenants?.filter(t => t.status === 'active').length ?? 0;
      const completedOrders = orders?.filter(o => o.status === 'completed') ?? [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        totalUsers: totalUsers ?? 0,
        totalTenants: tenants?.length ?? 0,
        activeTenants,
        totalOrders: orders?.length ?? 0,
        totalRevenue,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Total Tenants', value: stats.totalTenants, icon: Store },
    { label: 'Active Tenants', value: stats.activeTenants, icon: Store },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart },
    { label: 'Platform Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <p className="text-muted-foreground text-sm">High-level metrics across all tenants</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-5 rounded-xl bg-card border">
            <Icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : value}
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
