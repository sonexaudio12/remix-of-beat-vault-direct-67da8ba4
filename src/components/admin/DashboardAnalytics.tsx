import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Play, Eye, ShoppingCart, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface QuickStats {
  plays: number;
  views: number;
  sales: number;
  revenue: number;
  playsTrend: number;
  viewsTrend: number;
  salesTrend: number;
  revenueTrend: number;
}

interface ChartData {
  date: string;
  plays: number;
  views: number;
}

export function DashboardAnalytics() {
  const { tenant } = useTenant();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const now = new Date();
      const last7Days = subDays(now, 7);
      const last14Days = subDays(now, 14);

      const currentFrom = startOfDay(last7Days).toISOString();
      const currentTo = endOfDay(now).toISOString();
      const prevFrom = startOfDay(last14Days).toISOString();
      const prevTo = endOfDay(last7Days).toISOString();

      // Build queries with tenant filter
      let playsQ = supabase.from('beat_plays').select('played_at').gte('played_at', currentFrom).lte('played_at', currentTo);
      let viewsQ = supabase.from('site_views').select('viewed_at').gte('viewed_at', currentFrom).lte('viewed_at', currentTo);
      let ordersQ = supabase.from('orders').select('total, created_at').eq('status', 'completed').gte('created_at', currentFrom).lte('created_at', currentTo);
      let prevPlaysQ = supabase.from('beat_plays').select('played_at').gte('played_at', prevFrom).lte('played_at', prevTo);
      let prevViewsQ = supabase.from('site_views').select('viewed_at').gte('viewed_at', prevFrom).lte('viewed_at', prevTo);
      let prevOrdersQ = supabase.from('orders').select('total').eq('status', 'completed').gte('created_at', prevFrom).lte('created_at', prevTo);

      if (tenant?.id) {
        playsQ = playsQ.eq('tenant_id', tenant.id);
        viewsQ = viewsQ.eq('tenant_id', tenant.id);
        ordersQ = ordersQ.eq('tenant_id', tenant.id);
        prevPlaysQ = prevPlaysQ.eq('tenant_id', tenant.id);
        prevViewsQ = prevViewsQ.eq('tenant_id', tenant.id);
        prevOrdersQ = prevOrdersQ.eq('tenant_id', tenant.id);
      }

      const [playsRes, viewsRes, ordersRes] = await Promise.all([playsQ, viewsQ, ordersQ]);
      const [prevPlaysRes, prevViewsRes, prevOrdersRes] = await Promise.all([prevPlaysQ, prevViewsQ, prevOrdersQ]);

      const currentPlays = playsRes.data?.length || 0;
      const currentViews = viewsRes.data?.length || 0;
      const currentSales = ordersRes.data?.length || 0;
      const currentRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      const prevPlays = prevPlaysRes.data?.length || 0;
      const prevViews = prevViewsRes.data?.length || 0;
      const prevSales = prevOrdersRes.data?.length || 0;
      const prevRevenue = prevOrdersRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      // Calculate trends (percentage change)
      const calcTrend = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - prev) / prev) * 100);
      };

      setStats({
        plays: currentPlays,
        views: currentViews,
        sales: currentSales,
        revenue: currentRevenue,
        playsTrend: calcTrend(currentPlays, prevPlays),
        viewsTrend: calcTrend(currentViews, prevViews),
        salesTrend: calcTrend(currentSales, prevSales),
        revenueTrend: calcTrend(currentRevenue, prevRevenue),
      });

      // Build chart data for last 7 days
      const playsByDate = new Map<string, number>();
      const viewsByDate = new Map<string, number>();

      playsRes.data?.forEach((p) => {
        const date = format(new Date(p.played_at), 'yyyy-MM-dd');
        playsByDate.set(date, (playsByDate.get(date) || 0) + 1);
      });

      viewsRes.data?.forEach((v) => {
        const date = format(new Date(v.viewed_at), 'yyyy-MM-dd');
        viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
      });

      const dates: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        dates.push({
          date,
          plays: playsByDate.get(date) || 0,
          views: viewsByDate.get(date) || 0,
        });
      }

      setChartData(dates);
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Quick Analytics (Last 7 Days)</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Plays',
      value: stats?.plays.toLocaleString() || '0',
      trend: stats?.playsTrend || 0,
      icon: Play,
      color: 'text-primary',
    },
    {
      label: 'Site Views',
      value: stats?.views.toLocaleString() || '0',
      trend: stats?.viewsTrend || 0,
      icon: Eye,
      color: 'text-blue-500',
    },
    {
      label: 'Sales',
      value: stats?.sales.toString() || '0',
      trend: stats?.salesTrend || 0,
      icon: ShoppingCart,
      color: 'text-green-500',
    },
    {
      label: 'Revenue',
      value: `$${stats?.revenue.toFixed(2) || '0.00'}`,
      trend: stats?.revenueTrend || 0,
      icon: TrendingUp,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Quick Analytics (Last 7 Days)</h2>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map(({ label, value, trend, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-xl bg-card border">
            <div className="flex items-center justify-between mb-3">
              <Icon className={`h-5 w-5 ${color}`} />
              {trend !== 0 && (
                <div
                  className={`flex items-center text-xs font-medium ${
                    trend > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Mini Chart */}
      <div className="rounded-xl bg-card border p-6">
        <h3 className="font-semibold mb-4">Activity This Week</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(new Date(d), 'EEE')}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(d) => format(new Date(d), 'MMM d, yyyy')}
              />
              <Line
                type="monotone"
                dataKey="plays"
                name="Plays"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="views"
                name="Views"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Plays</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">Views</span>
          </div>
        </div>
      </div>
    </div>
  );
}
