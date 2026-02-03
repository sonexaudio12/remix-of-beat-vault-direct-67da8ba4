import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Eye, EyeOff, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

export function PaymentSettingsManager() {
  const [settings, setSettings] = useState<Record<string, string>>({
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_mode: 'sandbox',
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

      const settingsMap: Record<string, string> = {};
      (data as PaymentSetting[])?.forEach((setting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      setSettings((prev) => ({
        ...prev,
        ...settingsMap,
      }));
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('payment_settings')
          .update({ setting_value: value })
          .eq('setting_key', key);

        if (error) throw error;
      }

      toast.success('Payment settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save payment settings');
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
              <CardTitle>PayPal Configuration</CardTitle>
              <CardDescription>
                Connect your PayPal Business account to receive payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="paypal_mode">Environment</Label>
            <Select
              value={settings.paypal_mode}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, paypal_mode: value }))
              }
            >
              <SelectTrigger id="paypal_mode">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use Sandbox for testing, switch to Live when ready to accept real payments
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paypal_client_id">Client ID</Label>
            <Input
              id="paypal_client_id"
              type="text"
              placeholder="Enter your PayPal Client ID"
              value={settings.paypal_client_id}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, paypal_client_id: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Found in your PayPal Developer Dashboard under App credentials
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paypal_client_secret">Client Secret</Label>
            <div className="relative">
              <Input
                id="paypal_client_secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="Enter your PayPal Client Secret"
                value={settings.paypal_client_secret}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, paypal_client_secret: e.target.value }))
                }
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
              Keep this secret secure - never share it publicly
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Your credentials are stored securely and only accessible to admins
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to get PayPal credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developer.paypal.com</a></li>
            <li>Log in with your PayPal Business account</li>
            <li>Navigate to Apps & Credentials</li>
            <li>Create a new app or select an existing one</li>
            <li>Copy the Client ID and Secret from the app details</li>
            <li>For testing, use Sandbox credentials. For real payments, use Live credentials</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
