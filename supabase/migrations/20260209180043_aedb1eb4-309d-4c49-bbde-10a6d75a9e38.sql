
-- Services catalog
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL, -- 'mixing', 'mastering', 'mixing_mastering', 'custom_beat'
  description text,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (is_admin());

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service orders
CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id),
  user_id uuid REFERENCES auth.users(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'submitted', -- submitted, in_progress, revisions, completed
  payment_status text NOT NULL DEFAULT 'pending', -- pending, paid, failed
  payment_method text, -- stripe, paypal
  payment_id text,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service orders" ON public.service_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create service orders" ON public.service_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage service orders" ON public.service_orders FOR ALL USING (is_admin());

CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service order files (customer uploads)
CREATE TABLE public.service_order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order files" ON public.service_order_files FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.service_orders WHERE service_orders.id = service_order_files.order_id AND service_orders.user_id = auth.uid()));
CREATE POLICY "Users can upload to own orders" ON public.service_order_files FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.service_orders WHERE service_orders.id = service_order_files.order_id AND service_orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order files" ON public.service_order_files FOR ALL USING (is_admin());

-- Status updates from producer
CREATE TABLE public.service_order_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_order_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order updates" ON public.service_order_updates FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.service_orders WHERE service_orders.id = service_order_updates.order_id AND service_orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order updates" ON public.service_order_updates FOR ALL USING (is_admin());

-- Storage bucket for service files
INSERT INTO storage.buckets (id, name, public) VALUES ('service-files', 'service-files', false);

-- Storage policies for service files
CREATE POLICY "Users can upload service files" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own service files" ON storage.objects FOR SELECT
USING (bucket_id = 'service-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can access all service files" ON storage.objects FOR ALL
USING (bucket_id = 'service-files' AND (SELECT is_admin()));

-- Seed default services
INSERT INTO public.services (title, type, description, price, sort_order) VALUES
('Mixing', 'mixing', 'Professional mixing to bring clarity, balance, and punch to your track. Includes EQ, compression, effects, and stereo imaging.', 150, 1),
('Mastering', 'mastering', 'Industry-standard mastering to make your track loud, polished, and ready for streaming platforms.', 75, 2),
('Mixing + Mastering', 'mixing_mastering', 'Complete mixing and mastering bundle — get your track fully produced and release-ready at a discounted price.', 200, 3),
('Custom Beat Production', 'custom_beat', 'A fully custom beat tailored to your vision. Share your references, style preferences, and creative direction.', 300, 4);

-- Enable realtime for service orders so customers see updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_order_updates;
