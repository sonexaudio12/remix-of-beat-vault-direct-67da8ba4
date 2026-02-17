
-- Automatically assign admin role to tenant owner on tenant creation
CREATE OR REPLACE FUNCTION public.assign_admin_on_tenant_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tenant_created_assign_admin
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_on_tenant_create();
