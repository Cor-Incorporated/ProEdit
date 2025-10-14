# Media Feature

## Purpose
Handles media file uploads, library management, file deduplication, and metadata extraction.

## Structure
- `components/` - React components for media library UI
- `hooks/` - Custom hooks for media operations
- `utils/` - File hash calculation, metadata extraction

## Key Components (Phase 4)
- `MediaLibrary.tsx` - Media library panel (Sheet)
- `MediaUpload.tsx` - File upload with drag-drop
- `MediaCard.tsx` - Individual media file card with thumbnail

## Key Utilities (Phase 4)
- `hash.ts` - File hash calculation for deduplication
- `metadata.ts` - Video/audio/image metadata extraction

## Omniclip References
- `vendor/omniclip/s/context/controllers/media/controller.ts`

## Implementation Status
- [ ] Phase 4: Media upload UI
- [ ] Phase 4: File deduplication
- [ ] Phase 4: Metadata extraction
- [ ] Phase 4: Thumbnail generation

