import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Music, DollarSign, BarChart3, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { ReleaseCreateWizard } from './ReleaseCreateWizard';
import { ReleaseDetail } from './ReleaseDetail';

const statusColor: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  live: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function DistributionDashboard() {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [royaltySummary, setRoyaltySummary] = useState({ totalStreams: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();

  const loadData = async () => {
    setLoading(true);
    let q = supabase.from('releases').select('*').order('created_at', { ascending: false });
    if (tenant?.id) q = q.eq('tenant_id', tenant.id);
    const { data } = await q;
    setReleases(data || []);

    // Load royalty summary
    let rq = supabase.from('release_royalties').select('streams, revenue');
    if (tenant?.id) {
      // Filter by releases belonging to this tenant
      const releaseIds = (data || []).map((r: any) => r.id);
      if (releaseIds.length > 0) {
        rq = rq.in('release_id', releaseIds);
      }
    }
    const { data: royalties } = await rq;
    const totalStreams = (royalties || []).reduce((s: number, r: any) => s + (r.streams || 0), 0);
    const totalRevenue = (royalties || []).reduce((s: number, r: any) => s + Number(r.revenue || 0), 0);
    setRoyaltySummary({ totalStreams, totalRevenue });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [tenant?.id]);

  if (view === 'create') {
    return <ReleaseCreateWizard onClose={() => { setView('list'); loadData(); }} />;
  }

  if (view === 'detail' && selectedReleaseId) {
    return <ReleaseDetail releaseId={selectedReleaseId} onBack={() => { setView('list'); loadData(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Music Distribution</h2>
        <Button onClick={() => setView('create')} className="gap-2">
          <Plus className="h-4 w-4" /> New Release
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{releases.length}</p>
                <p className="text-sm text-muted-foreground">Total Releases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{royaltySummary.totalStreams.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Streams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">${royaltySummary.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Releases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Releases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : releases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No releases yet</p>
              <p className="text-sm">Create your first release to distribute your music worldwide.</p>
              <Button onClick={() => setView('create')} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Create Release
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{r.artist_name}</TableCell>
                    <TableCell>{r.release_date}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[r.status] || ''}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedReleaseId(r.id); setView('detail'); }}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
