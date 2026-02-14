-- Allow authenticated users to read template license PDFs 
-- (stored under type folders like mp3/, wav/, stems/, etc.)
CREATE POLICY "Authenticated users can read template licenses"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'licenses'
  AND (storage.foldername(name))[1] != 'generated'
);