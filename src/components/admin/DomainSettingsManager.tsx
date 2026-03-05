import { useState, useEffect } from 'react';
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
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const generateVerificationToken = () =>
    `sonex_verify_${Math.random().toString(36).slice(2, 18)}`;

  useEffect(() => {
    let mounted = true;

    const loadOrCreateToken = async () => {
      if (!tenant) return;

      const { data } = await supabase
        .from('tenant_domains')
        .select('id, domain, verification_token')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (!mounted) return;

      if (data?.verification_token) {
        setVerificationToken(data.verification_token);
        return;
      }

      if (data?.id && data.domain) {
        const nextToken = generateVerificationToken();
        const { error } = await supabase
          .from('tenant_domains')
          .update({ verification_token: nextToken })
          .eq('id', data.id);

        if (!error && mounted) setVerificationToken(nextToken);
      }
    };

    void loadOrCreateToken();

    return () => {
      mounted = false;
    };
  }, [tenant?.id]);

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
      toast.success('Subdomain updated! Your store is now at ' + cleaned + '.sonexstudio.shop');
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

      // Upsert into tenant_domains with verification token
      const token = generateVerificationToken();
      const { data: existingDomain } = await supabase
        .from('tenant_domains')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existingDomain) {
        await supabase
          .from('tenant_domains')
          .update({ domain, status: 'pending', verification_token: token })
          .eq('id', existingDomain.id);
      } else {
        await supabase
          .from('tenant_domains')
          .insert({ tenant_id: tenant.id, domain, status: 'pending', verification_token: token });
      }
      setVerificationToken(token);

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
          <span className="text-sm text-muted-foreground whitespace-nowrap">.sonexstudio.shop</span>
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
            <div className="space-y-2 text-xs text-muted-foreground">
              <p><strong>DNS Setup:</strong></p>
              <p>1. Add an <strong>A record</strong> pointing to <code className="bg-muted px-1 rounded">185.158.133.1</code></p>
              <p>2. Add a <strong>TXT record</strong> with:</p>
              <div className="space-y-1">
                <p>
                  <strong>TXT Host/Name:</strong>{' '}
                  <code className="bg-muted px-1 rounded">_lovable</code>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span><strong>TXT Value:</strong></span>
                  <code className="bg-muted px-2 py-1 rounded text-xs break-all select-all">
                    {verificationToken ?? 'Click "Update Custom Domain" to generate token'}
                  </code>
                  {verificationToken && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(verificationToken);
                        toast.success('Copied!');
                      }}
                    >
                      Copy
                    </Button>
                  )}
                </div>
              </div>
            </div>
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
