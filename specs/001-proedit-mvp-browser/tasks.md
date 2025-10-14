# Tasks: ProEdit MVP - Browser-Based Video Editor

**Input**: Design documents from `/specs/001-proedit-mvp-browser/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/api.yaml, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **App Router**: `app/` for Next.js 15 pages and layouts
- **Features**: `features/` for modular feature code
- **Components**: `components/` for shared UI components
- **Server Actions**: `app/actions/` for Supabase operations

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure
**Estimated Duration**: 4 hours

- [X] T001 Initialize Next.js 15 project with TypeScript and App Router
- [X] T002 [P] Install and configure Tailwind CSS with custom design tokens
- [X] T003 [P] Initialize shadcn/ui with required components (Button, Card, Dialog, Sheet, Tabs, Select, ScrollArea, Toast)
- [X] T004 [P] Configure ESLint and Prettier with TypeScript rules
- [X] T005 [P] Set up environment variables structure (.env.local.example)
- [X] T006 Create project directory structure per plan.md architecture

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented
**Estimated Duration**: 8 hours

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Authentication Setup

- [X] T007 Set up Supabase project and configure connection in lib/supabase/client.ts
- [X] T008 Run database migrations for all tables (projects, media_files, tracks, effects) from data-model.md
- [X] T009 Configure Row Level Security policies for all tables per data-model.md
- [X] T010 Set up Supabase Storage bucket 'media-files' with policies
- [X] T011 Configure Google OAuth in Supabase Dashboard

### Core Libraries & State Management

- [X] T012 [P] Install and configure Zustand store structure in stores/index.ts
- [X] T013 [P] Set up PIXI.js v8 initialization helper in lib/pixi/setup.ts
- [X] T014 [P] Configure FFmpeg.wasm loader in lib/ffmpeg/loader.ts
- [X] T015 [P] Create Supabase client utilities (server.ts, client.ts) in lib/supabase/

### Type Definitions (from omniclip)

- [X] T016 [P] Copy and adapt Effect type definitions from omniclip to types/effects.ts
- [X] T017 [P] Create Project and Media types in types/project.ts and types/media.ts
- [X] T018 [P] Generate Supabase database types with CLI to types/supabase.ts

### Base UI Components

- [X] T019 [P] Create base layout structure in app/(auth)/layout.tsx and app/(editor)/layout.tsx
- [X] T020 [P] Set up error boundary and loading states in app/error.tsx and app/loading.tsx
- [X] T021 [P] Configure shadcn/ui theme and global styles in app/globals.css

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Video Project Creation (Priority: P1) 🎯 MVP

**Goal**: Users can sign in with Google and create projects
**Independent Test**: Sign in → Create project → See empty timeline
**Estimated Duration**: 6 hours
**omniclip References**:
- Auth flow: New implementation (Supabase)
- Project management: `/s/context/controllers/project/controller.ts`

### Implementation for User Story 1

- [X] T022 [P] [US1] Create login page with Google OAuth button in app/(auth)/login/page.tsx using shadcn/ui Button
- [X] T023 [P] [US1] Implement auth callback handler in app/auth/callback/route.ts
- [X] T024 [P] [US1] Create auth Server Actions in app/actions/auth.ts (signOut, getUser)
- [X] T025 [US1] Create dashboard page in app/(editor)/page.tsx with project list using shadcn/ui Card components
- [X] T026 [US1] Implement project Server Actions in app/actions/projects.ts (create, list, update, delete, get)
- [X] T027 [P] [US1] Create NewProjectDialog component using shadcn/ui Dialog in components/projects/NewProjectDialog.tsx
- [X] T028 [P] [US1] Create ProjectCard component using shadcn/ui Card in components/projects/ProjectCard.tsx
- [X] T029 [US1] Set up project store slice in stores/project.ts with Zustand
- [X] T030 [US1] Create empty timeline view in app/(editor)/[projectId]/page.tsx
- [X] T031 [P] [US1] Add loading skeleton using shadcn/ui Skeleton for editor layout in app/(editor)/loading.tsx
- [X] T032 [P] [US1] Implement error handling with toast notifications using shadcn/ui Sonner

**Checkpoint**: Users can sign in and create projects - MVP foundation complete

---

## Phase 4: User Story 2 - Media Upload and Timeline Placement (Priority: P1)

**Goal**: Users can upload media and add to timeline
**Independent Test**: Upload file → See in library → Add to timeline
**Estimated Duration**: 8 hours
**omniclip References**:
- Media controller: `/s/context/controllers/media/controller.ts`
- Timeline controller: `/s/context/controllers/timeline/controller.ts`

### Implementation for User Story 2

- [X] T033 [P] [US2] Create MediaLibrary component with shadcn/ui Sheet in features/media/components/MediaLibrary.tsx
- [X] T034 [P] [US2] Implement file upload with drag-drop using shadcn/ui Card in features/media/components/MediaUpload.tsx
- [X] T035 [US2] Create media Server Actions in app/actions/media.ts (upload, list, delete, getSignedUrl)
- [X] T036 [US2] Implement file hash deduplication logic in features/media/utils/hash.ts (port from omniclip)
- [X] T037 [P] [US2] Create MediaCard component with thumbnail in features/media/components/MediaCard.tsx
- [X] T038 [US2] Set up media store slice in stores/media.ts for local state
- [X] T039 [P] [US2] Create Timeline component structure in features/timeline/components/Timeline.tsx
- [X] T040 [P] [US2] Create TimelineTrack component in features/timeline/components/TimelineTrack.tsx
- [X] T041 [US2] Implement effect Server Actions in app/actions/effects.ts (create, update, delete)
- [X] T042 [US2] Port effect placement logic from omniclip in features/timeline/utils/placement.ts
- [X] T043 [P] [US2] Create EffectBlock component in features/timeline/components/EffectBlock.tsx
- [X] T044 [US2] Set up timeline store slice in stores/timeline.ts
- [X] T045 [P] [US2] Add upload progress indicator using shadcn/ui Progress
- [X] T046 [P] [US2] Implement media metadata extraction in features/media/utils/metadata.ts

**Checkpoint**: Users can upload media and place on timeline

---

## Phase 5: User Story 3 - Real-time Preview and Playback (Priority: P2)

**Goal**: Users can preview timeline content at 60fps
**Independent Test**: Add media → Click play → See smooth playback
**Estimated Duration**: 10 hours
**omniclip References**:
- Compositor: `/s/context/controllers/compositor/controller.ts`
- Video manager: `/s/context/controllers/compositor/parts/video-manager.ts`

### Implementation for User Story 3

- [X] T047 [US3] Create PIXI.js canvas wrapper in features/compositor/components/Canvas.tsx
- [X] T048 [US3] Port PIXI.js app initialization from omniclip in features/compositor/pixi/app.ts
- [X] T049 [P] [US3] Create PlaybackControls with shadcn/ui Button group in features/compositor/components/PlaybackControls.tsx
- [X] T050 [US3] Port VideoManager from omniclip in features/compositor/managers/VideoManager.ts
- [X] T051 [P] [US3] Port ImageManager from omniclip in features/compositor/managers/ImageManager.ts
- [X] T052 [US3] Implement playback loop with requestAnimationFrame in features/compositor/utils/playback.ts
- [X] T053 [US3] Set up compositor store slice in stores/compositor.ts
- [X] T054 [P] [US3] Create TimelineRuler component with seek functionality in features/timeline/components/TimelineRuler.tsx
- [X] T055 [P] [US3] Create PlayheadIndicator component in features/timeline/components/PlayheadIndicator.tsx
- [X] T056 [US3] Implement effect compositing logic in features/compositor/utils/compose.ts
- [X] T057 [P] [US3] Add FPS counter for performance monitoring in features/compositor/components/FPSCounter.tsx
- [X] T058 [US3] Connect timeline to compositor for synchronized playback

**Checkpoint**: Real-time preview working at 60fps

---

## Phase 6: User Story 4 - Basic Editing Operations (Priority: P2)

**Goal**: Users can trim, split, and move clips
**Independent Test**: Select clip → Trim edges → Split at playhead → Drag to new position
**Estimated Duration**: 8 hours
**omniclip References**:
- Effect trim: `/s/context/controllers/timeline/parts/drag-related/effect-trim.ts`
- Effect drag: `/s/context/controllers/timeline/parts/drag-related/effect-drag.ts`

### Implementation for User Story 4

- [X] T059 [US4] Port effect trim handler from omniclip in features/timeline/handlers/TrimHandler.ts
- [X] T060 [US4] Port effect drag handler from omniclip in features/timeline/handlers/DragHandler.ts
- [X] T061 [P] [US4] Create trim handles UI in features/timeline/components/TrimHandles.tsx
- [X] T062 [US4] Implement split effect logic in features/timeline/utils/split.ts
- [X] T063 [P] [US4] Create SplitButton with keyboard shortcut in features/timeline/components/SplitButton.tsx
- [X] T064 [US4] Port snap-to-grid logic from omniclip in features/timeline/utils/snap.ts
- [X] T065 [P] [US4] Create alignment guides renderer in features/timeline/components/AlignmentGuides.tsx
- [X] T066 [US4] Implement undo/redo with Zustand in stores/history.ts
- [X] T067 [P] [US4] Add keyboard shortcuts handler in features/timeline/hooks/useKeyboardShortcuts.ts
- [X] T068 [US4] Update effect positions in database via Server Actions
- [X] T069 [P] [US4] Create selection box for multiple effects in features/timeline/components/SelectionBox.tsx (✅ Completed 2025-10-15)

**Checkpoint**: Full editing capabilities available

---

## Phase 7: User Story 5 - Text Overlay Creation (Priority: P2)

**Goal**: Users can add and style text overlays
**Independent Test**: Add text → Edit content → Style → Position on canvas
**Estimated Duration**: 6 hours
**omniclip References**:
- Text manager: `/s/context/controllers/compositor/parts/text-manager.ts`

### Implementation for User Story 5

- [ ] T070 [P] [US5] Create TextEditor panel using shadcn/ui Sheet in features/effects/components/TextEditor.tsx
- [ ] T071 [P] [US5] Create font picker using shadcn/ui Select in features/effects/components/FontPicker.tsx
- [ ] T072 [P] [US5] Create color picker using shadcn/ui Popover in features/effects/components/ColorPicker.tsx
- [ ] T073 [US5] Port TextManager from omniclip in features/compositor/managers/TextManager.ts
- [ ] T074 [US5] Implement PIXI.Text creation in features/compositor/utils/text.ts
- [ ] T075 [P] [US5] Create text style controls panel in features/effects/components/TextStyleControls.tsx
- [ ] T076 [US5] Implement text effect CRUD in app/actions/effects.ts (extend for text)
- [ ] T077 [US5] Add text to timeline as special effect type
- [ ] T078 [P] [US5] Create text animation presets in features/effects/presets/text.ts
- [ ] T079 [US5] Connect text editor to canvas for real-time updates

**Checkpoint**: Text overlays fully functional

---

## Phase 8: User Story 6 - Video Export (Priority: P3)

**Goal**: Users can export edited video in multiple resolutions
**Independent Test**: Complete edit → Select quality → Export → Download MP4
**Estimated Duration**: 12 hours
**omniclip References**:
- Export controller: `/s/context/controllers/video-export/controller.ts`
- Encoder: `/s/context/controllers/video-export/parts/encoder.ts`
- FFmpeg helper: `/s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts`

### Implementation for User Story 6

- [X] T080 [P] [US6] Create ExportDialog using shadcn/ui Dialog in features/export/components/ExportDialog.tsx
- [X] T081 [P] [US6] Create quality selector using shadcn/ui RadioGroup in features/export/components/QualitySelector.tsx
- [X] T082 [US6] Port Encoder class from omniclip in features/export/workers/encoder.worker.ts
- [X] T083 [US6] Port Decoder class from omniclip in features/export/workers/decoder.worker.ts
- [X] T084 [US6] Port FFmpegHelper from omniclip in features/export/ffmpeg/FFmpegHelper.ts
- [X] T085 [US6] Implement export orchestration in features/export/utils/ExportController.ts
- [X] T086 [P] [US6] Create progress bar using shadcn/ui Progress in features/export/components/ExportProgress.tsx
- [X] T088 [US6] Implement WebCodecs feature detection in features/export/utils/codec.ts
- [X] T091 [US6] Implement audio mixing with FFmpeg.wasm (included in FFmpegHelper)
- [X] T092 [US6] Handle export completion and file download (features/export/utils/download.ts)
- [X] T093-UI [US6] Add renderFrameForExport API to Compositor for single frame capture (✅ Completed 2025-10-15)
- [X] T094-UI [US6] Create getMediaFileByHash helper in features/export/utils/getMediaFile.ts (✅ Completed 2025-10-15)
- [X] T095-UI [US6] Integrate Export button and ExportDialog into EditorClient with progress callbacks (✅ Completed 2025-10-15)

**Checkpoint**: Full export pipeline operational and integrated into UI

---

## Phase 9: User Story 7 - Auto-save and Recovery (Priority: P3)

**Goal**: Work is automatically saved and recoverable
**Independent Test**: Make edits → Wait 5 seconds → Refresh → Changes persist
**Estimated Duration**: 4 hours

### Implementation for User Story 7

- [ ] T093 [US7] Implement auto-save debounce logic in features/timeline/utils/autosave.ts
- [ ] T094 [US7] Create sync manager for Supabase Realtime in lib/supabase/sync.ts
- [ ] T095 [P] [US7] Add save indicator UI in components/SaveIndicator.tsx
- [ ] T096 [US7] Implement conflict detection for multi-tab editing
- [ ] T097 [P] [US7] Create recovery modal using shadcn/ui AlertDialog
- [ ] T098 [US7] Set up optimistic updates in Zustand stores
- [ ] T099 [US7] Add offline support detection
- [ ] T100 [P] [US7] Create session restoration on page load

**Checkpoint**: Auto-save and recovery complete

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and integration
**Estimated Duration**: 4 hours

- [ ] T101 [P] Add loading states throughout application using shadcn/ui Skeleton
- [ ] T102 [P] Implement comprehensive error handling with shadcn/ui Toast
- [ ] T103 [P] Add tooltips to all controls using shadcn/ui Tooltip
- [ ] T104 Performance optimization - lazy loading and code splitting
- [ ] T105 [P] Add keyboard shortcut help dialog using shadcn/ui Dialog
- [ ] T106 [P] Create onboarding tour for first-time users
- [ ] T107 Security audit - validate all user inputs
- [ ] T108 [P] Add analytics tracking for key user actions
- [ ] T109 Browser compatibility testing and polyfills
- [ ] T110 Final build optimization and deployment configuration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 & US2 (P1): Can proceed in parallel after Foundational
  - US3, US4, US5 (P2): Depend on US1 & US2 being mostly complete
  - US6 & US7 (P3): Can start after US3 is functional
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation for all other features
- **User Story 2 (P1)**: Required for US3, US4, US5
- **User Story 3 (P2)**: Required for US4 (preview while editing) and US6 (export preview)
- **User Story 4 (P2)**: Enhanced by US3 but can function independently
- **User Story 5 (P2)**: Independent after US2 complete
- **User Story 6 (P3)**: Requires US3 for frame capture
- **User Story 7 (P3)**: Can run parallel to other P3 stories

### Critical Path for MVP

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) = **Basic MVP**
2. Add Phase 5 (US3) for preview = **Functional MVP**
3. Add Phase 6 (US4) for editing = **Complete MVP**

---

## Parallel Execution Examples

### Phase 2 Foundational - Maximum Parallelization
```bash
# Launch all type definitions together:
Task T016: "Copy Effect types from omniclip"
Task T017: "Create Project and Media types"
Task T018: "Generate Supabase types"

# Launch all library setups together:
Task T012: "Configure Zustand"
Task T013: "Set up PIXI.js"
Task T014: "Configure FFmpeg.wasm"
```

### User Story 1 - Parallel UI Components
```bash
# Launch all UI components together:
Task T022: "Create login page"
Task T023: "Create callback page"
Task T027: "Create NewProjectDialog"
Task T028: "Create ProjectCard"
```

### User Story 2 - Parallel Media Components
```bash
# Launch media components together:
Task T033: "Create MediaLibrary"
Task T034: "Create MediaUpload"
Task T037: "Create MediaCard"
```

---

## Implementation Strategy

### MVP First (Phase 1-4 Only)

1. Complete Phase 1: Setup (4 hours)
2. Complete Phase 2: Foundational (8 hours) - CRITICAL BLOCKING PHASE
3. Complete Phase 3: User Story 1 - Authentication & Projects (6 hours)
4. Complete Phase 4: User Story 2 - Media Upload (8 hours)
5. **STOP and VALIDATE**: Test core functionality (Total: ~26 hours)
6. Deploy/demo MVP if ready

### Incremental Delivery

After MVP validation:
1. Add Phase 5: Preview (10 hours) → Functional editor
2. Add Phase 6: Editing (8 hours) → Professional editor
3. Add Phase 7: Text (6 hours) → Creative tools
4. Add Phase 8: Export (12 hours) → Complete product
5. Add Phase 9: Auto-save (4 hours) → Production ready

### Team Parallelization Strategy

With 3 developers after Phase 2:
- **Developer A**: US1 (Auth/Projects) → US3 (Preview)
- **Developer B**: US2 (Media/Timeline) → US4 (Editing)
- **Developer C**: UI Polish → US5 (Text) → US6 (Export)

---

## shadcn/ui Components Usage Map

| Component   | Used In                    | Purpose                          |
|-------------|----------------------------|----------------------------------|
| Button      | Throughout                 | All interactive actions          |
| Card        | Dashboard, Media           | Container for projects and media |
| Dialog      | New Project, Export        | Modal workflows                  |
| Sheet       | Media Library, Text Editor | Sliding panels                   |
| Tabs        | Project Settings           | Organized settings               |
| Select      | Font Picker, Quality       | Dropdowns                        |
| ScrollArea  | Timeline, Media Library    | Scrollable containers            |
| Toast       | Errors, Success            | Notifications                    |
| Progress    | Upload, Export             | Progress indicators              |
| Skeleton    | Loading States             | Loading placeholders             |
| Popover     | Color Picker               | Floating panels                  |
| Tooltip     | All Controls               | Help text                        |
| AlertDialog | Recovery                   | Confirmations                    |
| RadioGroup  | Export Quality             | Option selection                 |

---

## omniclip Reference Map

| Feature            | omniclip Location                      | ProEdit Location           |
|--------------------|----------------------------------------|----------------------------|
| Effect Types       | `/s/context/types.ts`                  | `/types/effects.ts`        |
| Timeline Logic     | `/s/context/controllers/timeline/`     | `/features/timeline/`      |
| Compositor         | `/s/context/controllers/compositor/`   | `/features/compositor/`    |
| Media Management   | `/s/context/controllers/media/`        | `/features/media/`         |
| Export Pipeline    | `/s/context/controllers/video-export/` | `/features/export/`        |
| Project Management | `/s/context/controllers/project/`      | `/app/actions/projects.ts` |
| State Management   | `@benev/slate`                         | Zustand stores             |
| UI Components      | Lit Elements                           | shadcn/ui + React          |

---

## Estimated Timeline

### Phase 1 MVP (US1 + US2)
- **Setup & Foundation**: 12 hours
- **User Stories 1-2**: 14 hours
- **Total**: ~26 hours (3-4 days)

### Full Featured Release (All Stories)
- **All Phases**: ~66 hours
- **With testing/debugging**: ~80 hours
- **Timeline**: 2 weeks with 1 developer, 1 week with 2-3 developers

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story phase should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- shadcn/ui provides accessible, styled components out of the box
- omniclip code can be directly ported for most video processing logic