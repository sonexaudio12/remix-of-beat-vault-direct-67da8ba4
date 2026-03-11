
CREATE TABLE public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  source text DEFAULT 'website',
  UNIQUE(tenant_id, email)
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public insert)
CREATE POLICY "Anyone can subscribe to a store"
ON public.email_subscribers
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL 
  AND email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  AND tenant_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE id = email_subscribers.tenant_id 
    AND status = 'active'
    AND plan IN ('pro', 'studio')
  )
);

-- Admins can view all subscribers for their tenant
CREATE POLICY "Admins can manage email subscribers"
ON public.email_subscribers
FOR ALL
TO public
USING (is_admin())
WITH CHECK (is_admin());
