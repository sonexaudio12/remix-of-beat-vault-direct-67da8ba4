-- Create sound_kits table
CREATE TABLE public.sound_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  preview_url TEXT,
  file_path TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Drum Kit',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sound_kits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sound_kits
CREATE POLICY "Anyone can view active sound kits" 
ON public.sound_kits 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all sound kits" 
ON public.sound_kits 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can create sound kits" 
ON public.sound_kits 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update sound kits" 
ON public.sound_kits 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete sound kits" 
ON public.sound_kits 
FOR DELETE 
USING (is_admin());

-- Add item_type and sound_kit_id to order_items
ALTER TABLE public.order_items 
ADD COLUMN item_type TEXT NOT NULL DEFAULT 'beat',
ADD COLUMN sound_kit_id UUID REFERENCES public.sound_kits(id),
ADD COLUMN item_title TEXT;

-- Update existing records to have item_title from beat_title
UPDATE public.order_items SET item_title = beat_title WHERE item_title IS NULL;

-- Create soundkits storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('soundkits', 'soundkits', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for soundkits bucket
CREATE POLICY "Admins can upload soundkits" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'soundkits' AND (SELECT is_admin()));

CREATE POLICY "Admins can update soundkits" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'soundkits' AND (SELECT is_admin()));

CREATE POLICY "Admins can delete soundkits" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'soundkits' AND (SELECT is_admin()));

CREATE POLICY "Authenticated users can read purchased soundkits"
ON storage.objects
FOR SELECT
USING (bucket_id = 'soundkits');

-- Create trigger for updated_at on sound_kits
CREATE TRIGGER update_sound_kits_updated_at
BEFORE UPDATE ON public.sound_kits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();