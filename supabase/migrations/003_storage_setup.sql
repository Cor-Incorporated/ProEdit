-- Storage bucket for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-files',
  'media-files',
  false,
  524288000, -- 500MB
  ARRAY['video/*', 'audio/*', 'image/*']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media-files bucket
CREATE POLICY "Users can view own media files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
