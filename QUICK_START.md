# 🚀 ProEdit MVP - Quick Start Guide

**Version**: 1.0.0
**Status**: ✅ MVP Complete - Ready for Release
**Setup Time**: ~10 minutes

---

## ⚡ For End Users

### Instant Start

1. Visit the ProEdit application URL
2. Click "**Sign in with Google**"
3. Authorize access
4. Click "**+ New Project**"
5. Start editing!

That's it! No installation required. 🎉

For detailed usage instructions, see [USER_GUIDE.md](./USER_GUIDE.md)

---

## 🛠️ For Developers

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 20 LTS or higher
- **npm** (comes with Node.js)
- **Supabase account** (free tier works)
- **Git** (for cloning repository)
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd proedit
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected time**: 2-3 minutes

### Step 3: Environment Variables

```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local with your credentials
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these**:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to Settings > API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Database Setup

ProEdit requires database tables and storage buckets.

#### Option A: Automated Setup (Recommended)

```bash
# See detailed instructions
cat supabase/SETUP_INSTRUCTIONS.md
```

#### Option B: Manual Setup

1. **Run Migrations**:
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_row_level_security.sql`

2. **Create Storage Bucket**:
   - Go to Storage
   - Create bucket named `media-files`
   - Set as Public
   - Configure policies (see SETUP_INSTRUCTIONS.md)

3. **Configure OAuth**:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Expected**: Login page appears

### Step 6: Verify Installation

Run these checks:

```bash
# TypeScript check (should show 0 errors)
npx tsc --noEmit

# Build check (should succeed)
npm run build

# PIXI.js version check (should be 7.4.2)
npm list pixi.js
```

**All checks passed?** ✅ You're ready to develop!

---

## 📋 Common Development Tasks

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Building for Production

```bash
# Production build
npm run build

# Start production server
npm start
```

### Debugging

```bash
# Development with more logging
NODE_ENV=development npm run dev

# Check browser console for errors
# Open DevTools (F12) → Console tab
```

---

## 🗂️ Project Structure Overview

```
proedit/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Login, callback pages
│   ├── actions/           # Server Actions (Supabase CRUD)
│   └── editor/            # Main editor UI
│
├── features/              # Feature modules (modular architecture)
│   ├── compositor/        # PIXI.js rendering engine
│   │   ├── components/   # Canvas, PlaybackControls, FPSCounter
│   │   ├── managers/     # TextManager, VideoManager, etc.
│   │   └── utils/        # Compositor class
│   ├── timeline/          # Timeline editing
│   │   ├── components/   # Timeline, Track, Clip, Ruler
│   │   ├── handlers/     # DragHandler, TrimHandler
│   │   └── utils/        # Placement, snap, split logic
│   ├── media/             # Media library
│   │   ├── components/   # MediaLibrary, MediaUpload, MediaCard
│   │   └── utils/        # Hash, metadata extraction
│   ├── effects/           # Effects (Text overlays)
│   │   └── components/   # TextEditor, FontPicker, ColorPicker
│   └── export/            # Video export pipeline
│       ├── workers/      # Encoder, Decoder workers
│       ├── ffmpeg/       # FFmpegHelper
│       └── utils/        # ExportController
│
├── components/            # Shared UI (shadcn/ui)
│   ├── ui/               # Button, Card, Dialog, etc.
│   └── SaveIndicator, RecoveryModal, etc.
│
├── stores/                # Zustand state management
│   ├── timeline.ts       # Timeline state + AutoSave integration
│   ├── compositor.ts     # Playback state
│   ├── media.ts          # Media library state
│   └── history.ts        # Undo/Redo
│
├── lib/                   # Shared utilities
│   ├── supabase/         # Supabase client (browser/server)
│   ├── ffmpeg/           # FFmpeg.wasm loader
│   └── pixi/             # PIXI.js initialization
│
├── types/                 # TypeScript types
│   ├── effects.ts        # Effect types (from omniclip)
│   ├── project.ts        # Project types
│   ├── media.ts          # Media types
│   └── supabase.ts       # Generated DB types
│
└── supabase/              # Database
    ├── migrations/       # SQL migration files
    └── SETUP_INSTRUCTIONS.md
```

---

## 🎯 Key Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| Next.js | Framework | 15.x |
| React | UI Library | 19.x |
| TypeScript | Language | 5.3+ |
| Supabase | Backend (Auth, DB, Storage) | Latest |
| PIXI.js | WebGL Rendering | 7.4.2 |
| FFmpeg.wasm | Video Encoding | Latest |
| Zustand | State Management | Latest |
| shadcn/ui | UI Components | Latest |
| Tailwind CSS | Styling | Latest |

---

## 🐛 Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Check for errors
npx tsc --noEmit

# Common fix: Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### PIXI.js version mismatch

```bash
# Check version
npm list pixi.js

# Should be 7.4.2
# If not:
npm install pixi.js@7.4.2
```

### Supabase connection errors

1. Check `.env.local` has correct values
2. Verify Supabase project is active
3. Check RLS policies are set up
4. Try creating new Supabase project

### Build fails

```bash
# Clean build
rm -rf .next
npm run build
```

### Port 3000 already in use

```bash
# Use different port
PORT=3001 npm run dev
```

---

## 📚 Next Steps

### For Users

1. Read [USER_GUIDE.md](./USER_GUIDE.md) - Complete user documentation
2. Watch tutorial videos (if available)
3. Start creating your first video!

### For Developers

1. Read [README.md](./README.md) - Project overview
2. Check [docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) - Development workflow
3. Review [specs/001-proedit-mvp-browser/](./specs/001-proedit-mvp-browser/) - Specifications
4. Explore feature modules in `features/` directory

### Contributing

See [README.md](./README.md) Contributing section for guidelines.

---

## 🆘 Getting Help

### Documentation

- **User Guide**: [USER_GUIDE.md](./USER_GUIDE.md)
- **README**: [README.md](./README.md)
- **Development Docs**: `docs/` directory
- **API Docs**: `specs/` directory

### Support

1. Check documentation above
2. Search existing GitHub issues
3. Ask in community forums (if available)
4. Open new GitHub issue

---

## ✅ Checklist

Before starting development, ensure:

- [ ] Node.js 20+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured with Supabase credentials
- [ ] Database migrations run
- [ ] Storage bucket created
- [ ] Google OAuth configured
- [ ] Dev server starts without errors
- [ ] TypeScript check passes (0 errors)
- [ ] Can access app at http://localhost:3000
- [ ] Can sign in with Google
- [ ] Can create a project

**All checked?** You're ready to go! 🚀

---

## 📞 Quick Reference

### Essential Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
npx tsc --noEmit     # Type check
```

### Essential Files

```bash
.env.local                    # Environment variables
app/editor/[projectId]/EditorClient.tsx  # Main editor
features/compositor/utils/Compositor.ts  # Rendering engine
stores/timeline.ts            # Timeline state
supabase/migrations/          # Database schema
```

### Essential URLs

- **Supabase Dashboard**: https://app.supabase.com
- **Next.js Docs**: https://nextjs.org/docs
- **PIXI.js v7 Docs**: https://v7.pixijs.download/release/docs/
- **shadcn/ui**: https://ui.shadcn.com/

---

**Last Updated**: 2025-10-15
**Version**: 1.0.0
**Status**: MVP Complete ✅

Happy coding! 🎬

