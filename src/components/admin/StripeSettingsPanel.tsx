import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Eye, EyeOff, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function StripeSettingsPanel() {
  const [settings, setSettings] = useState({
    stripe_secret_key: '',
    stripe_mode: 'test',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*');

      if (error) throw error;

      const map: Record<string, string> = {};
      (data as any[])?.forEach((s) => { map[s.setting_key] = s.setting_value; });

      setSettings(prev => ({ ...prev, ...map }));
    } catch (err: any) {
      console.error('Error loading Stripe settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        // Upsert: try update first, insert if not exists
        const { data: existing } = await supabase
          .from('payment_settings')
          .select('id')
          .eq('setting_key', key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('payment_settings')
            .update({ setting_value: value })
            .eq('setting_key', key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('payment_settings')
            .insert({ setting_key: key, setting_value: value });
          if (error) throw error;
        }
      }
      toast.success('Stripe settings saved successfully');
    } catch (err: any) {
      console.error('Error saving Stripe settings:', err);
      toast.error('Failed to save Stripe settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Stripe Configuration</CardTitle>
              <CardDescription>Connect your Stripe account to accept card payments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="stripe_mode">Environment</Label>
            <Select
              value={settings.stripe_mode}
              onValueChange={(value) => setSettings(prev => ({ ...prev, stripe_mode: value }))}
            >
              <SelectTrigger id="stripe_mode">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test Mode</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use Test mode for development, switch to Live when ready for real payments
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_secret_key">Secret Key</Label>
            <div className="relative">
              <Input
                id="stripe_secret_key"
                type={showSecret ? 'text' : 'password'}
                placeholder={settings.stripe_mode === 'test' ? 'sk_test_...' : 'sk_live_...'}
                value={settings.stripe_secret_key}
                onChange={(e) => setSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Found in your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard → Developers → API Keys</a>
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your credentials are stored securely and only accessible to admins
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Stripe Settings</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="space-y-2">
            <li>• Customers select Stripe at checkout and are redirected to a secure Stripe-hosted page</li>
            <li>• Stripe handles card processing, 3D Secure, and compliance</li>
            <li>• Orders are automatically fulfilled after successful payment</li>
            <li>• All transactions appear in your Stripe Dashboard</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-border">
            <h4 className="font-semibold text-sm text-foreground mb-1">Supported Payment Methods</h4>
            <p>Credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and other methods enabled in your Stripe dashboard.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
