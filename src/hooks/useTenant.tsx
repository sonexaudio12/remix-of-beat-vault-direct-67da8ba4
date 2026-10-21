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

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '');
}

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

function getDomainCandidates(hostname: string): string[] {
  const candidates = new Set<string>([hostname]);
  if (hostname.startsWith('www.')) {
    candidates.add(hostname.replace(/^www\./, ''));
  } else {
    candidates.add(`www.${hostname}`);
  }
  return Array.from(candidates);
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaasLanding, setIsSaasLanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    // Wait for auth to finish loading before resolving tenant
    if (authLoading) return;

    let cancelled = false;
    setTenant(null);
    setIsSaasLanding(false);
    setError(null);
    setIsLoading(true);

    const resolve = async () => {
      try {
        // Normalize hostname: lowercase, no port
        const hostname = normalizeHostname(window.location.hostname);
        console.log('[TenantResolver] Hostname:', hostname);

        // Preview/dev/root domain environments
        if (isPreviewDomain(hostname) || SAAS_ROOT_DOMAINS.includes(hostname)) {
          console.log('[TenantResolver] Root/preview domain detected');
          // If user is logged in, check if they own a tenant
          if (userId) {
            // First check if they own a tenant
            const { data: ownedTenant, error: ownedTenantError } = await supabase
              .from('tenants')
              .select('*')
              .eq('owner_user_id', userId)
              .eq('status', 'active')
              .maybeSingle();

            if (cancelled) return;
            if (ownedTenantError) throw ownedTenantError;

            if (ownedTenant) {
              console.log('[TenantResolver] Found owned tenant:', ownedTenant.slug);
              setTenant(ownedTenant as Tenant);
              return;
            }

            // Check if they're a team member of any tenant
            const { data: membership, error: membershipError } = await supabase
              .from('tenant_members' as any)
              .select('tenant_id')
              .eq('user_id', userId)
              .eq('status', 'active')
              .limit(1)
              .maybeSingle();

            if (cancelled) return;
            if (membershipError) throw membershipError;

            if (membership) {
              const { data: memberTenant, error: memberTenantError } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', (membership as any).tenant_id)
                .eq('status', 'active')
                .maybeSingle();

              if (cancelled) return;
              if (memberTenantError) throw memberTenantError;

              if (memberTenant) {
                console.log('[TenantResolver] Found team tenant:', memberTenant.slug);
                setTenant(memberTenant as Tenant);
                return;
              }
            }
          }

          // No owned tenant → show SaaS landing
          console.log('[TenantResolver] No owned tenant, showing SaaS landing');
          setIsSaasLanding(true);
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

          if (cancelled) return;
          if (err) throw err;
          if (data) {
            console.log('[TenantResolver] Tenant found by subdomain:', data.name);
            setTenant(data as Tenant);
            return;
          }
          console.log('[TenantResolver] No tenant found for subdomain:', subdomain);
        }

        // Try custom domain match (e.g. beats.johnproducer.com)
        const domainCandidates = getDomainCandidates(hostname);
        console.log('[TenantResolver] Trying custom domain match:', domainCandidates.join(', '));

        const { data: domainRecord, error: domainError } = await supabase
          .from('tenant_domains')
          .select('tenant_id, domain, status')
          .in('domain', domainCandidates)
          .in('status', ['active', 'verified', 'pending'])
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (domainError) throw domainError;

        if (domainRecord) {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', domainRecord.tenant_id)
            .eq('status', 'active')
            .maybeSingle();

          if (cancelled) return;
          if (tenantError) throw tenantError;

          if (tenantData) {
            console.log('[TenantResolver] Tenant found by custom domain table:', tenantData.name);
            setTenant(tenantData as Tenant);
            return;
          }
        }

        // Fallback: direct match from tenants.custom_domain
        const { data: directTenant, error: directTenantError } = await supabase
          .from('tenants')
          .select('*')
          .in('custom_domain', domainCandidates)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (directTenantError) throw directTenantError;

        if (directTenant) {
          console.log('[TenantResolver] Tenant found by tenants.custom_domain:', directTenant.name);
          setTenant(directTenant as Tenant);
          return;
        }

        // No tenant found → show SaaS landing
        console.log('[TenantResolver] No tenant found for hostname, showing SaaS landing');
        setIsSaasLanding(true);
      } catch (e: unknown) {
        if (cancelled) return;
        console.error('[TenantResolver] Error:', e);
        setError(e instanceof Error ? e.message : 'Failed to resolve tenant');
        setIsSaasLanding(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, isSaasLanding, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
