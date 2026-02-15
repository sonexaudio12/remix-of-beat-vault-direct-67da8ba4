import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Download as DownloadIcon, 
  FileAudio, 
  Music, 
  Archive, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  ShoppingBag,
  Clock,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadFile {
  name: string;
  url: string;
  type: 'mp3' | 'wav' | 'stems' | 'license' | 'soundkit';
}

interface DownloadItem {
  itemType: 'beat' | 'sound_kit';
  title: string;
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

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get('orderId') || '';
  const email = searchParams.get('email') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && email) {
      fetchDownloads();
    } else {
      setError('Missing order information');
      setIsLoading(false);
    }
  }, [orderId, email]);

  const fetchDownloads = async () => {
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

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const downloadAllFiles = async () => {
    const allFiles = downloads.flatMap(item => item.files);
    
    if (allFiles.length === 0) {
      toast.error('No files to download');
      return;
    }

    toast.info(`Starting download of ${allFiles.length} files...`);

    for (let i = 0; i < allFiles.length; i++) {
      await downloadFile(allFiles[i].url, allFiles[i].name);
      if (i < allFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    toast.success('All downloads completed!');
  };

  const getTotalFileCount = () => {
    return downloads.reduce((count, item) => count + item.files.length, 0);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'mp3':
        return <Music className="h-5 w-5" />;
      case 'wav':
        return <FileAudio className="h-5 w-5" />;
      case 'stems':
      case 'soundkit':
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
      case 'soundkit':
        return 'text-emerald-500';
      case 'license':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'mp3':
        return 'MP3 Audio';
      case 'wav':
        return 'WAV Audio';
      case 'stems':
        return 'Stems Package';
      case 'soundkit':
        return 'Sound Kit';
      case 'license':
        return 'License PDF';
      default:
        return '';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
            <h1 className="font-display text-2xl font-bold mb-2">Loading Your Order...</h1>
            <p className="text-muted-foreground">
              Please wait while we prepare your downloads.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-8">
              {error || "We couldn't find your order. Please check your order ID and email."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button variant="hero" onClick={() => navigate('/download')}>
                Look Up Order
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Thank You for Your Purchase!
            </h1>
            <p className="text-muted-foreground text-lg">
              Your order has been confirmed and your files are ready to download.
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="rounded-xl bg-card border border-border p-6 mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Order Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-sm truncate" title={order.id}>
                  {order.id.slice(0, 8)}...
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="font-semibold text-primary">${order.total.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date
                </p>
                <p className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Expires
                </p>
                <p className="text-sm">{new Date(order.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-primary/10 flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Confirmation Sent</p>
                <p className="text-xs text-muted-foreground">
                  Download links have been sent to <span className="font-medium">{order.customerEmail}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Downloads Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <DownloadIcon className="h-5 w-5 text-primary" />
                Your Downloads
              </h2>
              {downloads.length > 0 && (
                <Button 
                  variant="hero" 
                  size="sm"
                  onClick={downloadAllFiles}
                  className="gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download All ({getTotalFileCount()} files)
                </Button>
              )}
            </div>

            {downloads.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-card border border-border">
                <p className="text-muted-foreground">
                  No downloadable files found for this order.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {downloads.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-card border border-border overflow-hidden"
                  >
                    {/* Item Header */}
                    <div className="p-4 border-b border-border bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.itemType === 'sound_kit' ? 'bg-emerald-500/20' : 'bg-primary/20'
                        }`}>
                          {item.itemType === 'sound_kit' ? (
                            <Archive className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Music className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.licenseName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Files List */}
                    <div className="p-4 space-y-2">
                      {item.files.map((file, fileIndex) => (
                        <button
                          key={fileIndex}
                          onClick={() => downloadFile(file.url, file.name)}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className={getFileColor(file.type)}>
                              {getFileIcon(file.type)}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getFileTypeLabel(file.type)}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Download
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-8">
            <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
              Important Information
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Download links expire on {new Date(order.expiresAt).toLocaleDateString()}</li>
              <li>• Save your files to a secure location after downloading</li>
              <li>• Check your email for the license agreement PDF</li>
              <li>• For support, contact us with your order ID</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
            <Button variant="hero" onClick={() => navigate('/download')}>
              Look Up Another Order
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
