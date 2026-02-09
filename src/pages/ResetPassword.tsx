import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo-new.png';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const navigate = useNavigate();
  const { clearPasswordRecovery } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!tokenHash || type !== 'recovery') {
        // Maybe the user arrived via Supabase's /verify redirect (PASSWORD_RECOVERY event)
        // Check if we're already in a recovery session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsVerified(true);
          setIsVerifying(false);
          return;
        }
        setVerifyError('Invalid or missing reset link. Please request a new one.');
        setIsVerifying(false);
        return;
      }

      // Verify the token directly — this logs the user in with a recovery session
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });

      if (error) {
        console.error('Token verification failed:', error);
        setVerifyError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setIsVerified(true);
      }
      setIsVerifying(false);
    };

    verifyToken();
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { password?: string; confirm?: string } = {};

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      newErrors.password = result.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        clearPasswordRecovery();
        toast.success('Password updated successfully!');
        // Sign out so user logs in fresh with new password
        await supabase.auth.signOut();
        setTimeout(() => navigate('/auth'), 3000);
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(187_100%_42%_/_0.1)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Sonex Beats" className="h-12 w-auto" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          {isVerifying ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h1 className="font-display text-2xl font-bold">Verifying Link</h1>
              <p className="text-muted-foreground text-sm">Please wait…</p>
            </div>
          ) : verifyError ? (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold">Link Expired</h1>
              <p className="text-muted-foreground text-sm">{verifyError}</p>
              <Button variant="hero" onClick={() => navigate('/forgot-password')} className="mt-4">
                Request New Link
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h1 className="font-display text-2xl font-bold">Password Updated</h1>
              <p className="text-muted-foreground text-sm">
                Your password has been reset. Redirecting to sign in…
              </p>
            </div>
          ) : isVerified ? (
            <>
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-bold mb-2">Set New Password</h1>
                <p className="text-muted-foreground text-sm">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                      }}
                      className="pl-10 pr-10 bg-secondary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
                      }}
                      className="pl-10 bg-secondary"
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-sm text-destructive">{errors.confirm}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
