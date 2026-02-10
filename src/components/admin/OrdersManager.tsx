import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Package, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface OrderItem {
  id: string;
  beat_title: string;
  license_name: string;
  price: number;
  download_count: number;
}
interface Order {
  id: string;
  customer_email: string;
  customer_name: string | null;
  status: string;
  total: number;
  paypal_order_id: string | null;
  paypal_transaction_id: string | null;
  created_at: string;
  download_expires_at: string | null;
  order_items: OrderItem[];
}
export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('orders').select(`
          id,
          customer_email,
          customer_name,
          status,
          total,
          paypal_order_id,
          paypal_transaction_id,
          created_at,
          download_expires_at,
          order_items (
            id,
            beat_title,
            license_name,
            price,
            download_count
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-amber-500/20 text-amber-400';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      case 'refunded':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (orders.length === 0) {
    return <div className="rounded-xl bg-card border border-border p-8 text-center">
        <p className="text-muted-foreground">No orders yet. Orders will appear here after customers make purchases.</p>
      </div>;
  }
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.total), 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  return <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 bg-popover">
        <div className="p-4 rounded-xl border border-border bg-sidebar-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-sidebar-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            <span className="text-sm">Completed Orders</span>
          </div>
          <p className="text-2xl font-bold">{completedOrders}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-[sidebar-accent-foreground] bg-sidebar-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Pending Orders</span>
          </div>
          <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex items-center justify-between text-secondary-foreground bg-popover">
        <p className="text-sm text-muted-foreground">
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {orders.map(order => <div key={order.id} className="rounded-xl border border-border p-4 text-secondary-foreground bg-popover">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm">{order.id.slice(0, 8)}...</span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <p className="font-medium">{order.customer_email}</p>
                {order.customer_name && <p className="text-sm text-muted-foreground">{order.customer_name}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2 mb-4">
              {order.order_items.map(item => <div key={item.id} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm">
                  <div>
                    <span className="font-medium">{item.beat_title}</span>
                    <span className="text-muted-foreground"> - {item.license_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {item.download_count} downloads
                    </span>
                    <span>${Number(item.price).toFixed(2)}</span>
                  </div>
                </div>)}
            </div>

            {/* PayPal Info */}
            {order.paypal_transaction_id && <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>PayPal Transaction: {order.paypal_transaction_id}</span>
                <a href={`https://www.paypal.com/activity/payment/${order.paypal_transaction_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>}
          </div>)}
      </div>
    </div>;
}