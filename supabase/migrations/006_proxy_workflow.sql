-- Proxy workflow enhancements

-- 1. Extend media_files table with proxy metadata
ALTER TABLE media_files
  ADD COLUMN IF NOT EXISTS proxy_path TEXT,
  ADD COLUMN IF NOT EXISTS proxy_status TEXT NOT NULL DEFAULT 'pending' CHECK (proxy_status IN ('pending', 'processing', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS proxy_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proxy_last_error TEXT;

-- Backfill existing rows: mark records without proxies as pending
UPDATE media_files
SET proxy_status = CASE
  WHEN proxy_path IS NOT NULL THEN 'ready'
  ELSE 'pending'
END
WHERE proxy_status IS NULL OR proxy_status NOT IN ('pending', 'processing', 'ready', 'failed');

-- 2. Create storage bucket for proxy media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-proxies',
  'media-proxies',
  false,
  536870912, -- 512MB
  ARRAY['video/*']
)
ON CONFLICT (id) DO NOTHING;

-- Access policies for proxy bucket
CREATE POLICY "Users can view own media proxies"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media-proxies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own media proxies"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-proxies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own media proxies"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media-proxies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own media proxies"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-proxies' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Create storage bucket for exported videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  2147483648, -- 2GB
  ARRAY['video/*']
)
ON CONFLICT (id) DO NOTHING;

-- Add error message column to export jobs for diagnostics
ALTER TABLE export_jobs
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Access policies for exports bucket
CREATE POLICY "Users can view own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own exports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
