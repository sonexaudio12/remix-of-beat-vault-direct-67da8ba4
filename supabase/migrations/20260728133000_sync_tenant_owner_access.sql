CREATE OR REPLACE FUNCTION public.sync_tenant_owner_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id THEN
    UPDATE public.tenant_members
    SET role = 'manager'
    WHERE tenant_id = NEW.id
      AND user_id = OLD.owner_user_id
      AND role = 'owner';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_user_id, 'owner', 'active')
  ON CONFLICT (tenant_id, user_id)
  DO UPDATE SET role = 'owner', status = 'active';

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tenant_owner_changed_sync_access
AFTER INSERT OR UPDATE OF owner_user_id ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.sync_tenant_owner_access();
