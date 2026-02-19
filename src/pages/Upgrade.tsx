import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    name: 'Pro',
    price: 499,
    popular: true,
    desc: 'Build a real brand. Full control. Custom domain.',
    features: [
      'Everything in Launch, plus:',
      'Custom domain support (yourdomain.com)',
      'Remove Sonex footer branding',
      'Advanced store customization',
      'Discount codes & promotions',
      'Email capture system',
      '2 years feature updates',
      '1 year priority support',
      '1 year hosting included',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Studio',
    price: 999,
    desc: 'For labels, collectives, and high-volume producers.',
    features: [
      'Everything in Pro, plus:',
      'Multiple producers (Label Mode)',
      'Team access roles',
      'Advanced revenue & conversion analytics',
      'Early feature access',
      'Lifetime updates',
      '2 years priority support',
      '1 year hosting included',
    ],
    cta: 'Upgrade to Studio',
  },
];

export default function Upgrade() {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planKey: string) => {
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke('create-saas-checkout', {
        body: { planKey },
      });
      if (error || !data?.url) {
        toast({ title: 'Error', description: data?.error || 'Could not start checkout', variant: 'destructive' });
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Upgrade Your Plan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Unlock custom domain support, advanced customization, and more by upgrading your Sonex plan.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 flex flex-col ${
                plan.popular
                  ? 'border-primary ring-2 ring-primary/20 bg-card'
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <span className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                  Recommended
                </span>
              )}
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 mb-3">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground ml-1 text-sm">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={loadingPlan === plan.name.toLowerCase()}
                onClick={() => handleCheckout(plan.name.toLowerCase())}
              >
                {loadingPlan === plan.name.toLowerCase() && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
