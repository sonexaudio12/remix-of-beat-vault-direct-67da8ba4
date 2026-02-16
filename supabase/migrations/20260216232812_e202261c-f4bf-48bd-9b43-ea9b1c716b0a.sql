-- Allow authenticated users to create their own tenant
CREATE POLICY "Users can create own tenant"
ON public.tenants
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);
