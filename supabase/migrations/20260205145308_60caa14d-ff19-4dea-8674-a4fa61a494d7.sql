-- Fix EXPOSED_SENSITIVE_DATA: Remove email-based access from orders - require authentication only
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

-- Only allow viewing orders via authenticated user_id, not email matching
CREATE POLICY "Authenticated users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Fix EXPOSED_SENSITIVE_DATA: Remove email-based access from order_items
DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;

-- Only allow viewing order items if user owns the parent order (via user_id only)
CREATE POLICY "Authenticated users can view their own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Fix EXPOSED_SENSITIVE_DATA: Remove email-based access from exclusive_offers
DROP POLICY IF EXISTS "Customers can view their own offers" ON public.exclusive_offers;

-- Note: Exclusive offers can be submitted without authentication, so we need a different approach
-- For now, only allow admins to view offers (customers can submit but not retrieve)
-- If customers need to view their offers, they should log in and we'd need to link offers to user_id

-- Alternative: Keep email-based access but require authentication AND email match
-- This ensures an attacker cannot enumerate emails without being logged in as that user
CREATE POLICY "Authenticated users can view their own offers"
ON public.exclusive_offers
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND customer_email = (auth.jwt() ->> 'email')
);