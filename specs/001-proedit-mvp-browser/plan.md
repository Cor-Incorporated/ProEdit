# Implementation Plan: ProEdit MVP - Browser-Based Video Editor

**Branch**: `001-proedit-mvp-browser` | **Date**: 2025-10-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-proedit-mvp-browser/spec.md`

## Summary

ProEdit is a browser-based video editing application that enables content creators to edit videos without installing software. The MVP delivers core editing capabilities including authentication, media management, timeline editing, real-time preview, and video export. The implementation leverages proven patterns from omniclip's architecture, using Next.js 15 with Supabase for backend services, and PIXI.js with FFmpeg.wasm for video processing.

## Technical Context

**Language/Version**: TypeScript 5.3+ with React 19 and Node.js 20 LTS
**Primary Dependencies**: Next.js 15, Supabase Client SDK, PIXI.js v8, FFmpeg.wasm, Zustand, Tailwind CSS, shadcn/ui (Radix UI)
**Storage**: Supabase (PostgreSQL for metadata, Storage for media files, Realtime for sync)
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: web - Full-stack application with client-heavy processing
**Performance Goals**: 60fps playback, 10MB/s upload speed, <500ms auto-save, 2x realtime export
**Constraints**: 500MB max file size, 10GB storage per user, client-side processing only
**Scale/Scope**: MVP supporting 1000 concurrent users, 30-minute projects, 50+ timeline elements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Validation

✅ **I. Proven Implementation Reuse**
- Directly porting omniclip's video processing pipeline (FFmpeg.wasm, WebCodecs)
- Reusing PIXI.js compositor patterns and effect system
- Adopting omniclip's Effect type definitions

✅ **II. Browser-First Performance**
- WebCodecs API for hardware-accelerated encoding/decoding
- Web Workers for parallel processing during export
- PIXI.js WebGL rendering for 60fps performance
- OPFS for large file handling

✅ **III. Modern Stack Integration**
- Next.js 15 App Router with React 19
- Supabase for all backend services (Auth, Database, Storage, Realtime)
- Zustand for state management (compatible with omniclip patterns)
- Server Actions for Supabase communication

✅ **IV. Usability First**
- Drag-and-drop for all media operations
- Keyboard shortcuts (Ctrl+Z/Y, Space for play/pause)
- Real-time preview at 60fps
- Comprehensive progress indicators

✅ **V. Scalable Architecture**
- Modular /features directory structure
- Independent feature modules (timeline, compositor, media, export)
- Plugin-ready effect system
- Micro-frontend architecture for panels

### Technical Standards Compliance

✅ **Architecture**: Following omniclip's State-Actions-Controllers-Views pattern
✅ **Security**: RLS on all tables, signed URLs for storage, TypeScript strict mode
✅ **Development Workflow**: Phase 1 (Auth + Core), Phase 2 (Editing), Phase 3 (Export)
✅ **Code Quality**: ESLint + Prettier, 70% test coverage target

## Project Structure

### Documentation (this feature)

```
specs/001-proedit-mvp-browser/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/                          # Next.js 15 App Router
├── (auth)/                   # Authentication flow
│   ├── login/
│   └── callback/
├── (editor)/                 # Main editor interface
│   ├── layout.tsx           # Editor layout with panels
│   ├── page.tsx             # Timeline view
│   └── [projectId]/         # Project-specific routes
├── api/                      # API routes (if needed beyond Server Actions)
└── actions/                  # Server Actions
    ├── projects.ts
    ├── media.ts
    └── effects.ts

features/                     # Core feature modules (from omniclip pattern)
├── timeline/                 # Timeline management
│   ├── components/
│   ├── hooks/
│   ├── store.ts             # Zustand slice
│   └── utils/
├── compositor/               # PIXI.js rendering
│   ├── components/
│   ├── managers/            # Video, Text, Image, Audio managers
│   ├── store.ts
│   └── pixi/                # PIXI.js initialization
├── media/                    # Media file management
│   ├── components/
│   ├── hooks/
│   ├── store.ts
│   └── utils/
├── effects/                  # Effect system
│   ├── components/
│   ├── types.ts             # Effect type definitions
│   └── store.ts
└── export/                   # Video export pipeline
    ├── components/
    ├── workers/             # Encoder/Decoder workers
    ├── ffmpeg/              # FFmpeg.wasm wrapper
    └── store.ts

lib/                          # Shared utilities
├── supabase/                 # Supabase client and types
│   ├── client.ts
│   ├── server.ts
│   └── types.ts
├── ffmpeg/                   # FFmpeg.wasm initialization
├── pixi/                     # PIXI.js setup
└── utils/                    # Common utilities

types/                        # Global TypeScript definitions
├── effects.ts                # Effect interfaces (from omniclip)
├── media.ts                  # Media file types
├── project.ts                # Project types
└── supabase.ts               # Database types

stores/                       # Zustand store configuration
├── editor.ts                 # Main editor store
├── history.ts                # Undo/Redo history
└── index.ts                  # Store provider

public/                       # Static assets
└── workers/                  # Web Workers
    ├── encoder.worker.js
    └── decoder.worker.js

tests/                        # Test suites
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Web application structure with feature-based modularity. The `/features` directory mirrors omniclip's controller pattern, with each feature managing its own components, state, and logic. The `/app` directory uses Next.js 15 App Router for routing and layouts. Server Actions handle all Supabase operations, maintaining clean separation between client and server code.

## Phase 0 Tasks (Research)

### Technology Integration Research

1. **PIXI.js v8 with React 19**
   - Best practices for PIXI.js lifecycle in React components
   - Canvas mounting/unmounting strategies
   - Performance optimization techniques

2. **FFmpeg.wasm in Next.js 15**
   - Optimal loading strategies for WASM modules
   - Web Worker integration patterns
   - Memory management for large files

3. **WebCodecs API Support**
   - Browser compatibility matrix
   - Fallback strategies for unsupported browsers
   - Hardware acceleration detection

4. **Supabase Real-time with Zustand**
   - Sync patterns for collaborative features
   - Conflict resolution strategies
   - Optimistic updates implementation

5. **OPFS (Origin Private File System)**
   - Browser support and polyfills
   - Integration with Supabase Storage
   - Cache management strategies

## Phase 1 Design Deliverables

### Data Model (→ data-model.md)
- Projects table with settings JSONB
- Media files with deduplication via hash
- Effects polymorphic design
- Tracks with ordering
- Filters and animations as separate tables

### API Contracts (→ /contracts/)
- Authentication endpoints (Supabase Auth)
- Project CRUD operations
- Media upload/management
- Effect operations
- Export job management

### Quickstart Guide (→ quickstart.md)
- Development environment setup
- Supabase project configuration
- Local development workflow
- Testing procedures

## Complexity Tracking

*No violations - all requirements align with constitution principles*

## Risk Mitigation

1. **Browser Compatibility**: Progressive enhancement with feature detection
2. **Performance Degradation**: Implement quality levels for preview
3. **Storage Limits**: Clear cache management and user notifications
4. **Export Failures**: Chunked processing with resume capability
5. **Type Safety**: Strict TypeScript with generated Supabase types

## Success Metrics

- Initial page load < 3 seconds
- Time to first edit < 1 minute
- 60fps maintained with 10 video layers
- Export speed ≤ 2x project duration
- Zero data loss from auto-save

## Next Steps

1. Complete Phase 0 research tasks → research.md
2. Design data model and contracts → data-model.md, /contracts/
3. Create quickstart documentation → quickstart.md
4. Update agent context with project specifics
5. Proceed to task generation with `/speckit.tasks`