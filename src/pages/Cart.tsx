import { useState } from 'react';
import { Trash2, ShoppingBag, ArrowLeft, Music2, Archive, Tag, Loader2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Cart = () => {
  const navigate = useNavigate();
  const {
    items,
    removeItem,
    total
  } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return;
    setApplyingCode(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error('Invalid discount code'); setApplyingCode(false); return; }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error('This code has expired'); setApplyingCode(false); return;
      }
      // Check max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error('This code has reached its usage limit'); setApplyingCode(false); return;
      }
      // Check min order
      if (data.min_order_amount && total < data.min_order_amount) {
        toast.error(`Minimum order of $${data.min_order_amount} required`); setApplyingCode(false); return;
      }

      setAppliedDiscount({
        code: data.code,
        type: data.discount_type,
        value: data.discount_value,
      });
      toast.success(`Code "${data.code}" applied!`);
    } catch (err) {
      toast.error('Failed to validate code');
    }
    setApplyingCode(false);
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percentage'
      ? total * (appliedDiscount.value / 100)
      : Math.min(appliedDiscount.value, total)
    : 0;
  const finalTotal = Math.max(0, total - discountAmount);
  if (items.length === 0) {
    return <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Browse our collection of premium beats and sound kits.
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                <ArrowLeft className="h-4 w-4" />
                Browse Store
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>;
  }
  return <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => {
              if (item.itemType === 'beat' && item.beat && item.license) {
                return <div key={`beat-${item.beat.id}-${item.license.id}`} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
                      <img src={item.beat.coverUrl} alt={item.beat.title} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Music2 className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold truncate">{item.beat.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.license.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.license.includes.slice(0, 2).map((inc, i) => <span key={i} className="inline-block px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground">
                              {inc}
                            </span>)}
                          {item.license.includes.length > 2 && <span className="text-xs text-muted-foreground">
                              +{item.license.includes.length - 2} more
                            </span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${item.license.price.toFixed(2)}</p>
                        <Button variant="ghost" size="iconSm" onClick={() => removeItem(item.beat!.id, 'beat')} className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>;
              } else if (item.itemType === 'sound_kit' && item.soundKit) {
                return <div key={`soundkit-${item.soundKit.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                      {item.soundKit.coverUrl ? <img src={item.soundKit.coverUrl} alt={item.soundKit.title} className="w-16 h-16 rounded-lg object-cover" /> : <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                          <Archive className="h-6 w-6 text-muted-foreground" />
                        </div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Archive className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold truncate">{item.soundKit.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.soundKit.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${item.soundKit.price.toFixed(2)}</p>
                        <Button variant="ghost" size="iconSm" onClick={() => removeItem(item.soundKit!.id, 'sound_kit')} className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>;
              }
              return null;
            })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border p-6 sticky top-24 bg-background">
                <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>
                
                {/* Discount Code Input */}
                <div className="mb-4">
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-mono font-bold text-primary">{appliedDiscount.code}</span>
                        <span className="text-xs text-muted-foreground">
                          ({appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% off` : `$${appliedDiscount.value} off`})
                        </span>
                      </div>
                      <button onClick={removeDiscount} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Discount code"
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyDiscountCode()}
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="sm" onClick={applyDiscountCode} disabled={applyingCode || !discountCode.trim()}>
                        {applyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary">Discount</span>
                      <span className="text-primary">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing fee</span>
                    <span className="text-primary">$0.00</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/checkout', { state: { discount: appliedDiscount } })}>
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure checkout powered by PayPal & Stripe. Instant digital delivery after payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
};
export default Cart;