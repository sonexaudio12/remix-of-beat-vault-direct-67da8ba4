-- Create a table for admin contact settings
CREATE TABLE public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert admin settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete admin settings" 
ON public.admin_settings 
FOR DELETE 
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('contact_email', ''),
  ('contact_name', ''),
  ('contact_phone', '');