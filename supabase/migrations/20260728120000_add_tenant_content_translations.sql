CREATE TABLE public.tenant_content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('es')),
  source_type text NOT NULL CHECK (source_type IN ('beat')),
  source_id uuid NOT NULL,
  field text NOT NULL CHECK (field IN ('title', 'genre', 'mood')),
  translated_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, locale, source_type, source_id, field)
);

ALTER TABLE public.tenant_content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tenant translations"
  ON public.tenant_content_translations FOR SELECT
  USING (true);

CREATE POLICY "Tenant owners can manage translations"
  ON public.tenant_content_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = tenant_content_translations.tenant_id
        AND tenants.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = tenant_content_translations.tenant_id
        AND tenants.owner_user_id = auth.uid()
    )
  );

CREATE INDEX idx_tenant_content_translations_lookup
  ON public.tenant_content_translations (tenant_id, locale, source_type, source_id);
