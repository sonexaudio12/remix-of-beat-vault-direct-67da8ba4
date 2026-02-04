import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Play, ShoppingCart, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DateRange {
  from: Date;
  to: Date;
}

interface AnalyticsData {
  plays: { date: string; count: number }[];
  views: { date: string; count: number }[];
  sales: { date: string; count: number; revenue: number }[];
  topBeats: { title: string; plays: number }[];
  recentPurchases: { customer_name: string; customer_email: string; beat_title: string; price: number; created_at: string }[];
  totals: {
    totalPlays: number;
    totalViews: number;
    totalSales: number;
    totalRevenue: number;
  };
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfDay(dateRange.from).toISOString();
      const toDate = endOfDay(dateRange.to).toISOString();

      // Fetch plays
      const { data: plays, error: playsError } = await supabase
        .from('beat_plays')
        .select('played_at, beat_id')
        .gte('played_at', fromDate)
        .lte('played_at', toDate);

      if (playsError) throw playsError;

      // Fetch site views
      const { data: views, error: viewsError } = await supabase
        .from('site_views')
        .select('viewed_at, page_path')
        .gte('viewed_at', fromDate)
        .lte('viewed_at', toDate);

      if (viewsError) throw viewsError;

      // Fetch orders with items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          total,
          created_at,
          status,
          order_items (
            beat_title,
            price
          )
        `)
        .eq('status', 'completed')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch beats for top plays
      const { data: beats } = await supabase.from('beats').select('id, title');
      const beatMap = new Map(beats?.map(b => [b.id, b.title]) || []);

      // Process plays by date
      const playsByDate = new Map<string, number>();
      const playsByBeat = new Map<string, number>();
      
      plays?.forEach(p => {
        const date = format(new Date(p.played_at), 'yyyy-MM-dd');
        playsByDate.set(date, (playsByDate.get(date) || 0) + 1);
        playsByBeat.set(p.beat_id, (playsByBeat.get(p.beat_id) || 0) + 1);
      });

      // Process views by date
      const viewsByDate = new Map<string, number>();
      views?.forEach(v => {
        const date = format(new Date(v.viewed_at), 'yyyy-MM-dd');
        viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
      });

      // Process sales by date
      const salesByDate = new Map<string, { count: number; revenue: number }>();
      orders?.forEach(o => {
        const date = format(new Date(o.created_at), 'yyyy-MM-dd');
        const current = salesByDate.get(date) || { count: 0, revenue: 0 };
        salesByDate.set(date, {
          count: current.count + 1,
          revenue: current.revenue + Number(o.total),
        });
      });

      // Generate date series
      const dates: string[] = [];
      let currentDate = new Date(dateRange.from);
      while (currentDate <= dateRange.to) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }

      // Get top beats
      const topBeats = Array.from(playsByBeat.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, playCount]) => ({
          title: beatMap.get(id) || 'Unknown',
          plays: playCount,
        }));

      // Get recent purchases with customer info
      const recentPurchases = orders?.slice(0, 10).flatMap(o => 
        o.order_items.map(item => ({
          customer_name: o.customer_name || 'Guest',
          customer_email: o.customer_email,
          beat_title: item.beat_title,
          price: Number(item.price),
          created_at: o.created_at,
        }))
      ) || [];

      setData({
        plays: dates.map(d => ({ date: d, count: playsByDate.get(d) || 0 })),
        views: dates.map(d => ({ date: d, count: viewsByDate.get(d) || 0 })),
        sales: dates.map(d => ({ 
          date: d, 
          count: salesByDate.get(d)?.count || 0,
          revenue: salesByDate.get(d)?.revenue || 0,
        })),
        topBeats,
        recentPurchases,
        totals: {
          totalPlays: plays?.length || 0,
          totalViews: views?.length || 0,
          totalSales: orders?.length || 0,
          totalRevenue: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
        },
      });
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('justify-start text-left font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
            7 days
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
            30 days
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}>
            90 days
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 rounded-xl bg-card border">
          <Play className="h-5 w-5 text-primary mb-3" />
          <div className="text-2xl font-bold">{data?.totals.totalPlays.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Plays</p>
        </div>
        <div className="p-6 rounded-xl bg-card border">
          <Eye className="h-5 w-5 text-blue-500 mb-3" />
          <div className="text-2xl font-bold">{data?.totals.totalViews.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Site Views</p>
        </div>
        <div className="p-6 rounded-xl bg-card border">
          <ShoppingCart className="h-5 w-5 text-green-500 mb-3" />
          <div className="text-2xl font-bold">{data?.totals.totalSales}</div>
          <p className="text-sm text-muted-foreground">Total Sales</p>
        </div>
        <div className="p-6 rounded-xl bg-card border">
          <TrendingUp className="h-5 w-5 text-yellow-500 mb-3" />
          <div className="text-2xl font-bold">${data?.totals.totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Revenue</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plays Chart */}
        <div className="rounded-xl bg-card border p-6">
          <h3 className="font-semibold mb-4">Plays Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.plays}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => format(new Date(d), 'MMM d')}
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
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Site Views Chart */}
        <div className="rounded-xl bg-card border p-6">
          <h3 className="font-semibold mb-4">Site Views Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.views}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => format(new Date(d), 'MMM d')}
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
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl bg-card border p-6">
          <h3 className="font-semibold mb-4">Revenue Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => format(new Date(d), 'MMM d')}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(d) => format(new Date(d), 'MMM d, yyyy')}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Beats */}
        <div className="rounded-xl bg-card border p-6">
          <h3 className="font-semibold mb-4">Top Played Beats</h3>
          {data?.topBeats.length ? (
            <div className="space-y-3">
              {data.topBeats.map((beat, i) => (
                <div key={beat.title} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{i + 1}</span>
                    <span className="font-medium">{beat.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{beat.plays} plays</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No plays recorded yet</p>
          )}
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="rounded-xl bg-card border p-6">
        <h3 className="font-semibold mb-4">Recent Purchases</h3>
        {data?.recentPurchases.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Beat</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPurchases.map((purchase, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 px-4">{purchase.customer_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{purchase.customer_email}</td>
                    <td className="py-3 px-4">{purchase.beat_title}</td>
                    <td className="py-3 px-4 text-right">${purchase.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No purchases in this period</p>
        )}
      </div>
    </div>
  );
}
