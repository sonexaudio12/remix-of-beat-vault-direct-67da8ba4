-- Add user_id column to orders table to link orders to customer accounts
ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX idx_orders_user_id ON public.orders(user_id);

-- Add RLS policy for customers to view their own orders (by email OR user_id)
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (auth.jwt() ->> 'email') = customer_email
);

-- Add RLS policy for customers to view their own order items
CREATE POLICY "Customers can view their own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR (auth.jwt() ->> 'email') = orders.customer_email)
  )
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);