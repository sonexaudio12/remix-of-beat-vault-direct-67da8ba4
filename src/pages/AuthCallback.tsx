import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let active = true;

    const finishConfirmation = async () => {
      const url = new URL(window.location.href);
      const callbackError = url.searchParams.get('error_description') || url.searchParams.get('error');
      if (callbackError) {
        if (active) setError(callbackError.replace(/\+/g, ' '));
        return;
      }

      const code = url.searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setError(exchangeError.message);
          return;
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        if (active) setError(sessionError?.message || 'This confirmation link is invalid or has expired.');
        return;
      }

      if (!active) return;
      setIsComplete(true);
      window.setTimeout(() => navigate('/admin', { replace: true }), 800);
    };

    finishConfirmation();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {error ? (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-2xl font-semibold">Email confirmation failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-6" onClick={() => navigate('/auth', { replace: true })}>
              Go to sign in
            </Button>
          </>
        ) : isComplete ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">Email confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">Confirming your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please keep this page open for a moment.</p>
          </>
        )}
      </section>
    </main>
  );
}
