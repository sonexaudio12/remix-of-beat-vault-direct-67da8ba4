-- Create storage policies for beats bucket (mp3, wav, stems folders)
CREATE POLICY "Admins can upload beat files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'beats' AND
  public.is_admin()
);

CREATE POLICY "Admins can update beat files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'beats' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete beat files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'beats' AND
  public.is_admin()
);

-- Create storage policies for licenses bucket
CREATE POLICY "Admins can upload licenses"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'licenses' AND
  public.is_admin()
);

CREATE POLICY "Admins can update licenses"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'licenses' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete licenses"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'licenses' AND
  public.is_admin()
);