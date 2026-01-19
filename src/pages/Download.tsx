import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download as DownloadIcon, FileAudio, Music, Archive, FileText, Loader2, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadFile {
  name: string;
  url: string;
  type: 'mp3' | 'wav' | 'stems' | 'license';
}

interface DownloadItem {
  beatTitle: string;
  licenseName: string;
  files: DownloadFile[];
}

interface OrderInfo {
  id: string;
  customerEmail: string;
  total: number;
  createdAt: string;
  expiresAt: string;
}

const Download = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && email) {
      fetchDownloads();
    }
  }, []);

  const fetchDownloads = async () => {
    if (!orderId || !email) {
      setError('Please enter your order ID and email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'get-download-urls',
        {
          body: { orderId, customerEmail: email },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setOrder(data.order);
      setDownloads(data.downloads);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch downloads');
      toast.error(err.message || 'Failed to fetch downloads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDownloads();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'mp3':
        return <Music className="h-5 w-5" />;
      case 'wav':
        return <FileAudio className="h-5 w-5" />;
      case 'stems':
        return <Archive className="h-5 w-5" />;
      case 'license':
        return <FileText className="h-5 w-5" />;
      default:
        return <DownloadIcon className="h-5 w-5" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'mp3':
        return 'text-primary';
      case 'wav':
        return 'text-amber-500';
      case 'stems':
        return 'text-purple-500';
      case 'license':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-center">
            Download Your Beats
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter your order details to access your purchased files
          </p>

          {/* Lookup Form */}
          {!order && (
            <div className="rounded-xl bg-card border border-border p-6 mb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="Enter your order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="bg-secondary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email used during purchase"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <DownloadIcon className="h-5 w-5" />
                      Get Downloads
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Downloads */}
          {order && (
            <>
              {/* Order Info */}
              <div className="rounded-xl bg-card border border-border p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Order Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOrder(null);
                      setDownloads([]);
                    }}
                  >
                    Look up another order
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono">{order.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">${order.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchase Date</p>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Downloads Expire</p>
                    <p>{new Date(order.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Download Items */}
              <div className="space-y-4">
                {downloads.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-card border border-border p-6"
                  >
                    <div className="mb-4">
                      <h3 className="font-display font-semibold text-lg">{item.beatTitle}</h3>
                      <p className="text-sm text-muted-foreground">{item.licenseName}</p>
                    </div>

                    <div className="space-y-2">
                      {item.files.map((file, fileIndex) => (
                        <a
                          key={fileIndex}
                          href={file.url}
                          download={file.name}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className={getFileColor(file.type)}>
                              {getFileIcon(file.type)}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground uppercase">
                                {file.type === 'license' ? 'License PDF' : file.type}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="iconSm" className="group-hover:bg-primary/20">
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {downloads.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No downloadable files found for this order.
                  </p>
                </div>
              )}

              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Download;
