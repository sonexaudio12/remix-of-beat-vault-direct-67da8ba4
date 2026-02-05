-- Add user_id column to exclusive_offers to properly link offers to authenticated users
ALTER TABLE public.exclusive_offers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop the current policy
DROP POLICY IF EXISTS "Authenticated users can view their own offers" ON public.exclusive_offers;

-- Create secure policy that checks user_id (for authenticated users) OR admin access
CREATE POLICY "Authenticated users can view their own offers"
ON public.exclusive_offers
FOR SELECT
USING (
  auth.uid() = user_id
  OR is_admin()
);

-- Update the insert policy to capture user_id from authenticated users
DROP POLICY IF EXISTS "Validated users can create offers" ON public.exclusive_offers;

CREATE POLICY "Validated users can create offers"
ON public.exclusive_offers
FOR INSERT
WITH CHECK (
  customer_email IS NOT NULL 
  AND customer_email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  AND customer_name IS NOT NULL 
  AND length(customer_name) > 0
  AND length(customer_name) <= 255
  AND beat_id IS NOT NULL
  AND offer_amount > 0
  AND offer_amount <= 999999
  -- If user is authenticated, their user_id must match
  AND (auth.uid() IS NULL OR user_id = auth.uid())
);