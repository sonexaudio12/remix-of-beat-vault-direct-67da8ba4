ALTER TABLE public.orders
ADD COLUMN discount_code text DEFAULT NULL,
ADD COLUMN discount_amount numeric DEFAULT 0;