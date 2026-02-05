-- Fix the NULL user_id issue in exclusive_offers SELECT policy
-- Ensure unauthenticated offers (user_id IS NULL) are only visible to admins
DROP POLICY IF EXISTS "Authenticated users can view their own offers" ON public.exclusive_offers;

CREATE POLICY "Users can view their own offers"
ON public.exclusive_offers
FOR SELECT
USING (
  -- User must be authenticated AND either:
  -- 1. They are the owner (user_id matches their auth.uid())
  -- 2. They are an admin
  (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id)
  OR is_admin()
);