# Effects Feature

## Purpose
Manages video effects, filters, animations, and text overlays.

## Structure
- `components/` - Effect editor panels and controls
- `utils/` - Effect application and processing utilities

## Key Components (Phase 7)
- `TextEditor.tsx` - Text overlay editor (Sheet)
- `FontPicker.tsx` - Font selection component
- `ColorPicker.tsx` - Color selection component
- `TextStyleControls.tsx` - Text styling controls

## Effect Types
- Video filters (brightness, contrast, saturation, blur, hue)
- Text overlays with styling
- Animations (fade in/out, slide, etc.)
- Transitions between effects

## Omniclip References
- `vendor/omniclip/s/context/controllers/compositor/parts/text-manager.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/filter-manager.ts`
- `vendor/omniclip/s/context/controllers/compositor/parts/animation-manager.ts`

## Implementation Status
- [ ] Phase 5: Basic filter support
- [ ] Phase 7: Text overlay creation
- [ ] Phase 7: Text styling
- [ ] Phase 7: Animation presets

