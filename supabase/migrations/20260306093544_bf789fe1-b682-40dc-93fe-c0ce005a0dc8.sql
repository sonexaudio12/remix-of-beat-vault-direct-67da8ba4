
-- Create releases table
CREATE TABLE public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  artist_name text NOT NULL,
  featuring_artists text,
  genre text NOT NULL DEFAULT 'Hip Hop',
  release_date date NOT NULL DEFAULT CURRENT_DATE,
  is_explicit boolean NOT NULL DEFAULT false,
  upc text,
  cover_art_url text,
  status text NOT NULL DEFAULT 'draft',
  distribution_fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create release_tracks table
CREATE TABLE public.release_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  title text NOT NULL,
  audio_file_url text,
  isrc text,
  duration_seconds integer,
  track_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create release_stores table
CREATE TABLE public.release_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  store_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create release_royalties table
CREATE TABLE public.release_royalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  streams integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create distribution storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('distribution', 'distribution', false);

-- Enable RLS on all new tables
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_royalties ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger for releases
CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON public.releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for releases
CREATE POLICY "Admins can manage releases" ON public.releases FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Owners can view own releases" ON public.releases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owners can create releases" ON public.releases FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can update own releases" ON public.releases FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for release_tracks
CREATE POLICY "Admins can manage release_tracks" ON public.release_tracks FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Owners can view own tracks" ON public.release_tracks FOR SELECT USING (EXISTS (SELECT 1 FROM public.releases WHERE releases.id = release_tracks.release_id AND releases.user_id = auth.uid()));
CREATE POLICY "Owners can create tracks" ON public.release_tracks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.releases WHERE releases.id = release_tracks.release_id AND releases.user_id = auth.uid()));
CREATE POLICY "Owners can update own tracks" ON public.release_tracks FOR UPDATE USING (EXISTS (SELECT 1 FROM public.releases WHERE releases.id = release_tracks.release_id AND releases.user_id = auth.uid()));

-- RLS policies for release_stores
CREATE POLICY "Admins can manage release_stores" ON public.release_stores FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Owners can view own stores" ON public.release_stores FOR SELECT USING (EXISTS (SELECT 1 FROM public.releases WHERE releases.id = release_stores.release_id AND releases.user_id = auth.uid()));

-- RLS policies for release_royalties
CREATE POLICY "Admins can manage release_royalties" ON public.release_royalties FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Owners can view own royalties" ON public.release_royalties FOR SELECT USING (EXISTS (SELECT 1 FROM public.releases WHERE releases.id = release_royalties.release_id AND releases.user_id = auth.uid()));

-- Storage RLS for distribution bucket
CREATE POLICY "Admins can manage distribution files" ON storage.objects FOR ALL USING (bucket_id = 'distribution' AND (SELECT is_admin()));
CREATE POLICY "Authenticated users can upload distribution files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'distribution' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can read own distribution files" ON storage.objects FOR SELECT USING (bucket_id = 'distribution' AND auth.uid() IS NOT NULL);
