import { useState, useEffect } from 'react';
import { FileText, Download, Eye, RefreshCw, Loader2, Calendar, User, Music, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
interface GeneratedLicense {
  name: string;
  path: string;
  orderId: string;
  createdAt: string;
}
interface OrderWithLicenses {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  purchaseDate: string;
  total: number;
  status: string;
  licenses: GeneratedLicense[];
  items: {
    title: string;
    licenseName: string;
    price: number;
    downloadCount: number;
  }[];
}
export function GeneratedLicensesManager() {
  const [orders, setOrders] = useState<OrderWithLicenses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  useEffect(() => {
    fetchOrdersWithLicenses();
  }, []);
  const fetchOrdersWithLicenses = async () => {
    setIsLoading(true);
    try {
      // Fetch completed orders with their items
      const {
        data: ordersData,
        error: ordersError
      } = await supabase.from('orders').select(`
          id,
          customer_email,
          customer_name,
          created_at,
          total,
          status,
          order_items (
            id,
            beat_title,
            item_title,
            license_name,
            price,
            download_count
          )
        `).eq('status', 'completed').order('created_at', {
        ascending: false
      });
      if (ordersError) throw ordersError;

      // For each order, check for generated licenses in storage
      const ordersWithLicenses: OrderWithLicenses[] = [];
      for (const order of ordersData || []) {
        const {
          data: files
        } = await supabase.storage.from('licenses').list(`generated/${order.id}`);
        const licenses: GeneratedLicense[] = (files || []).map(file => ({
          name: file.name,
          path: `generated/${order.id}/${file.name}`,
          orderId: order.id,
          createdAt: file.created_at || order.created_at
        }));
        ordersWithLicenses.push({
          orderId: order.id,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          purchaseDate: order.created_at,
          total: order.total,
          status: order.status,
          licenses,
          items: order.order_items.map((item: any) => ({
            title: item.item_title || item.beat_title,
            licenseName: item.license_name,
            price: item.price,
            downloadCount: item.download_count || 0
          }))
        });
      }
      setOrders(ordersWithLicenses);
    } catch (error) {
      console.error('Error fetching orders with licenses:', error);
      toast.error('Failed to load license data');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownload = async (path: string, filename: string) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('licenses').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('License downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download license');
    }
  };
  const handlePreview = async (path: string, title: string) => {
    setIsPreviewLoading(true);
    setPreviewTitle(title);
    try {
      const {
        data,
        error
      } = await supabase.storage.from('licenses').createSignedUrl(path, 300); // 5 minute expiry

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to load preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };
  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewTitle('');
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
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return order.customerEmail.toLowerCase().includes(query) || order.customerName?.toLowerCase().includes(query) || order.orderId.toLowerCase().includes(query) || order.items.some(item => item.title.toLowerCase().includes(query));
  });
  const totalLicenses = orders.reduce((sum, order) => sum + order.licenses.length, 0);
  const totalDownloads = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.downloadCount, 0), 0);
  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLicenses}</p>
              <p className="text-sm text-muted-foreground">Generated Licenses</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Download className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDownloads}</p>
              <p className="text-sm text-muted-foreground">Total Downloads</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Orders with Licenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-4 text-secondary-foreground">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email, name, order ID, or beat title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" onClick={fetchOrdersWithLicenses}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'No orders match your search' : 'No completed orders with licenses found'}
        </div> : <div className="space-y-4">
          {filteredOrders.map(order => <div key={order.orderId} className="rounded-xl bg-card border border-border overflow-hidden">
              {/* Order Header */}
              <div className="p-4 bg-secondary/30 border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {order.customerName || order.customerEmail}
                        </span>
                      </div>
                      {order.customerName && <p className="text-sm text-muted-foreground">{order.customerEmail}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.purchaseDate)}
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                      ${order.total.toFixed(2)}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Order: {order.orderId}
                </p>
              </div>

              {/* Items and Licenses */}
              <div className="p-4 space-y-3">
                {order.items.map((item, idx) => <div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Music className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.licenseName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {item.downloadCount} downloads
                      </Badge>
                      <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                    </div>
                  </div>)}

                {/* License Files */}
                {order.licenses.length > 0 && <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Generated License PDFs
                    </p>
                    <div className="space-y-2">
                      {order.licenses.map((license, idx) => <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <span className="text-sm truncate max-w-[300px]">{license.name}</span>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handlePreview(license.path, license.name)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDownload(license.path, license.name)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {order.licenses.length === 0 && <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground italic">
                      No generated licenses found (may be using template licenses)
                    </p>
                  </div>}
              </div>
            </div>)}
        </div>}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => closePreview()}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{previewTitle}</span>
              <Button variant="ghost" size="sm" onClick={closePreview}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {isPreviewLoading ? <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div> : previewUrl ? <iframe src={previewUrl} className="w-full h-full rounded-lg border border-border" title="License Preview" /> : null}
        </DialogContent>
      </Dialog>
    </div>;
}