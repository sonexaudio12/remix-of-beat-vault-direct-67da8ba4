
-- Team role enum for label mode
CREATE TYPE public.team_role AS ENUM ('owner', 'producer', 'manager', 'viewer');

-- Team members table
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role team_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  invited_email text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Security definer function: check if user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND status = 'active'
  )
$$;

-- Security definer function: check if user is owner of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = _tenant_id
      AND owner_user_id = _user_id
  )
$$;

-- Security definer function: get user's role in a tenant
CREATE OR REPLACE FUNCTION public.get_tenant_member_role(_user_id uuid, _tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.tenant_members
  WHERE user_id = _user_id
    AND tenant_id = _tenant_id
    AND status = 'active'
  LIMIT 1
$$;

-- RLS: Tenant owners and managers can manage members
CREATE POLICY "Owners can manage members"
ON public.tenant_members
FOR ALL
TO authenticated
USING (
  public.is_tenant_owner(auth.uid(), tenant_id)
  OR (public.get_tenant_member_role(auth.uid(), tenant_id) = 'manager')
)
WITH CHECK (
  public.is_tenant_owner(auth.uid(), tenant_id)
  OR (public.get_tenant_member_role(auth.uid(), tenant_id) = 'manager')
);

-- RLS: Members can view their own membership
CREATE POLICY "Members can view own membership"
ON public.tenant_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS: Super admins can manage all
CREATE POLICY "Super admins can manage all members"
ON public.tenant_members
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Trigger to auto-insert owner as team member when tenant is created
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_members (tenant_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_user_id, 'owner', 'active')
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tenant_created_add_owner_member
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.add_owner_as_member();

-- Updated_at trigger
CREATE TRIGGER update_tenant_members_updated_at
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
