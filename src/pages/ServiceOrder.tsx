import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, CreditCard, Mail, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const orderSchema = z.object({
  name: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  notes: z.string().max(5000).optional()
});

interface Service {
  id: string;
  title: string;
  type: string;
  description: string | null;
  price: number;
}

export default function ServiceOrder() {
  const { serviceId } = useParams<{serviceId: string;}>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCustomBeat = service?.type === 'custom_beat';

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      const { data } = await supabase.
      from('services').
      select('*').
      eq('id', serviceId).
      eq('is_active', true).
      single();
      setService(data as Service | null);
      setLoading(false);
    };
    load();
  }, [serviceId]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const maxSize = 200 * 1024 * 1024; // 200MB per file
    const oversized = newFiles.filter((f) => f.size > maxSize);
    if (oversized.length > 0) {
      toast.error('Max file size is 200MB per file');
      return;
    }
    setFiles((prev) => [...prev, ...newFiles].slice(0, 20));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !user) {
      if (!user) {
        toast.error('Please sign in to order a service');
        navigate('/login');
        return;
      }
      return;
    }

    const validation = orderSchema.safeParse({ name, email, notes });
    if (!validation.success) {
      const flat = validation.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0] || '',
        email: flat.email?.[0] || ''
      });
      return;
    }
    setErrors({});

    if (!isCustomBeat && files.length === 0) {
      toast.error('Please upload your audio files');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the service order
      const { data: order, error: orderError } = await supabase.
      from('service_orders').
      insert({
        service_id: service.id,
        user_id: user.id,
        customer_name: name,
        customer_email: email,
        notes: notes || null,
        total: service.price,
        payment_status: 'pending',
        payment_method: paymentMethod
      }).
      select().
      single();

      if (orderError) throw orderError;

      // 2. Upload files
      for (const file of files) {
        const filePath = `${order.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.
        from('service-files').
        upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          continue;
        }

        await supabase.from('service_order_files').insert({
          order_id: order.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id
        });
      }

      // 3. Redirect to payment
      if (paymentMethod === 'stripe') {
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
          body: {
            items: [{
              itemType: 'service',
              serviceId: service.id,
              serviceTitle: service.title,
              serviceOrderId: order.id,
              price: service.price
            }],
            customerEmail: email,
            customerName: name
          }
        });

        if (error || data?.error) throw new Error(data?.error || error?.message);
        if (data?.url) window.location.href = data.url;
      } else {
        // PayPal flow via existing edge function
        const { data, error } = await supabase.functions.invoke('create-paypal-order', {
          body: {
            items: [{
              itemType: 'service',
              serviceId: service.id,
              serviceTitle: service.title,
              serviceOrderId: order.id,
              price: service.price
            }],
            customerEmail: email,
            customerName: name
          }
        });

        if (error || data?.error) throw new Error(data?.error || error?.message);
        if (data?.approvalUrl) window.location.href = data.approvalUrl;
      }
    } catch (err: any) {
      console.error('Service order error:', err);
      toast.error('Failed to create order. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>);

  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Service not found</h1>
          <Button variant="hero" onClick={() => navigate('/services')}>
            View Services
          </Button>
        </main>
        <Footer />
      </div>);

  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/services')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>

          <h1 className="font-display text-3xl font-bold mb-2">Order: {service.title}</h1>
          <p className="text-muted-foreground mb-8">{service.description}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-border p-6 space-y-4 bg-background">
              <h2 className="font-display text-lg font-semibold">Your Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => {setName(e.target.value);setErrors((p) => ({ ...p, name: '' }));}} className="pl-10 bg-secondary" required />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => {setEmail(e.target.value);setErrors((p) => ({ ...p, email: '' }));}} className="pl-10 bg-secondary" required />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>

            {/* Service-specific fields */}
            <div className="rounded-xl border border-border p-6 space-y-4 bg-background">
              <h2 className="font-display text-lg font-semibold">
                {isCustomBeat ? 'Creative Brief' : 'Upload Your Files'}
              </h2>

              {isCustomBeat ?
              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reference songs, style/genre, creative ideas *</Label>
                    <Textarea
                    placeholder="Describe the beat you want — include reference songs, genre, tempo, mood, and any creative direction..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-secondary min-h-[150px]"
                    required />

                  </div>
                  <div className="space-y-2">
                    <Label>Reference files (optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Upload reference tracks</p>
                      <Input type="file" accept="audio/*,video/*" multiple onChange={handleFileAdd} className="max-w-xs mx-auto" />
                    </div>
                  </div>
                </div> :

              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload stems / multitracks / audio files *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Drag & drop or click to upload (max 200MB per file, up to 20 files)</p>
                      <Input type="file" accept="audio/*,.wav,.mp3,.flac,.aif,.aiff,.zip,.rar" multiple onChange={handleFileAdd} className="max-w-xs mx-auto" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                    placeholder="Any specific instructions for the engineer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-secondary" />

                  </div>
                </div>
              }

              {/* File list */}
              {files.length > 0 &&
              <div className="space-y-2">
                  <Label>Attached Files ({files.length})</Label>
                  <div className="space-y-1">
                    {files.map((file, i) =>
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-muted-foreground shrink-0">({(file.size / (1024 * 1024)).toFixed(1)}MB)</span>
                        </div>
                        <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                  )}
                  </div>
                </div>
              }
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-border p-6 space-y-4 bg-background">
              <h2 className="font-display text-lg font-semibold">Payment</h2>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod('stripe')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${paymentMethod === 'stripe' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                  <CreditCard className="h-5 w-5" /><span className="font-medium">Card</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('paypal')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${paymentMethod === 'paypal' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" /></svg>
                  <span className="font-medium">PayPal</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-display text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">${service.price}</span>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> :
                <>
                    <CreditCard className="h-5 w-5" />
                    {paymentMethod === 'stripe' ? 'Pay with Card' : 'Pay with PayPal'} — ${service.price}
                  </>
                }
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>);

}