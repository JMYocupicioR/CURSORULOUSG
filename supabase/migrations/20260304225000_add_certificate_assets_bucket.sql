-- ─── Create public bucket for certificate images ───
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificate-assets',
  'certificate-assets',
  true,
  5242880,  -- 5 MB max
  '{image/png,image/jpeg,image/webp,image/svg+xml}'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage policies ───
-- Allow authenticated users to upload files
CREATE POLICY "Admins can upload certificate assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificate-assets');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Admins can update certificate assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'certificate-assets');

-- Allow authenticated users to delete files
CREATE POLICY "Admins can delete certificate assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificate-assets');

-- Public read access for certificate images (bucket is public)
CREATE POLICY "Public can read certificate assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'certificate-assets');

-- ─── Add background_url column ───
ALTER TABLE certificate_config
  ADD COLUMN IF NOT EXISTS background_url TEXT;
