-- Create storage policies for soundkits bucket (covers folder for cover images)
CREATE POLICY "Admins can upload soundkit covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'covers' AND
  public.is_admin()
);

CREATE POLICY "Admins can update soundkit covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'covers' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete soundkit covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'covers' AND
  public.is_admin()
);

CREATE POLICY "Anyone can view soundkit covers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'covers'
);

-- Create storage policies for soundkits bucket (files folder for zip files)
CREATE POLICY "Admins can upload soundkit files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'files' AND
  public.is_admin()
);

CREATE POLICY "Admins can update soundkit files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'files' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete soundkit files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'files' AND
  public.is_admin()
);

-- Create storage policies for soundkits bucket (previews folder for audio previews)
CREATE POLICY "Admins can upload soundkit previews"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'previews' AND
  public.is_admin()
);

CREATE POLICY "Admins can update soundkit previews"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'previews' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete soundkit previews"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'previews' AND
  public.is_admin()
);

CREATE POLICY "Anyone can view soundkit previews"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'soundkits' AND
  (storage.foldername(name))[1] = 'previews'
);