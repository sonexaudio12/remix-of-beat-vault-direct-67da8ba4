import { useState, useEffect } from 'react';
import { Loader2, DollarSign, Music2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';

interface EarningRow {
  id: string;
  beat_id: string;
  earnings_amount: number;
  split_percentage: number;
  created_at: string;
  beat_title?: string;
}

export function CollaborationEarnings() {
  const { tenant } = useTenant();
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [tenant?.id]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('collaboration_earnings')
        .select('*, beats:beat_id (title)')
        .order('created_at', { ascending: false });

      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setEarnings(
        (data || []).map((row: any) => ({
          ...row,
          beat_title: row.beats?.title || 'Unknown Beat',
        }))
      );
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.earnings_amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 rounded-xl bg-card border border-border">
          <DollarSign className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Total Collaboration Earnings</p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <Music2 className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{new Set(earnings.map(e => e.beat_id)).size}</div>
          <p className="text-sm text-muted-foreground">Collaborative Beats</p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{earnings.length}</div>
          <p className="text-sm text-muted-foreground">Total Sales</p>
        </div>
      </div>

      {/* Earnings Table */}
      {earnings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No collaboration earnings yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Beat</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Split</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Earnings</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {earnings.map(earning => (
                <tr key={earning.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{earning.beat_title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{earning.split_percentage}%</td>
                  <td className="px-4 py-3 text-sm font-semibold text-primary">${Number(earning.earnings_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(earning.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
