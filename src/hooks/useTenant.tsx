import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan: string;
  status: string;
  branding: Record<string, unknown>;
  owner_user_id: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  isSaasLanding: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  isSaasLanding: false,
  error: null,
});

// Hostnames that should show the SaaS landing page instead of a store
const SAAS_ROOT_DOMAINS = [
  'sonexstudio.shop',
  'www.sonexstudio.shop',
  'localhost',
  '127.0.0.1',
];

function isPreviewDomain(hostname: string): boolean {
  return hostname.includes('lovable.app') || hostname.includes('lovableproject.com');
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3 && hostname.endsWith('sonexstudio.shop')) {
    const sub = parts.slice(0, parts.length - 2).join('.');
    if (sub !== 'www') return sub;
  }
  return null;
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaasLanding, setIsSaasLanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading before resolving tenant
    if (authLoading) return;

    const resolve = async () => {
      try {
        // Normalize hostname: lowercase, no port
        const hostname = window.location.hostname.toLowerCase();
        console.log('[TenantResolver] Hostname:', hostname);

        // Preview/dev/root domain environments
        if (isPreviewDomain(hostname) || SAAS_ROOT_DOMAINS.includes(hostname)) {
          console.log('[TenantResolver] Root/preview domain detected');
          // If user is logged in, check if they own a tenant
          if (user) {
            const { data: ownedTenant } = await supabase
              .from('tenants')
              .select('*')
              .eq('owner_user_id', user.id)
              .eq('status', 'active')
              .maybeSingle();

            if (ownedTenant) {
              console.log('[TenantResolver] Found owned tenant:', ownedTenant.slug);
              setTenant(ownedTenant as Tenant);
              setIsLoading(false);
              return;
            }
          }

          // No owned tenant → show SaaS landing
          console.log('[TenantResolver] No owned tenant, showing SaaS landing');
          setIsSaasLanding(true);
          setIsLoading(false);
          return;
        }

        // Try subdomain match first (e.g. producer.sonexstudio.shop)
        const subdomain = extractSubdomain(hostname);
        if (subdomain) {
          console.log('[TenantResolver] Subdomain detected:', subdomain);
          const { data, error: err } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', subdomain)
            .eq('status', 'active')
            .maybeSingle();

          if (err) throw err;
          if (data) {
            console.log('[TenantResolver] Tenant found by subdomain:', data.name);
            setTenant(data as Tenant);
            setIsLoading(false);
            return;
          }
          console.log('[TenantResolver] No tenant found for subdomain:', subdomain);
        }

        // Try custom domain match (e.g. beats.johnproducer.com)
        console.log('[TenantResolver] Trying custom domain match:', hostname);
        const { data: domainRecord } = await supabase
          .from('tenant_domains')
          .select('tenant_id')
          .eq('domain', hostname)
          .eq('status', 'active')
          .maybeSingle();

        if (domainRecord) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', domainRecord.tenant_id)
            .eq('status', 'active')
            .maybeSingle();

          if (tenantData) {
            console.log('[TenantResolver] Tenant found by custom domain:', tenantData.name);
            setTenant(tenantData as Tenant);
            setIsLoading(false);
            return;
          }
        }

        // No tenant found → show SaaS landing
        console.log('[TenantResolver] No tenant found for hostname, showing SaaS landing');
        setIsSaasLanding(true);
      } catch (e: unknown) {
        console.error('[TenantResolver] Error:', e);
        setError(e instanceof Error ? e.message : 'Failed to resolve tenant');
        setIsSaasLanding(true);
      } finally {
        setIsLoading(false);
      }
    };

    resolve();
  }, [user, authLoading]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, isSaasLanding, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
