import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Package, DollarSign, Clock, Trash2, Pencil, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select(`
          id, customer_email, customer_name, status, total,
          paypal_order_id, paypal_transaction_id, created_at, download_expires_at,
          order_items (id, beat_title, license_name, price, download_count)
        `).order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setEditingOrderId(null);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (itemsError) throw itemsError;
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Order deleted');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div className="p-4 rounded-xl border border-border bg-sidebar-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Pending Orders</span>
          </div>
          <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          Refresh
        </Button>
      </div>

      {/* Orders Count */}
      <p className="text-sm text-muted-foreground">
        {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {filteredOrders.map(order => <div key={order.id} className="rounded-xl border border-border p-4 text-secondary-foreground bg-popover">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm">{order.id.slice(0, 8)}...</span>
                  {editingOrderId === order.id ? (
                    <Select defaultValue={order.status} onValueChange={(val) => updateOrderStatus(order.id, val)}>
                      <SelectTrigger className="w-[140px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingOrderId(editingOrderId === order.id ? null : order.id)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-medium">{order.customer_email}</p>
                {order.customer_name && <p className="text-sm text-muted-foreground">{order.customer_name}</p>}
              </div>
              <div className="text-right flex items-start gap-2">
                <div>
                  <p className="text-lg font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                {(order.status === 'cancelled' || order.status === 'pending' || order.status === 'failed') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this order and all its items. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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
                    <span className="text-xs text-muted-foreground">{item.download_count} downloads</span>
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