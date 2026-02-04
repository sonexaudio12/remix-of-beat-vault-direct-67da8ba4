-- Add is_free column to beats table for free downloads
ALTER TABLE public.beats ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;

-- Create analytics tables
CREATE TABLE IF NOT EXISTS public.beat_plays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id uuid REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    played_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    ip_hash text
);

CREATE TABLE IF NOT EXISTS public.site_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path text NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    ip_hash text,
    referrer text
);

-- Create exclusive offers table
CREATE TABLE IF NOT EXISTS public.exclusive_offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id uuid REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    offer_amount numeric NOT NULL,
    message text,
    status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
    admin_response text,
    counter_amount numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.beat_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for beat_plays
CREATE POLICY "Anyone can insert plays" ON public.beat_plays FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all plays" ON public.beat_plays FOR SELECT USING (is_admin());

-- RLS policies for site_views
CREATE POLICY "Anyone can insert views" ON public.site_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all site views" ON public.site_views FOR SELECT USING (is_admin());

-- RLS policies for exclusive_offers
CREATE POLICY "Anyone can create offers" ON public.exclusive_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view their own offers" ON public.exclusive_offers FOR SELECT USING (customer_email = (auth.jwt() ->> 'email'::text));
CREATE POLICY "Admins can view all offers" ON public.exclusive_offers FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update offers" ON public.exclusive_offers FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete offers" ON public.exclusive_offers FOR DELETE USING (is_admin());

-- Create trigger for updated_at on exclusive_offers
CREATE TRIGGER update_exclusive_offers_updated_at
BEFORE UPDATE ON public.exclusive_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_beat_plays_beat_id ON public.beat_plays(beat_id);
CREATE INDEX IF NOT EXISTS idx_beat_plays_played_at ON public.beat_plays(played_at);
CREATE INDEX IF NOT EXISTS idx_site_views_viewed_at ON public.site_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_site_views_page_path ON public.site_views(page_path);
CREATE INDEX IF NOT EXISTS idx_exclusive_offers_status ON public.exclusive_offers(status);
CREATE INDEX IF NOT EXISTS idx_exclusive_offers_beat_id ON public.exclusive_offers(beat_id);