import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Mail, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { usePayPal } from '@/hooks/usePayPal';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

const Checkout = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [step, setStep] = useState<'info' | 'processing' | 'success' | 'error'>('info');
  const [orderId, setOrderId] = useState<string | null>(null);

  const { items, total, clearCart } = useCart();
  const { createOrder, captureOrder, isLoading, error } = usePayPal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle PayPal return
  useEffect(() => {
    const paypalOrderId = searchParams.get('token');
    const savedOrderId = searchParams.get('orderId');
    
    if (paypalOrderId && savedOrderId) {
      handlePayPalReturn(paypalOrderId, savedOrderId);
    }
  }, [searchParams]);

  const handlePayPalReturn = async (paypalOrderId: string, savedOrderId: string) => {
    setStep('processing');
    
    const result = await captureOrder(paypalOrderId, savedOrderId);
    
    if (result?.success) {
      setOrderId(savedOrderId);
      setStep('success');
      clearCart();
      toast.success('Payment successful! Check your email for download links.');
    } else {
      setStep('error');
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setEmailError(emailResult.error.errors[0].message);
      return;
    }
    setEmailError('');

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setStep('processing');

    const result = await createOrder(items, email, name || undefined);

    if (result?.approvalUrl) {
      // Store order ID for return
      const returnUrl = new URL(result.approvalUrl);
      
      // Redirect to PayPal with our order ID
      const currentUrl = new URL(window.location.href);
      currentUrl.pathname = '/checkout';
      currentUrl.searchParams.set('orderId', result.orderId);
      
      // PayPal will add the token parameter on return
      window.location.href = result.approvalUrl;
    } else {
      setStep('error');
      toast.error(error || 'Failed to create order');
    }
  };

  if (items.length === 0 && step === 'info') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some beats to your cart before checkout.
            </p>
            <Button variant="hero" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Browse Beats
            </Button>
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
        <div className="max-w-2xl mx-auto">
          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-4">Payment Successful!</h1>
              <p className="text-muted-foreground mb-2">
                Thank you for your purchase. Your order ID is:
              </p>
              <p className="font-mono text-sm bg-secondary px-4 py-2 rounded-lg inline-block mb-6">
                {orderId}
              </p>
              <p className="text-muted-foreground mb-8">
                We've sent download links to your email. Links expire in 7 days.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Continue Shopping
                </Button>
                <Button variant="hero" onClick={() => navigate(`/download?orderId=${orderId}&email=${email}`)}>
                  Download Now
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-4">Payment Failed</h1>
              <p className="text-muted-foreground mb-8">
                {error || 'Something went wrong with your payment. Please try again.'}
              </p>
              <Button variant="hero" onClick={() => setStep('info')}>
                Try Again
              </Button>
            </div>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
              <h1 className="font-display text-2xl font-bold mb-2">Processing Payment...</h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
            </div>
          )}

          {/* Checkout Form */}
          {step === 'info' && (
            <>
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate('/cart')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>

              <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Customer Info Form */}
                <div>
                  <div className="rounded-xl bg-card border border-border p-6">
                    <h2 className="font-display text-xl font-semibold mb-6">
                      Customer Information
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (emailError) setEmailError('');
                            }}
                            className="pl-10 bg-secondary"
                            required
                          />
                        </div>
                        {emailError && (
                          <p className="text-sm text-destructive">{emailError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Download links will be sent to this email
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 bg-secondary"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="hero"
                        size="lg"
                        className="w-full mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5" />
                            Pay with PayPal - ${total.toFixed(2)}
                          </>
                        )}
                      </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Secure payment powered by PayPal. No account required.
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <div className="rounded-xl bg-card border border-border p-6">
                    <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>

                    <div className="space-y-4 mb-6">
                      {items.map((item) => (
                        <div
                          key={`${item.beat.id}-${item.license.id}`}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={item.beat.coverUrl}
                            alt={item.beat.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{item.beat.title}</p>
                            <p className="text-xs text-muted-foreground">{item.license.name}</p>
                          </div>
                          <p className="font-semibold">${item.license.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing</span>
                        <span className="text-primary">Free</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">What you'll receive:</p>
                    <ul className="space-y-1">
                      <li>• Instant download links via email</li>
                      <li>• High-quality audio files</li>
                      <li>• License PDF with usage rights</li>
                      <li>• 7-day download window</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
