-- Create payment_settings table for storing PayPal configuration
CREATE TABLE public.payment_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value text NOT NULL,
    is_encrypted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view payment settings
CREATE POLICY "Admins can view payment settings"
ON public.payment_settings
FOR SELECT
USING (is_admin());

-- Only admins can insert payment settings
CREATE POLICY "Admins can insert payment settings"
ON public.payment_settings
FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update payment settings
CREATE POLICY "Admins can update payment settings"
ON public.payment_settings
FOR UPDATE
USING (is_admin());

-- Only admins can delete payment settings
CREATE POLICY "Admins can delete payment settings"
ON public.payment_settings
FOR DELETE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings (empty values - admin will fill in)
INSERT INTO public.payment_settings (setting_key, setting_value) VALUES
('paypal_client_id', ''),
('paypal_client_secret', ''),
('paypal_mode', 'sandbox');