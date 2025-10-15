-- Update storage bucket file size limit from 500MB to 2GB
-- This matches the frontend MAX_FILE_SIZE configuration

-- Update the media-files bucket to allow 2GB files
UPDATE storage.buckets
SET file_size_limit = 2147483648 -- 2GB in bytes (2 * 1024 * 1024 * 1024)
WHERE id = 'media-files';

-- Verify the update
DO $$
DECLARE
  current_limit bigint;
BEGIN
  SELECT file_size_limit INTO current_limit
  FROM storage.buckets
  WHERE id = 'media-files';

  IF current_limit = 2147483648 THEN
    RAISE NOTICE 'File size limit successfully updated to 2GB (% bytes)', current_limit;
  ELSE
    RAISE WARNING 'File size limit update may have failed. Current value: % bytes', current_limit;
  END IF;
END $$;
