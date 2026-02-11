import { useState, useEffect } from 'react';
import { Loader2, Package, Clock, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
interface ServiceOrder {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  notes: string | null;
  created_at: string;
  services?: {
    title: string;
    type: string;
  } | null;
}
interface OrderFile {
  id: string;
  file_name: string;
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
  completed: 'bg-green-500/10 text-green-400'
};
export function ServiceOrdersSection() {
  const {
    user
  } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const {
        data
      } = await supabase.from('service_orders').select('*, services(title, type)').order('created_at', {
        ascending: false
      });
      setOrders(data as unknown as ServiceOrder[] || []);
      setLoading(false);
    };
    load();

    // Realtime subscription for status updates
    const channel = supabase.channel('service-orders').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'service_orders'
    }, () => {
      load();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  if (loading) {
    return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>;
  }
  if (orders.length === 0) {
    return <div className="p-12 text-center bg-accent-foreground">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">No service orders</h3>
        <p className="text-muted-foreground text-sm">Your studio service orders will appear here</p>
      </div>;
  }
  return <div className="divide-y divide-border">
      {orders.map(order => <ServiceOrderCard key={order.id} order={order} />)}
    </div>;
}
function ServiceOrderCard({
  order
}: {
  order: ServiceOrder;
}) {
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [updates, setUpdates] = useState<OrderUpdate[]>([]);
  useEffect(() => {
    if (!expanded) return;
    const load = async () => {
      const [filesRes, updatesRes] = await Promise.all([supabase.from('service_order_files').select('id, file_name, file_size').eq('order_id', order.id), supabase.from('service_order_updates').select('*').eq('order_id', order.id).order('created_at', {
        ascending: false
      })]);
      setFiles(filesRes.data as OrderFile[] || []);
      setUpdates(updatesRes.data as OrderUpdate[] || []);
    };
    load();
  }, [expanded, order.id]);
  return <div className="p-6">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
              <span className="font-medium">{(order as any).services?.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-muted text-muted-foreground'}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(order.created_at), 'MMM d, yyyy')}
              </span>
              <span className="font-semibold text-foreground">${order.total}</span>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && <div className="mt-4 space-y-4">
          {order.notes && <div>
              <h4 className="text-sm font-medium mb-1">Your Notes</h4>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3 whitespace-pre-wrap">{order.notes}</p>
            </div>}

          {files.length > 0 && <div>
              <h4 className="text-sm font-medium mb-1">Your Files ({files.length})</h4>
              <div className="space-y-1">
                {files.map(f => <div key={f.id} className="flex items-center gap-2 p-2 rounded bg-secondary/50 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{f.file_name}</span>
                    {f.file_size && <span className="text-muted-foreground">({(f.file_size / (1024 * 1024)).toFixed(1)}MB)</span>}
                  </div>)}
              </div>
            </div>}

          {updates.length > 0 && <div>
              <h4 className="text-sm font-medium mb-2">Status Updates</h4>
              <div className="space-y-2">
                {updates.map(u => <div key={u.id} className="text-sm p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[u.status] || ''}`}>{u.status.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{format(new Date(u.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {u.message && <p className="text-muted-foreground">{u.message}</p>}
                  </div>)}
              </div>
            </div>}
        </div>}
    </div>;
}