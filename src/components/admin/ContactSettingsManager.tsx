import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Mail, User, Phone, Scale, Mic } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

export function ContactSettingsManager() {
  const [settings, setSettings] = useState({
    contact_email: '',
    contact_name: '',
    contact_phone: '',
    producer_legal_name: '',
    producer_alias: '',
    producer_jurisdiction: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      (data as AdminSetting[])?.forEach((setting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      setSettings((prev) => ({
        ...prev,
        ...settingsMap,
      }));
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load contact settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('admin_settings')
          .update({ setting_value: value })
          .eq('setting_key', key);

        if (error) throw error;
      }

      toast.success('Contact settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save contact settings');
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Your contact details for customer communications
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="contact_name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Display Name
          </Label>
          <Input
            id="contact_name"
            type="text"
            placeholder="Enter your name or business name"
            value={settings.contact_name}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, contact_name: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            This name will be shown on licenses and customer communications
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email" className="flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="Enter your contact email"
            value={settings.contact_email}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, contact_email: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Used for receiving offer notifications and customer inquiries
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number (Optional)
          </Label>
          <Input
            id="contact_phone"
            type="tel"
            placeholder="Enter your phone number"
            value={settings.contact_phone}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, contact_phone: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Optional contact number for business inquiries
          </p>
        </div>

        <hr className="my-2 border-border" />
        <h3 className="font-semibold text-sm pt-2">License Agreement Settings</h3>
        <p className="text-xs text-muted-foreground -mt-4">
          These fields are used as placeholders in your license PDF templates.
        </p>

        <div className="space-y-2">
          <Label htmlFor="producer_legal_name" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Producer Legal Name
          </Label>
          <Input
            id="producer_legal_name"
            placeholder="e.g. Steven J. Lopez"
            value={settings.producer_legal_name}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, producer_legal_name: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Used as {'{PRODUCT_OWNER_FULLNAME}'} in license templates
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="producer_alias" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Producer Alias / Brand Name
          </Label>
          <Input
            id="producer_alias"
            placeholder="e.g. SonexLite"
            value={settings.producer_alias}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, producer_alias: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Used as {'{PRODUCER_ALIAS}'} in license templates
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="producer_jurisdiction" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Governing Law (State / Province / Country)
          </Label>
          <Input
            id="producer_jurisdiction"
            placeholder="e.g. State of New York, United States"
            value={settings.producer_jurisdiction}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, producer_jurisdiction: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Used as {'{STATE_PROVINCE_COUNTRY}'} in license templates
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
              Save Contact Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
