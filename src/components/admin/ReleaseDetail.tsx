import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, ExternalLink, Music, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  live: 'bg-green-500/20 text-green-400',
  failed: 'bg-destructive/20 text-destructive',
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-destructive/20 text-destructive',
};

export function ReleaseDetail({ releaseId, onBack }: { releaseId: string; onBack: () => void }) {
  const [release, setRelease] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [royalties, setRoyalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [rRes, tRes, sRes, royRes] = await Promise.all([
        supabase.from('releases').select('*').eq('id', releaseId).single(),
        supabase.from('release_tracks').select('*').eq('release_id', releaseId).order('track_number'),
        supabase.from('release_stores').select('*').eq('release_id', releaseId),
        supabase.from('release_royalties').select('*').eq('release_id', releaseId),
      ]);
      setRelease(rRes.data);
      setTracks(tRes.data || []);
      setStores(sRes.data || []);
      setRoyalties(royRes.data || []);
      setLoading(false);
    };
    load();
  }, [releaseId]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!release) {
    return <div className="text-center py-16 text-muted-foreground">Release not found</div>;
  }

  const totalStreams = royalties.reduce((s, r) => s + (r.streams || 0), 0);
  const totalRevenue = royalties.reduce((s, r) => s + Number(r.revenue || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Releases
      </Button>

      {/* Release Header */}
      <div className="flex gap-6 items-start">
        {release.cover_art_url && (
          <div className="w-32 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            <img src={release.cover_art_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{release.title}</h2>
          <p className="text-muted-foreground">{release.artist_name}{release.featuring_artists ? ` feat. ${release.featuring_artists}` : ''}</p>
          <div className="flex items-center gap-3">
            <Badge className={statusColor[release.status] || ''}>{release.status}</Badge>
            <span className="text-sm text-muted-foreground">{release.genre}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{release.release_date}</span>
            {release.is_explicit && <Badge variant="outline">Explicit</Badge>}
          </div>
          {release.upc && <p className="text-xs text-muted-foreground">UPC: {release.upc}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Music className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalStreams.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Streams</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Status */}
      <Card>
        <CardHeader><CardTitle>Platform Status</CardTitle></CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No platforms selected</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.store_name}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[s.status] || ''}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.store_url ? (
                        <a href={s.store_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                          <ExternalLink className="h-3.5 w-3.5" /> Listen
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Royalties */}
      {royalties.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Royalties</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Streams</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {royalties.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.store_name}</TableCell>
                    <TableCell className="text-sm">{r.period_start} — {r.period_end}</TableCell>
                    <TableCell className="text-right">{r.streams.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${Number(r.revenue).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
