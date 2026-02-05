-- Fix PUBLIC_USER_DATA: Make profiles table only viewable by the owner, not publicly
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix RLS_POLICY_ALWAYS_TRUE: Update "Anyone can create offers" to require email validation
DROP POLICY IF EXISTS "Anyone can create offers" ON public.exclusive_offers;

-- Only allow creating offers with a valid email format and non-empty required fields
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
);

-- Fix RLS_POLICY_ALWAYS_TRUE: Update "Anyone can insert plays" with validation
DROP POLICY IF EXISTS "Anyone can insert plays" ON public.beat_plays;

-- Only allow inserting plays with valid beat_id reference
CREATE POLICY "Validated plays can be inserted"
ON public.beat_plays
FOR INSERT
WITH CHECK (
  beat_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.beats WHERE id = beat_id AND is_active = true)
);

-- Fix RLS_POLICY_ALWAYS_TRUE: Update "Anyone can insert views" with validation
DROP POLICY IF EXISTS "Anyone can insert views" ON public.site_views;

-- Only allow inserting views with valid page_path
CREATE POLICY "Validated views can be inserted"
ON public.site_views
FOR INSERT
WITH CHECK (
  page_path IS NOT NULL
  AND length(page_path) > 0
  AND length(page_path) <= 500
);