-- Allow authenticated users to read their own generated license PDFs
-- The path pattern is: generated/{order_id}/{filename}
-- We verify the user owns the order via the orders table

CREATE POLICY "Users can download their own licenses"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'licenses'
  AND (storage.foldername(name))[1] = 'generated'
  AND EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id::text = (storage.foldername(name))[2]
      AND orders.user_id = auth.uid()
  )
);
