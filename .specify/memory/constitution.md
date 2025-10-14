<!-- Sync Impact Report
Version change: New → 1.0.0
Modified principles: Initial creation
Added sections: All sections newly created
Removed sections: N/A
Templates requiring updates: ✅ All templates will be checked
Follow-up TODOs: None
-->

# ProEdit Constitution

## Core Principles

### I. Proven Implementation Reuse

**Leverage omniclip's battle-tested implementations (FFmpeg, WebCodecs, PIXI.js) to the maximum extent.**

- Adopt omniclip's proven processing logic for FFmpeg operations, WebCodecs integration, and PIXI.js rendering
- Incrementally port working code with optimization only where necessary
- Maintain strict TypeScript type definitions following omniclip's Effect type system
- Avoid reinventing the wheel - build upon validated solutions

**Rationale**: Omniclip has demonstrated these technologies work reliably in production. By reusing proven patterns, we reduce risk and accelerate development while maintaining code quality.

### II. Browser-First Performance

**Client-side high-speed processing MUST be the top priority.**

- WebCodecs API, WebAssembly, and Web Workers MUST be utilized for parallel processing
- GPU acceleration through PIXI.js (WebGL) is mandatory for all visual rendering
- Origin Private File System (OPFS) MUST be used for large file handling
- Memory-efficient streaming processing MUST be implemented
- Responsive design MUST accommodate mobile devices

**Rationale**: Modern browsers provide powerful APIs that enable near-native performance. By maximizing client-side capabilities, we reduce server costs and provide instant feedback to users.

### III. Modern Stack Integration

**Fully utilize Next.js 15 App Router and Supabase's latest features.**

- Frontend: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS (NO exceptions)
- UI Components: shadcn/ui (Radix UI-based, accessible components)
- Backend: Supabase (Auth, Database, Storage, Realtime) as the sole backend provider
- State Management: Zustand (lightweight, compatible with omniclip's State pattern)
- Video Processing: FFmpeg.wasm + WebCodecs API
- Rendering Engine: PIXI.js v8 exclusively
- Server Actions MUST be used for all Supabase communications

**Rationale**: This technology stack provides the optimal balance of developer experience, performance, and scalability while maintaining consistency with proven patterns.

### IV. Usability First

**Adobe Premiere Pro-level intuitive operation is mandatory.**

- Drag-and-drop interactions MUST be implemented for all applicable features
- Complete keyboard shortcuts (Ctrl+Z/Y, etc.) MUST be available
- Real-time preview is mandatory for all editing operations
- Progress indicators and error handling MUST be comprehensive
- Accessibility MUST meet WCAG 2.1 AA standards (ARIA attributes, keyboard navigation)

**Rationale**: Professional video editors expect a certain level of polish and responsiveness. Meeting these expectations is critical for user adoption and retention.

### V. Scalable Architecture

**Design for extensibility beyond MVP.**

- Features MUST be modularly separated in /features directory structure
- Effect system MUST support plugin-style additions of new effects
- API design MUST be RESTful with GraphQL-ready structure
- Timeline, preview, and effects panels MUST operate as independent micro-frontends
- Each module MUST be independently testable and deployable

**Rationale**: MVP is just the beginning. The architecture must support rapid feature addition and scaling without requiring major refactoring.

## Technical Standards

### Architecture Requirements

**Follow omniclip's State-Actions-Controllers-Views pattern strictly.**

Directory structure MUST adhere to:

```
/app                    # Next.js App Router
  /(auth)              # Authentication pages
  /(editor)            # Main editor pages
  /api                 # API Routes
/features              # Feature modules
  /timeline            # Timeline functionality
  /compositor          # Rendering and composition
  /effects             # Effect management
  /export              # Video export
  /media               # Media file management
/lib                   # Shared utilities
  /supabase           # Supabase client
  /ffmpeg             # FFmpeg wrapper
  /pixi               # PIXI.js initialization
/types                 # TypeScript definitions
```

### Security Standards

- Supabase Row Level Security (RLS) MUST be implemented for ALL database tables
- File uploads MUST use signed URLs exclusively
- Environment variables MUST be properly managed (.env.local, never committed to Git)
- XSS prevention MUST use DOMPurify for all user-generated content
- TypeScript strict mode is mandatory with zero any types allowed (use unknown instead)

## Development Workflow

### MVP Development Phases (6 weeks total)

**Phase 1: Core Features (Weeks 1-2)**
- Supabase authentication (Google OAuth)
- Project creation and persistence
- Media file upload (video/image)
- Basic timeline (track display, effect placement)
- Simple preview (PIXI.js integration)

**Phase 2: Editing Features (Weeks 3-4)**
- Trimming and splitting
- Text effect addition
- Drag-and-drop positioning
- Undo/Redo functionality
- Basic video export (720p)

**Phase 3: Extended Features (Weeks 5-6)**
- Transitions implementation
- Filters and effects
- Multi-resolution support (including 4K)
- Project sharing functionality

### Code Quality Standards

- ESLint + Prettier configuration MUST be enforced
- TypeScript strict mode is mandatory
- Functions MUST follow single responsibility principle
- Components SHOULD be under 100 lines (split if larger)
- State logic MUST be extracted to custom hooks
- Test coverage MUST exceed 70%
- Unit tests: Vitest framework
- E2E tests: Playwright for critical paths
- Priority test areas: FFmpeg processing, effect calculations, Supabase RLS

## Non-Negotiables

The following requirements are absolute and cannot be compromised:

1. **Performance**: 60fps MUST be maintained during playback, 4K video export MUST be supported
2. **Security**: RLS MUST be fully implemented, file access control MUST be enforced
3. **Type Safety**: `any` type is forbidden (use `unknown` when necessary)
4. **Accessibility**: WCAG 2.1 AA compliance is mandatory
5. **Responsiveness**: MUST support screens 1024px and wider

### Prohibited Practices

- Global state abuse
- Inline styles (use Tailwind CSS exclusively)
- Unnecessary external library additions
- Hardcoded URLs or credentials
- Merging PRs without tests

## Governance

### Amendment Process

- Constitution supersedes all other project practices
- Amendments require:
  1. Written documentation of proposed changes
  2. Technical justification with evidence
  3. Migration plan for existing code
  4. Version bump according to semantic versioning

### Version Policy

- MAJOR: Removal or redefinition of core principles
- MINOR: Addition of new principles or significant section expansions
- PATCH: Clarifications, wording improvements, typo fixes

### Compliance Review

- All pull requests MUST verify constitutional compliance
- Technical decisions MUST prioritize omniclip's proven implementations
- Feature additions beyond MVP scope require constitutional review
- Performance degradation exceptions require documented proof
- Security vulnerabilities override all other considerations

**Version**: 1.1.0 | **Ratified**: 2025-10-14 | **Last Amended**: 2025-10-14
