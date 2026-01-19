-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create beats table
CREATE TABLE public.beats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    bpm INTEGER NOT NULL DEFAULT 120,
    genre TEXT NOT NULL DEFAULT 'Hip Hop',
    mood TEXT NOT NULL DEFAULT 'Energetic',
    cover_url TEXT,
    preview_url TEXT,
    mp3_file_path TEXT,
    wav_file_path TEXT,
    stems_file_path TEXT,
    is_exclusive_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on beats
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;

-- Create license_tiers table (templates for license types)
CREATE TABLE public.license_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mp3', 'wav', 'stems')),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    includes TEXT[] NOT NULL DEFAULT '{}',
    license_pdf_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (beat_id, type)
);

-- Enable RLS on license_tiers
ALTER TABLE public.license_tiers ENABLE ROW LEVEL SECURITY;

-- Create orders table (supports guest checkout)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    paypal_order_id TEXT,
    paypal_transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    download_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE SET NULL,
    license_tier_id UUID REFERENCES public.license_tiers(id) ON DELETE SET NULL,
    beat_title TEXT NOT NULL,
    license_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create license_templates table for PDF templates
CREATE TABLE public.license_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL UNIQUE CHECK (type IN ('mp3', 'wav', 'stems', 'exclusive')),
    name TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on license_templates
ALTER TABLE public.license_templates ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beats_updated_at
    BEFORE UPDATE ON public.beats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_license_templates_updated_at
    BEFORE UPDATE ON public.license_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for beats (public read, admin write)
CREATE POLICY "Anyone can view active beats"
    ON public.beats FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can view all beats"
    ON public.beats FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can create beats"
    ON public.beats FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update beats"
    ON public.beats FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete beats"
    ON public.beats FOR DELETE
    USING (public.is_admin());

-- RLS Policies for license_tiers (public read, admin write)
CREATE POLICY "Anyone can view active license tiers"
    ON public.license_tiers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage license tiers"
    ON public.license_tiers FOR ALL
    USING (public.is_admin());

-- RLS Policies for orders (admin full access, order verification via edge function)
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage orders"
    ON public.orders FOR ALL
    USING (public.is_admin());

-- RLS Policies for order_items
CREATE POLICY "Admins can view all order items"
    ON public.order_items FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

-- RLS Policies for license_templates
CREATE POLICY "Anyone can view license templates"
    ON public.license_templates FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage license templates"
    ON public.license_templates FOR ALL
    USING (public.is_admin());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('beats', 'beats', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('previews', 'previews', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('licenses', 'licenses', false);

-- Storage policies for covers bucket (public read)
CREATE POLICY "Public can view covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'covers');

CREATE POLICY "Admins can upload covers"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'covers' AND public.is_admin());

CREATE POLICY "Admins can update covers"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'covers' AND public.is_admin());

CREATE POLICY "Admins can delete covers"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'covers' AND public.is_admin());

-- Storage policies for previews bucket (public read)
CREATE POLICY "Public can view previews"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'previews');

CREATE POLICY "Admins can upload previews"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'previews' AND public.is_admin());

CREATE POLICY "Admins can update previews"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'previews' AND public.is_admin());

CREATE POLICY "Admins can delete previews"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'previews' AND public.is_admin());

-- Storage policies for beats bucket (admin only upload, download via edge function)
CREATE POLICY "Admins can manage beat files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'beats' AND public.is_admin());

-- Storage policies for licenses bucket (admin only)
CREATE POLICY "Admins can manage license files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'licenses' AND public.is_admin());

-- Insert default license templates
INSERT INTO public.license_templates (type, name) VALUES
    ('mp3', 'MP3 Lease Agreement'),
    ('wav', 'WAV Lease Agreement'),
    ('stems', 'Trackout License Agreement'),
    ('exclusive', 'Exclusive Rights Agreement');