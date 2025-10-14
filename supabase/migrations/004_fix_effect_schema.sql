-- Migration: Fix Effect Schema for omniclip compliance
-- Date: 2025-10-14
-- Purpose: Add start/end trim fields and metadata fields (file_hash, name, thumbnail)

-- Remove confusing start_time/end_time columns (not omniclip compliant)
ALTER TABLE effects DROP COLUMN IF EXISTS start_time;
ALTER TABLE effects DROP COLUMN IF EXISTS end_time;

-- Add omniclip-compliant trim point columns
-- These represent trim positions within the media file
ALTER TABLE effects ADD COLUMN IF NOT EXISTS start INTEGER NOT NULL DEFAULT 0;

-- "end" is a reserved keyword in PostgreSQL, so use double quotes
ALTER TABLE effects ADD COLUMN IF NOT EXISTS "end" INTEGER NOT NULL DEFAULT 0;

-- Add metadata columns for Effect deduplication and display
ALTER TABLE effects ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE effects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE effects ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_effects_file_hash ON effects(file_hash);
CREATE INDEX IF NOT EXISTS idx_effects_name ON effects(name);

-- Add column comments for clarity
COMMENT ON COLUMN effects.start IS 'Trim start position in ms (within media file) - from omniclip';
COMMENT ON COLUMN effects."end" IS 'Trim end position in ms (within media file) - from omniclip';
COMMENT ON COLUMN effects.duration IS 'Display duration in ms (calculated: end - start) - from omniclip';
COMMENT ON COLUMN effects.start_at_position IS 'Timeline position in ms - from omniclip';
COMMENT ON COLUMN effects.file_hash IS 'SHA-256 hash from source media file (for deduplication)';
COMMENT ON COLUMN effects.name IS 'Original filename from source media file';
COMMENT ON COLUMN effects.thumbnail IS 'Thumbnail URL or data URL (video only, optional for images)';
