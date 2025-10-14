# ProEdit MVP - Quick Start Guide

**Last Updated**: 2025-10-14
**Version**: 1.0.0

## 🚀 Getting Started in 5 Minutes

Follow this guide to set up ProEdit MVP development environment and start editing videos in your browser.

## Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **npm** 9.x or later
- **Git** for version control
- **Supabase account** (free tier is sufficient for development)
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourorg/proedit.git
cd proedit

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2.2 Configure Database

Run the following SQL in the Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run migrations (see /supabase/migrations/)
-- These will be auto-applied if using Supabase CLI
```

### 2.3 Configure Storage

Create a storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-files', 'media-files', false);
```

### 2.4 Enable Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL: `http://localhost:3000/auth/callback`

## Step 3: Environment Configuration

Update `.env.local` with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=524288000  # 500MB in bytes
NEXT_PUBLIC_STORAGE_BUCKET=media-files

# Development Settings
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## Step 4: Database Migration

### Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate TypeScript types
npm run generate:types
```

### Manual Migration

Copy and run each migration file from `/supabase/migrations/` in order in the Supabase SQL editor.

## Step 5: Start Development Server

```bash
# Start the development server
npm run dev

# In a separate terminal, start the FFmpeg worker server (if needed)
npm run dev:workers
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Verify Installation

### Test Authentication
1. Click "Sign in with Google"
2. Authorize the application
3. You should be redirected to the dashboard

### Test Project Creation
1. Click "New Project"
2. Enter a project name
3. Project should appear with an empty timeline

### Test Media Upload
1. Open a project
2. Click "Upload Media" or drag files
3. Upload a small video file (< 10MB for testing)
4. File should appear in media library with thumbnail

### Test Timeline
1. Drag media from library to timeline
2. Click play button
3. Video should play at 60fps

## 🏗️ Project Structure

```
proedit/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (editor)/          # Main editor interface
│   └── actions/           # Server Actions
├── features/              # Feature modules
│   ├── timeline/          # Timeline functionality
│   ├── compositor/        # PIXI.js rendering
│   ├── media/             # Media management
│   ├── effects/           # Effect system
│   └── export/            # Export pipeline
├── lib/                   # Shared utilities
├── stores/                # Zustand stores
├── types/                 # TypeScript types
├── public/                # Static assets
└── tests/                 # Test suites
```

## 📝 Common Development Tasks

### Generate TypeScript Types from Database

```bash
npm run generate:types
```

### Run Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Lint and Format Code

```bash
# Run ESLint
npm run lint

# Format with Prettier
npm run format
```

## 🔧 Troubleshooting

### Issue: CORS errors with FFmpeg

**Solution**: Ensure FFmpeg CDN URLs are whitelisted in `next.config.js`:

```javascript
async headers() {
  return [{
    source: '/:path*',
    headers: [{
      key: 'Cross-Origin-Embedder-Policy',
      value: 'require-corp'
    }, {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin'
    }]
  }]
}
```

### Issue: WebCodecs not supported

**Solution**: The app will automatically fall back to FFmpeg.wasm for encoding. For optimal performance, use Chrome 94+ or Edge 94+.

### Issue: Upload fails with large files

**Solution**: Check Supabase Storage limits and increase if needed:

```sql
-- Check current storage usage
SELECT
  bucket_id,
  SUM(size) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

### Issue: 60fps not achieved during playback

**Solution**:
1. Enable hardware acceleration in browser settings
2. Reduce preview quality in project settings
3. Close other resource-intensive applications

### Issue: Export takes too long

**Solution**: Export uses client-side processing. Performance depends on:
- Device CPU/GPU capabilities
- Browser hardware acceleration
- Project complexity

Consider reducing export resolution for faster processing.

## 🎯 Development Workflow

### Feature Development

1. Create feature branch from `main`
2. Implement feature in `/features` directory
3. Add tests in `/tests`
4. Update types if needed
5. Run tests and linting
6. Create pull request

### State Management Pattern

```typescript
// Example Zustand store slice
// stores/timeline.ts
import { create } from 'zustand';

interface TimelineStore {
  effects: Effect[];
  selectedEffect: Effect | null;
  addEffect: (effect: Effect) => void;
  selectEffect: (id: string) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  effects: [],
  selectedEffect: null,

  addEffect: (effect) =>
    set((state) => ({
      effects: [...state.effects, effect]
    })),

  selectEffect: (id) =>
    set((state) => ({
      selectedEffect: state.effects.find(e => e.id === id) || null
    }))
}));
```

### Server Action Pattern

```typescript
// app/actions/projects.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function createProject(name: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

## 🚢 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📚 Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PIXI.js v8 Documentation](https://pixijs.com/docs)
- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- [WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)

## 🤝 Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discord Community**: Join for real-time help
- **Documentation**: Check `/docs` folder for detailed guides

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

**Happy Editing! 🎬**