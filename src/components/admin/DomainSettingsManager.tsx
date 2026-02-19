import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Link2, Loader2 } from 'lucide-react';

export function DomainSettingsManager() {
  const { tenant } = useTenant();
  const [slug, setSlug] = useState(tenant?.slug ?? '');
  const [customDomain, setCustomDomain] = useState(tenant?.custom_domain ?? '');
  const [saving, setSaving] = useState(false);

  if (!tenant) return null;

  const plan = tenant.plan?.toLowerCase() ?? 'launch';
  const canCustomDomain = plan === 'pro' || plan === 'studio';

  const handleSaveSlug = async () => {
    if (!slug.trim()) {
      toast.error('Subdomain cannot be empty');
      return;
    }
    const cleaned = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleaned.length < 3) {
      toast.error('Subdomain must be at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', cleaned)
        .neq('id', tenant.id)
        .maybeSingle();

      if (existing) {
        toast.error('This subdomain is already taken');
        return;
      }

      const { error } = await supabase
        .from('tenants')
        .update({ slug: cleaned })
        .eq('id', tenant.id);

      if (error) throw error;
      setSlug(cleaned);
      toast.success('Subdomain updated! Your store is now at ' + cleaned + '.sonexbeats.shop');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update subdomain');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    if (!customDomain.trim()) {
      toast.error('Domain cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const domain = customDomain.trim().toLowerCase();

      // Update tenant custom_domain
      const { error } = await supabase
        .from('tenants')
        .update({ custom_domain: domain, domain_status: 'pending' })
        .eq('id', tenant.id);

      if (error) throw error;

      // Upsert into tenant_domains
      const { data: existingDomain } = await supabase
        .from('tenant_domains')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existingDomain) {
        await supabase
          .from('tenant_domains')
          .update({ domain, status: 'pending' })
          .eq('id', existingDomain.id);
      } else {
        await supabase
          .from('tenant_domains')
          .insert({ tenant_id: tenant.id, domain, status: 'pending' });
      }

      toast.success('Custom domain saved! DNS configuration is required to activate it.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update custom domain');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Current Plan */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Current Plan:</span>
        <Badge variant="secondary" className="capitalize">{plan}</Badge>
      </div>

      {/* Subdomain (all plans) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <Label className="font-semibold">Subdomain</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="yourname"
            className="max-w-xs"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">.sonexbeats.shop</span>
        </div>
        <Button onClick={handleSaveSlug} disabled={saving || slug === tenant.slug} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Update Subdomain
        </Button>
      </div>

      {/* Custom Domain (Pro & Studio only) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <Label className="font-semibold">Custom Domain</Label>
          {!canCustomDomain && (
            <Badge variant="outline" className="text-xs">Pro / Studio only</Badge>
          )}
        </div>

        {canCustomDomain ? (
          <>
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="www.yourdomain.com"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Point your domain's A record to <code className="bg-muted px-1 rounded">185.158.133.1</code> and add a TXT record for verification.
            </p>
            <Button onClick={handleSaveCustomDomain} disabled={saving || customDomain === (tenant.custom_domain ?? '')} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Custom Domain
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upgrade to <strong>Pro</strong> or <strong>Studio</strong> to connect your own domain.
            </p>
            <Button asChild size="sm" variant="default">
              <Link to="/upgrade">Upgrade Plan</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
