import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 md:py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Browse our collection of premium beats and find your next hit.
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                <ArrowLeft className="h-4 w-4" />
                Browse Beats
              </Button>
            </Link>
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
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.beat.id}-${item.license.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  <img
                    src={item.beat.coverUrl}
                    alt={item.beat.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.beat.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.license.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.license.includes.slice(0, 2).map((inc, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground"
                        >
                          {inc}
                        </span>
                      ))}
                      {item.license.includes.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.license.includes.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${item.license.price.toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => removeItem(item.beat.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl bg-card border border-border p-6 sticky top-24">
                <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing fee</span>
                    <span className="text-primary">$0.00</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure checkout powered by PayPal. Instant digital delivery after payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
