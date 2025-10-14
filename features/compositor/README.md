# Compositor Feature

## Purpose
Handles real-time video preview using PIXI.js, manages video/image/text/audio layers, and coordinates playback synchronization.

## Structure
- `components/` - React components for canvas and playback controls
- `managers/` - Media type managers (VideoManager, ImageManager, TextManager, AudioManager)
- `pixi/` - PIXI.js initialization and utilities
- `utils/` - Compositing utilities and helpers

## Key Managers (Phase 5)
- `VideoManager.ts` - Video layer management
- `ImageManager.ts` - Image layer management
- `TextManager.ts` - Text layer management (Phase 7)
- `AudioManager.ts` - Audio synchronization
- `FilterManager.ts` - Visual filters (brightness, contrast, etc.)
- `TransitionManager.ts` - Transition effects

## Omniclip References
- `vendor/omniclip/s/context/controllers/compositor/controller.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/video-manager.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/image-manager.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/text-manager.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/filter-manager.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/transition-manager.ts`

## Implementation Status
- [ ] Phase 5: PIXI.js canvas setup
- [ ] Phase 5: VideoManager
- [ ] Phase 5: ImageManager
- [ ] Phase 5: Playback controls
- [ ] Phase 7: TextManager

