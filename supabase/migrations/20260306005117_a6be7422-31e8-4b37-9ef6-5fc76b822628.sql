
-- Add owner_split_percentage to beats
ALTER TABLE public.beats ADD COLUMN owner_split_percentage numeric NOT NULL DEFAULT 100;

-- Create beat_collaborators table
CREATE TABLE public.beat_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id uuid NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  collaborator_user_id uuid NOT NULL,
  split_percentage numeric NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'co-producer',
  status text NOT NULL DEFAULT 'pending',
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(beat_id, collaborator_user_id)
);

ALTER TABLE public.beat_collaborators ENABLE ROW LEVEL SECURITY;

-- Beat owners can manage collaborators
CREATE POLICY "Beat owners can manage collaborators"
ON public.beat_collaborators FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.beats b
    JOIN public.tenants t ON t.id = b.tenant_id
    WHERE b.id = beat_collaborators.beat_id
    AND t.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.beats b
    JOIN public.tenants t ON t.id = b.tenant_id
    WHERE b.id = beat_collaborators.beat_id
    AND t.owner_user_id = auth.uid()
  )
);

-- Collaborators can view and update their own entries
CREATE POLICY "Collaborators can view own entries"
ON public.beat_collaborators FOR SELECT
TO authenticated
USING (collaborator_user_id = auth.uid());

CREATE POLICY "Collaborators can update own status"
ON public.beat_collaborators FOR UPDATE
TO authenticated
USING (collaborator_user_id = auth.uid())
WITH CHECK (collaborator_user_id = auth.uid());

-- Public can view accepted collaborators
CREATE POLICY "Anyone can view accepted collaborators"
ON public.beat_collaborators FOR SELECT
USING (status = 'accepted');

-- Admins can manage all
CREATE POLICY "Admins can manage all collaborators"
ON public.beat_collaborators FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create collaboration_earnings table
CREATE TABLE public.collaboration_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  beat_id uuid NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL,
  earnings_amount numeric NOT NULL DEFAULT 0,
  split_percentage numeric NOT NULL DEFAULT 0,
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collaboration_earnings ENABLE ROW LEVEL SECURITY;

-- Producers can view their own earnings
CREATE POLICY "Producers can view own earnings"
ON public.collaboration_earnings FOR SELECT
TO authenticated
USING (producer_id = auth.uid());

-- Admins can manage all earnings
CREATE POLICY "Admins can manage all earnings"
ON public.collaboration_earnings FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
