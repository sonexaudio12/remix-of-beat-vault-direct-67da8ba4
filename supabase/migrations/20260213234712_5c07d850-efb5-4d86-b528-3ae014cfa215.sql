
-- Drop the restrictive admin ALL policy on orders and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders"
ON public.orders
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Drop and recreate admin ALL policy on order_items as permissive
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items"
ON public.order_items
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
