import { useState, useEffect } from 'react';
import { Loader2, Download, ChevronDown, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  notes: string | null;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  service_id: string;
  services?: { title: string; type: string } | null;
}

interface OrderFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
}

interface OrderUpdate {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-400',
  in_progress: 'bg-yellow-500/10 text-yellow-400',
  revisions: 'bg-orange-500/10 text-orange-400',
  completed: 'bg-green-500/10 text-green-400',
};

export function ServiceOrdersManager() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, services(title, type)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load service orders');
    } else {
      setOrders((data as unknown as ServiceOrder[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Service Orders ({orders.length})</h2>
        <Button variant="outline" size="sm" onClick={fetchOrders}>Refresh</Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No service orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <ServiceOrderRow key={order.id} order={order} onUpdate={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceOrderRow({ order, onUpdate }: { order: ServiceOrder; onUpdate: () => void }) {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [updates, setUpdates] = useState<OrderUpdate[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [updateMessage, setUpdateMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDetails = async () => {
    const [filesRes, updatesRes] = await Promise.all([
      supabase.from('service_order_files').select('*').eq('order_id', order.id),
      supabase.from('service_order_updates').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
    ]);
    setFiles((filesRes.data as OrderFile[]) || []);
    setUpdates((updatesRes.data as OrderUpdate[]) || []);
  };

  useEffect(() => {
    if (expanded) loadDetails();
  }, [expanded]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    const { error: updateErr } = await supabase
      .from('service_orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (!updateErr) {
      await supabase.from('service_order_updates').insert({
        order_id: order.id,
        status: newStatus,
        message: updateMessage || null,
      });

      // Send email notification to customer
      try {
        await supabase.functions.invoke('send-service-order-update', {
          body: {
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            orderId: order.id,
            serviceTitle: (order as any).services?.title || 'Service',
            newStatus,
            message: updateMessage || undefined,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send status update email:', emailErr);
      }

      toast.success('Status updated & customer notified');
      setUpdateMessage('');
      onUpdate();
      loadDetails();
    } else {
      toast.error('Failed to update status');
    }
    setSaving(false);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from('service-files').createSignedUrl(filePath, 3600);
    if (error || !data?.signedUrl) {
      toast.error('Failed to generate download link');
      return;
    }
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
          <span className="font-medium">{order.customer_name}</span>
          <span className="text-sm text-muted-foreground">{(order as any).services?.title}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
            {order.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
            {order.payment_status}
          </span>
          <span className="font-semibold">${order.total}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email: {order.customer_email}</p>
              <p className="text-sm text-muted-foreground">Date: {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>

          {order.notes && (
            <div>
              <h4 className="text-sm font-medium mb-1">Customer Notes</h4>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Uploaded Files ({files.length})</h4>
              <div className="space-y-1">
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm">
                    <span className="truncate">{f.file_name} {f.file_size ? `(${(f.file_size / (1024*1024)).toFixed(1)}MB)` : ''}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(f.file_path, f.file_name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="text-sm font-medium">Update Status</h4>
            <div className="flex gap-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="revisions">Revisions</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Optional message to customer..." value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} className="bg-secondary" />
            <Button onClick={handleStatusUpdate} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Status'}
            </Button>
          </div>

          {/* Update History */}
          {updates.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Status History</h4>
              <div className="space-y-2">
                {updates.map(u => (
                  <div key={u.id} className="text-sm p-2 rounded bg-secondary/50">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[u.status] || ''}`}>{u.status.replace('_', ' ')}</span>
                    <span className="text-muted-foreground ml-2">{format(new Date(u.created_at), 'MMM d, yyyy h:mm a')}</span>
                    {u.message && <p className="mt-1 text-muted-foreground">{u.message}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
