import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Mail, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
  source: string;
}

export function EmailSubscribersManager() {
  const { tenant } = useTenant();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = tenant && ['pro', 'studio'].includes(tenant.plan);

  useEffect(() => {
    if (!canAccess) return;
    loadSubscribers();
  }, [tenant]);

  const loadSubscribers = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('email_subscribers' as any)
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error loading subscribers:', error);
      toast.error('Failed to load subscribers');
    } else {
      setSubscribers((data as any[] || []) as Subscriber[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('email_subscribers' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove subscriber');
    } else {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      toast.success('Subscriber removed');
    }
  };

  const handleExportCSV = () => {
    const activeSubscribers = subscribers.filter((s) => s.is_active);
    const csv = [
      'Email,Name,Subscribed At,Source',
      ...activeSubscribers.map(
        (s) =>
          `"${s.email}","${s.name || ''}","${s.subscribed_at}","${s.source}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  if (!canAccess) {
    return (
      <div className="text-center py-16">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Email Capture</h3>
        <p className="text-muted-foreground mb-4">
          Collect emails from your store visitors. Available on Pro and Studio plans.
        </p>
        <Button variant="outline" asChild>
          <a href="/upgrade">Upgrade Plan</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">Email Subscribers</h3>
            <p className="text-sm text-muted-foreground">
              {subscribers.filter((s) => s.is_active).length} active subscribers
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={subscribers.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No subscribers yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            The email capture form is shown on your storefront automatically.
          </p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>{sub.name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(sub.subscribed_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {sub.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.is_active ? 'default' : 'outline'}>
                      {sub.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sub.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
