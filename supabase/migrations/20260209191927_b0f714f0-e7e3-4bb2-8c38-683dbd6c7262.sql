
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage license templates" ON public.license_templates;
DROP POLICY IF EXISTS "Anyone can view license templates" ON public.license_templates;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage license templates"
ON public.license_templates
AS PERMISSIVE
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view license templates"
ON public.license_templates
AS PERMISSIVE
FOR SELECT
USING (true);
