import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Download, FileText, User, LogOut, Loader2, Calendar, Mail, RefreshCw, Headphones, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ServiceOrdersSection } from '@/components/account/ServiceOrdersSection';

interface OrderItem {
  id: string;
  beat_title: string;
  item_title: string | null;
  license_name: string;
  price: number;
  item_type: string;
  download_count: number;
  beat_id: string | null;
  sound_kit_id: string | null;
  license_tier_id: string | null;
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string | null;
  total: number;
  status: string;
  created_at: string;
  download_expires_at: string | null;
  order_items: OrderItem[];
}

const Account = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingOrder, setDownloadingOrder] = useState<string | null>(null);
  const [downloadingLicense, setDownloadingLicense] = useState<string | null>(null);
  const [orderLicenses, setOrderLicenses] = useState<Record<string, { name: string; path: string }[]>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_email,
          customer_name,
          total,
          status,
          created_at,
          download_expires_at,
          order_items (
            id,
            beat_title,
            item_title,
            license_name,
            price,
            item_type,
            download_count,
            beat_id,
            sound_kit_id,
            license_tier_id
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Fetch generated license PDFs for each order
      const licensesMap: Record<string, { name: string; path: string }[]> = {};
      for (const order of data || []) {
        try {
          const { data: files } = await supabase.storage
            .from('licenses')
            .list(`generated/${order.id}`);

          if (files && files.length > 0) {
            licensesMap[order.id] = files.map(f => ({
              name: f.name,
              path: `generated/${order.id}/${f.name}`,
            }));
          }
        } catch {
          // Ignore storage errors for individual orders
        }
      }
      setOrderLicenses(licensesMap);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLicense = async (path: string, filename: string) => {
    setDownloadingLicense(path);
    try {
      const { data, error } = await supabase.storage
        .from('licenses')
        .download(path);

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
      console.error('License download error:', error);
      toast.error('Failed to download license');
    } finally {
      setDownloadingLicense(null);
    }
  };

  const handlePreviewLicense = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('licenses')
        .createSignedUrl(path, 300);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('License preview error:', error);
      toast.error('Failed to preview license');
    }
  };

  const handleDownloadOrder = async (orderId: string, customerEmail: string) => {
    setDownloadingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('get-download-urls', {
        body: { orderId, customerEmail },
      });

      if (error) throw error;

      if (data?.downloads && data.downloads.length > 0) {
        for (const download of data.downloads) {
          if (download.url) {
            const link = document.createElement('a');
            link.href = download.url;
            link.download = download.fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
        toast.success('Downloads started!');
        fetchOrders(); // Refresh to update download counts
      } else {
        toast.error('No files available for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start downloads');
    } finally {
      setDownloadingOrder(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const isDownloadExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Account Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">My Account</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {orders.reduce((acc, order) => 
                      acc + order.order_items.reduce((sum, item) => sum + (item.download_count || 0), 0), 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {orders.reduce((acc, order) => 
                      acc + order.order_items.filter(item => item.item_type === 'beat').length, 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Licenses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for Beat Orders vs Service Orders */}
          <Tabs defaultValue="purchases" className="space-y-4">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="purchases" className="gap-2">
                <Package className="h-4 w-4" /> Purchases
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2">
                <Headphones className="h-4 w-4" /> Service Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchases">
              <div className="rounded-xl bg-card border border-border">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold">Order History</h2>
                    <Button variant="ghost" size="sm" onClick={fetchOrders}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No orders yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Your purchased beats and licenses will appear here
                    </p>
                    <Button variant="hero" asChild>
                      <Link to="/beats">Browse Beats</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.map((order) => {
                      const expired = isDownloadExpired(order.download_expires_at);
                      
                      return (
                        <div key={order.id} className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-mono text-muted-foreground">
                                  #{order.id.slice(0, 8)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'completed' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                                </span>
                                <span className="font-semibold text-foreground">
                                  ${order.total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {!expired && order.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadOrder(order.id, order.customer_email)}
                                  disabled={downloadingOrder === order.id}
                                >
                                  {downloadingOrder === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download All
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded ${
                                    item.item_type === 'beat' ? 'bg-primary/10' : 'bg-accent/10'
                                  }`}>
                                    {item.item_type === 'beat' ? (
                                      <FileText className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Package className="h-4 w-4 text-accent-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {item.item_title || item.beat_title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.license_name} • Downloaded {item.download_count}x
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {/* License PDFs */}
                          {orderLicenses[order.id] && orderLicenses[order.id].length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                License PDFs
                              </p>
                                <div className="flex flex-wrap gap-2">
                                {orderLicenses[order.id].map((license, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-7 gap-1.5"
                                      onClick={() => handlePreviewLicense(license.path)}
                                      title="Preview in browser"
                                    >
                                      <Eye className="h-3 w-3" />
                                      {license.name.length > 30 ? license.name.slice(0, 27) + '...' : license.name}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 px-2"
                                      disabled={downloadingLicense === license.path}
                                      onClick={() => handleDownloadLicense(license.path, license.name)}
                                      title="Download"
                                    >
                                      {downloadingLicense === license.path ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Download className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {expired && (
                            <p className="text-xs text-destructive mt-3">
                              Download links have expired. Contact support for assistance.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="services">
              <div className="rounded-xl bg-card border border-border">
                <div className="p-6 border-b border-border">
                  <h2 className="font-display text-xl font-semibold">Service Orders</h2>
                </div>
                <ServiceOrdersSection />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;