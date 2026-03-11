import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { toast } from 'sonner';

export function EmailCaptureSection() {
  const { tenant } = useTenant();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Only show for Pro and Studio plans
  if (!tenant || !['pro', 'studio'].includes(tenant.plan)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('email_subscribers' as any)
        .insert({
          tenant_id: tenant.id,
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          source: 'website',
        } as any);

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already subscribed!");
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast.success('Successfully subscribed!');
      }
    } catch (err) {
      console.error('Email capture error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <section className="py-12 md:py-20">
        <div className="container max-w-2xl text-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-2">You're In!</h3>
            <p className="text-muted-foreground">
              You'll be the first to know about new releases, exclusive drops, and special offers.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20">
      <div className="container max-w-2xl text-center">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
          <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mx-auto mb-5">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Stay in the Loop
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get notified about new beats, exclusive drops, and special offers. No spam, ever.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="flex-shrink-0 sm:w-36"
            />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
