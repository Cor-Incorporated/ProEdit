# Timeline Feature

## Purpose
Manages the video editing timeline, including track management, effect placement, drag-and-drop handlers, and timeline utilities.

## Structure
- `components/` - React components for timeline UI
- `handlers/` - Drag, trim, and placement handlers (ported from omniclip)
- `hooks/` - Custom React hooks for timeline logic
- `utils/` - Utility functions for timeline calculations

## Key Components (Phase 4)
- `Timeline.tsx` - Main timeline container
- `TimelineTrack.tsx` - Individual track component
- `EffectBlock.tsx` - Visual effect representation on timeline
- `TimelineRuler.tsx` - Time ruler with markers

## Omniclip References
- `vendor/omniclip/s/context/controllers/timeline/controller.ts`
- `vendor/omniclip/s/context/controllers/timeline/parts/effect-placement-proposal.ts`
- `vendor/omniclip/s/context/controllers/timeline/parts/drag-related/effect-drag.ts`
- `vendor/omniclip/s/context/controllers/timeline/parts/drag-related/effect-trim.ts`

## Implementation Status
- [ ] Phase 4: Basic timeline structure
- [ ] Phase 4: Effect placement logic
- [ ] Phase 6: Drag and drop handlers
- [ ] Phase 6: Trim handlers

