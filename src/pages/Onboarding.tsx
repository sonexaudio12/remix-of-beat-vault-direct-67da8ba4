import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 'verify' | 'auth' | 'store-setup' | 'done';

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const sessionId = searchParams.get('session_id');
  const planFromUrl = searchParams.get('plan') || 'launch';

  const [step, setStep] = useState<Step>('verify');
  const [plan, setPlan] = useState(planFromUrl);
  const [paymentEmail, setPaymentEmail] = useState('');
  const [stripePaymentId, setStripePaymentId] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState('');

  // Auth form
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Store setup
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Step 1: Verify payment
  useEffect(() => {
    if (!sessionId) {
      setVerifyError('No payment session found. Please purchase a plan first.');
      setIsVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-saas-payment', {
          body: { sessionId },
        });

        if (error || !data?.verified) {
          setVerifyError(data?.error || 'Payment verification failed.');
          setIsVerifying(false);
          return;
        }

        setPlan(data.plan);
        setPaymentEmail(data.email);
        setEmail(data.email);
        setStripePaymentId(data.stripePaymentId);
        setIsVerifying(false);

        if (user) {
          setStep('store-setup');
        } else {
          setStep('auth');
        }
      } catch (e) {
        setVerifyError('Could not verify payment. Please contact support.');
        setIsVerifying(false);
      }
    };

    verify();
  }, [sessionId, user]);

  // Auto-advance if already logged in
  useEffect(() => {
    if (user && step === 'auth') {
      setStep('store-setup');
    }
  }, [user, step]);

  // Slug check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug.toLowerCase())
        .maybeSingle();
      setSlugAvailable(!data);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      const fn = authMode === 'login' ? signIn : signUp;
      const { error } = await fn(email, password);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else if (authMode === 'signup') {
        toast({ title: 'Account created', description: 'Check your email for verification, then log in.' });
        setAuthMode('login');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStoreSetup = async () => {
    if (!storeName || !slug || slug.length < 3 || !slugAvailable || !user) return;

    setSetupLoading(true);
    try {
      const { error } = await supabase.from('tenants').insert({
        name: storeName,
        slug: slug.toLowerCase(),
        owner_user_id: user.id,
        plan,
        status: 'active',
        stripe_payment_id: stripePaymentId,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setSetupLoading(false);
        return;
      }

      // Force auth to re-fetch admin status after trigger assigns role
      await supabase.auth.refreshSession();
      setStep('done');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSetupLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Payment Issue</h1>
          <p className="text-muted-foreground">{verifyError}</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {['Payment', 'Account', 'Store Setup'].map((label, i) => {
            const stepIndex = step === 'auth' ? 1 : step === 'store-setup' ? 2 : step === 'done' ? 3 : 0;
            const isActive = i <= stepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
                {i < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Auth Step */}
        {step === 'auth' && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Create Your Account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {authMode === 'signup' ? 'Sign up to set up your store' : 'Log in to continue setup'}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div>
                <Label>Password</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
              </div>
              <Button onClick={handleAuth} disabled={authLoading} className="w-full">
                {authLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {authMode === 'signup' ? 'Create Account' : 'Log In'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  className="text-primary underline"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                >
                  {authMode === 'signup' ? 'Log in' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Store Setup Step */}
        {step === 'store-setup' && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Set Up Your Store</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Plan: <span className="font-semibold capitalize text-primary">{plan}</span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Store Name</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Beat Store"
                />
              </div>
              <div>
                <Label>Subdomain</Label>
                <div className="flex items-center gap-0">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
                    placeholder="mybeats"
                    className="rounded-r-none"
                  />
                  <span className="border border-l-0 border-border bg-muted px-3 h-10 flex items-center text-sm text-muted-foreground rounded-r-md whitespace-nowrap">
                    .sonexstudio.com
                  </span>
                </div>
                {slug.length >= 3 && slugAvailable !== null && (
                  <p className={`text-xs mt-1 ${slugAvailable ? 'text-green-600' : 'text-destructive'}`}>
                    {slugAvailable ? '✓ Available' : '✗ Already taken'}
                  </p>
                )}
              </div>
              <Button
                onClick={handleStoreSetup}
                disabled={setupLoading || !storeName || !slug || slug.length < 3 || !slugAvailable}
                className="w-full"
              >
                {setupLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create My Store
              </Button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your Store is Ready!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your store <strong>{storeName}</strong> is now live at{' '}
                <span className="text-primary font-medium">{slug}.sonexstudio.com</span>
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => window.location.href = '/admin'} className="w-full">
                Go to Admin Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                View Your Store
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
