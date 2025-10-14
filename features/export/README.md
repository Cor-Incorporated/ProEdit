# Export Feature

## Purpose
Handles video export with FFmpeg.wasm, manages export jobs, and provides progress tracking.

## Structure
- `components/` - Export dialog and progress UI
- `ffmpeg/` - FFmpeg wrapper and helpers
- `utils/` - Export orchestration and codec detection
- `workers/` - Web Workers for encoding/decoding

## Key Components (Phase 8)
- `ExportDialog.tsx` - Export settings dialog
- `QualitySelector.tsx` - Resolution/quality selection
- `ExportProgress.tsx` - Progress bar and status

## Key Utilities (Phase 8)
- `FFmpegHelper.ts` - FFmpeg command builder
- `encoder.worker.ts` - Video encoding in Web Worker
- `decoder.worker.ts` - Video decoding in Web Worker
- `export.ts` - Export orchestration
- `codec.ts` - WebCodecs feature detection

## Export Settings
- Format: mp4, webm, mov
- Quality: low, medium, high, ultra (480p, 720p, 1080p, 4K)
- Codec: H.264, VP9, etc.
- Bitrate: configurable

## Omniclip References
- `vendor/omniclip/s/context/controllers/video-export/controller.ts`
- `vendor/omniclip/s/context/controllers/video-export/parts/encoder.ts`
- `vendor/omniclip/s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts`

## Implementation Status
- [ ] Phase 8: Export dialog UI
- [ ] Phase 8: FFmpeg integration
- [ ] Phase 8: Web Worker setup
- [ ] Phase 8: Progress tracking
- [ ] Phase 8: Quality presets

