import { useState } from 'react';
import { Languages, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useLanguage, StoreLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function LanguageSettingsManager() {
  const { tenant } = useTenant();
  const { language, setLanguage } = useLanguage();
  const [defaultLanguage, setDefaultLanguage] = useState<StoreLanguage>(
    tenant?.branding?.store_language === 'es' ? 'es' : 'en',
  );
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  if (!tenant) return null;

  const saveDefaultLanguage = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ branding: { ...tenant.branding, store_language: defaultLanguage } })
        .eq('id', tenant.id);
      if (error) throw error;

      setLanguage(defaultLanguage);
      toast.success('Default storefront language updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update language');
    } finally {
      setSaving(false);
    }
  };

  const translateBeatMetadata = async () => {
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-tenant-content', {
        body: { tenantId: tenant.id },
      });
      if (error) throw error;

      toast.success(`Spanish translations generated for ${Math.floor((data?.translated || 0) / 3)} beats`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not generate translations');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Languages className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Storefront Language</CardTitle>
            <CardDescription>Offer your customers an English or Spanish storefront.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="default-language">Default Language</Label>
          <Select value={defaultLanguage} onValueChange={(value) => setDefaultLanguage(value as StoreLanguage)}>
            <SelectTrigger id="default-language"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Customers can switch languages from the storefront navigation.</p>
          <Button onClick={saveDefaultLanguage} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Default Language
          </Button>
        </div>

        <div className="border-t border-border pt-6 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">AI Spanish Beat Translations</h3>
            <p className="text-xs text-muted-foreground mt-1">Generate and save Spanish versions of all beat titles, genres, and moods. This uses your server-side OpenAI key once, then visitors read the saved translations.</p>
          </div>
          <Button onClick={translateBeatMetadata} disabled={translating}>
            {translating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Spanish Beat Translations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
