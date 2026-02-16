
-- =============================================
-- PHASE 1: Multi-Tenant Database Architecture
-- =============================================

-- 1. Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text,
  domain_status text NOT NULL DEFAULT 'pending',
  plan text NOT NULL DEFAULT 'starter',
  stripe_payment_id text,
  status text NOT NULL DEFAULT 'setup',
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Owners can view their own tenant
CREATE POLICY "Owners can view own tenant" ON public.tenants
  FOR SELECT USING (auth.uid() = owner_user_id);

-- Owners can update their own tenant
CREATE POLICY "Owners can update own tenant" ON public.tenants
  FOR UPDATE USING (auth.uid() = owner_user_id);

-- Anyone can look up tenants by slug/domain (for resolution)
CREATE POLICY "Anyone can resolve tenants" ON public.tenants
  FOR SELECT USING (status = 'active');

-- Super admins (your account) can manage all tenants
CREATE POLICY "Super admins can manage tenants" ON public.tenants
  FOR ALL USING (is_admin());

-- 2. Create tenant_domains table
CREATE TABLE public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can resolve domains" ON public.tenant_domains
  FOR SELECT USING (true);

CREATE POLICY "Tenant owners can manage domains" ON public.tenant_domains
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE tenants.id = tenant_domains.tenant_id AND tenants.owner_user_id = auth.uid())
  );

CREATE POLICY "Super admins can manage domains" ON public.tenant_domains
  FOR ALL USING (is_admin());

-- 3. Add tenant_id to all existing tables
ALTER TABLE public.beats ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sound_kits ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.license_tiers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.license_templates ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.service_orders ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.discount_codes ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.store_config ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.admin_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payment_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.beat_plays ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.site_views ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.exclusive_offers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 4. Create indexes on tenant_id for performance
CREATE INDEX idx_beats_tenant ON public.beats(tenant_id);
CREATE INDEX idx_sound_kits_tenant ON public.sound_kits(tenant_id);
CREATE INDEX idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX idx_services_tenant ON public.services(tenant_id);
CREATE INDEX idx_store_config_tenant ON public.store_config(tenant_id);
CREATE INDEX idx_payment_settings_tenant ON public.payment_settings(tenant_id);
CREATE INDEX idx_beat_plays_tenant ON public.beat_plays(tenant_id);
CREATE INDEX idx_site_views_tenant ON public.site_views(tenant_id);
CREATE INDEX idx_discount_codes_tenant ON public.discount_codes(tenant_id);
CREATE INDEX idx_exclusive_offers_tenant ON public.exclusive_offers(tenant_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenant_domains_domain ON public.tenant_domains(domain);

-- 5. Create a helper function to get tenant_id for the current user (as a producer/owner)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE owner_user_id = auth.uid() LIMIT 1
$$;

-- 6. Add updated_at trigger for tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
