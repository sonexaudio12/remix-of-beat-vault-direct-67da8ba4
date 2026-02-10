
-- Store theme/builder configuration as JSON per producer
CREATE TABLE public.store_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  config_type text NOT NULL DEFAULT 'theme',
  config_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, config_type, version)
);

-- Enable RLS
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage all configs
CREATE POLICY "Admins can manage store config"
  ON public.store_config FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Anyone can read published configs (for public rendering)
CREATE POLICY "Anyone can read published config"
  ON public.store_config FOR SELECT
  USING (is_published = true);

-- Trigger for updated_at
CREATE TRIGGER update_store_config_updated_at
  BEFORE UPDATE ON public.store_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
