# ProEdit MVP - Phase 2 実装引き継ぎドキュメント

> **作成日**: 2025-10-14 (更新版)  
> **目的**: Phase 2 Foundation の完全実装  
> **前提**: Phase 1 は70%完了、Phase 2に進む準備が整っている

---

## 🎯 現在の状況サマリー

### Phase 1 完了状況：70%

**✅ 完了している項目**
- Next.js 15 + React 19 プロジェクト初期化
- Tailwind CSS v4 設定完了
- shadcn/ui 初期化（27コンポーネント追加済み）
- .env.local 設定（Supabase認証情報）
- .env.local.example 作成
- Prettier 設定（.prettierrc.json, .prettierignore）
- next.config.ts に FFmpeg.wasm CORS設定
- ディレクトリ構造作成（features/, lib/, stores/, types/, tests/）

**⚠️ 未完了の項目（Phase 2で実装）**
- lib/supabase/ 内のファイル（client.ts, server.ts）
- lib/ffmpeg/ 内のファイル（loader.ts）
- lib/pixi/ 内のファイル（setup.ts）
- stores/ 内のファイル（index.ts）
- types/ 内のファイル（effects.ts, project.ts, media.ts, supabase.ts）
- レイアウトファイル（app/(auth)/layout.tsx, app/(editor)/layout.tsx）
- エラーハンドリング（app/error.tsx, app/loading.tsx）
- Adobe Premiere Pro風テーマ適用

---

## 📂 現在のプロジェクト構造

```
/Users/teradakousuke/Developer/ProEdit/
├── .env.local                    ✅ 設定済み
├── .env.local.example            ✅ 作成済み
├── .prettierrc.json              ✅ 設定済み
├── .prettierignore               ✅ 作成済み
├── next.config.ts                ✅ CORS設定済み
├── package.json                  ✅ 依存関係インストール済み
│
├── app/
│   ├── page.tsx                  ⚠️ デフォルトNext.jsページ（後で置き換え）
│   ├── globals.css               ⚠️ Premiere Pro風テーマ未適用
│   ├── (auth)/                   ❌ 未作成
│   │   └── layout.tsx            ❌ T019で作成
│   └── (editor)/                 ❌ 未作成
│       └── layout.tsx            ❌ T019で作成
│
├── components/
│   ├── ui/                       ✅ 27コンポーネント
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   └── projects/                 ✅ 存在（空）
│
├── features/                     ✅ ディレクトリ存在（空）
│   ├── timeline/
│   ├── compositor/
│   ├── media/
│   ├── effects/
│   └── export/
│
├── lib/                          ✅ ディレクトリ存在（空）
│   ├── supabase/                 ❌ client.ts, server.ts未作成
│   ├── ffmpeg/                   ❌ loader.ts未作成
│   ├── pixi/                     ❌ setup.ts未作成
│   └── utils/                    ✅ 存在
│       └── utils.ts              ✅ 存在
│
├── stores/                       ✅ ディレクトリ存在（空）
│   └── index.ts                  ❌ T012で作成
│
├── types/                        ✅ ディレクトリ存在（空）
│   ├── effects.ts                ❌ T016で作成
│   ├── project.ts                ❌ T017で作成
│   ├── media.ts                  ❌ T017で作成
│   └── supabase.ts               ❌ T018で作成
│
├── tests/                        ✅ ディレクトリ存在
│   ├── e2e/
│   ├── integration/
│   └── unit/
│
├── specs/                        ✅ 全設計ドキュメント
│   └── 001-proedit-mvp-browser/
│       ├── spec.md
│       ├── plan.md
│       ├── data-model.md         ⚠️ T008で使用
│       ├── tasks.md              ⚠️ タスク詳細
│       └── quickstart.md         ⚠️ T007,T011で使用
│
└── vendor/omniclip/              ✅ 参照実装
    └── OMNICLIP_IMPLEMENTATION_ANALYSIS.md
```

---

## 🚀 Phase 2: Foundation 実装タスク（T007-T021）

### 【重要】Phase 2の目的
Phase 2は全ユーザーストーリー（US1-US7）実装の**必須基盤**です。
このフェーズが完了するまで、認証、タイムライン、エフェクト、エクスポートなどの機能実装は開始できません。

### 推定所要時間：8時間

---

## 📋 実装タスク詳細

### T007: Supabaseクライアント設定

**ファイル**: `lib/supabase/client.ts`, `lib/supabase/server.ts`

**client.ts（ブラウザ用）**:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**server.ts（サーバー用）**:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component内では無視
          }
        },
      },
    }
  )
}
```

**必要な依存関係**:
```bash
npm install --legacy-peer-deps @supabase/ssr @supabase/supabase-js
```

**参照**: `specs/001-proedit-mvp-browser/quickstart.md`

---

### T008: データベースマイグレーション

**実装場所**: Supabase SQL Editor または ローカルマイグレーション

**手順**:
1. Supabase ダッシュボードにアクセス
2. SQL Editor を開く
3. `specs/001-proedit-mvp-browser/data-model.md` のスキーマを実行

**テーブル一覧**:
```sql
-- 1. projects テーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. media_files テーブル
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  duration NUMERIC,
  width INTEGER,
  height INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. tracks テーブル
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  track_type TEXT NOT NULL CHECK (track_type IN ('video', 'audio')),
  track_order INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. clips テーブル
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks ON DELETE CASCADE,
  media_file_id UUID REFERENCES media_files ON DELETE CASCADE,
  start_time NUMERIC NOT NULL,
  duration NUMERIC NOT NULL,
  trim_start NUMERIC DEFAULT 0,
  trim_end NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. effects テーブル
CREATE TABLE effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES clips ON DELETE CASCADE,
  effect_type TEXT NOT NULL,
  effect_data JSONB NOT NULL,
  effect_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. transitions テーブル
CREATE TABLE transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks ON DELETE CASCADE,
  transition_type TEXT NOT NULL,
  start_clip_id UUID REFERENCES clips,
  end_clip_id UUID REFERENCES clips,
  duration NUMERIC NOT NULL,
  transition_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. export_jobs テーブル
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress NUMERIC DEFAULT 0,
  export_settings JSONB NOT NULL,
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_media_files_project_id ON media_files(project_id);
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_tracks_project_id ON tracks(project_id);
CREATE INDEX idx_clips_track_id ON clips(track_id);
CREATE INDEX idx_effects_clip_id ON effects(clip_id);
CREATE INDEX idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
```

**確認方法**:
```sql
-- テーブル一覧表示
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

### T009: Row Level Security (RLS) ポリシー設定

**実装場所**: Supabase SQL Editor

**RLSポリシー**:
```sql
-- 1. projects テーブルのRLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- 2. media_files テーブルのRLS
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media files"
  ON media_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own media files"
  ON media_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media files"
  ON media_files FOR DELETE
  USING (auth.uid() = user_id);

-- 3. tracks テーブルのRLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tracks in own projects"
  ON tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tracks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 4. clips テーブルのRLS
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage clips in own tracks"
  ON clips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tracks
      JOIN projects ON projects.id = tracks.project_id
      WHERE tracks.id = clips.track_id
      AND projects.user_id = auth.uid()
    )
  );

-- 5. effects テーブルのRLS
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage effects in own clips"
  ON effects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clips
      JOIN tracks ON tracks.id = clips.track_id
      JOIN projects ON projects.id = tracks.project_id
      WHERE clips.id = effects.clip_id
      AND projects.user_id = auth.uid()
    )
  );

-- 6. transitions テーブルのRLS
ALTER TABLE transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage transitions in own tracks"
  ON transitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tracks
      JOIN projects ON projects.id = tracks.project_id
      WHERE tracks.id = transitions.track_id
      AND projects.user_id = auth.uid()
    )
  );

-- 7. export_jobs テーブルのRLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export jobs"
  ON export_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export jobs"
  ON export_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own export jobs"
  ON export_jobs FOR UPDATE
  USING (auth.uid() = user_id);
```

**確認方法**:
```sql
-- RLS有効化確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

### T010: Supabase Storage設定

**実装方法**: Supabaseダッシュボード > Storage

**手順**:
1. Storage > "Create a new bucket" をクリック
2. 設定:
   - **Bucket name**: `media-files`
   - **Public bucket**: OFF（認証必須）
   - **File size limit**: 500 MB
   - **Allowed MIME types**: `video/*, audio/*, image/*`

**ストレージポリシー（SQL Editor）**:
```sql
-- media-filesバケットのポリシー設定
CREATE POLICY "Users can upload own media files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own media files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own media files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**ファイルパス構造**:
```
media-files/
  {user_id}/
    {project_id}/
      {file_name}
```

---

### T011: Google OAuth設定

**実装方法**: Supabaseダッシュボード > Authentication

**手順**:
1. Authentication > Providers > Google を有効化
2. Google Cloud Consoleで OAuth 2.0 クライアントIDを作成
3. 承認済みリダイレクトURIに追加:
   ```
   https://blvcuxxwiykgcbsduhbc.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
4. Client IDとClient SecretをSupabaseに設定

**Next.jsコールバックルート作成**:
```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${requestUrl.origin}/editor`)
}
```

**参照**: `specs/001-proedit-mvp-browser/quickstart.md` の認証設定セクション

---

### T012: Zustand store構造

**ファイル**: `stores/index.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Project Store Slice
interface ProjectState {
  currentProjectId: string | null
  projects: any[]
  setCurrentProject: (id: string | null) => void
  addProject: (project: any) => void
}

// Timeline Store Slice
interface TimelineState {
  currentTime: number
  duration: number
  isPlaying: boolean
  zoom: number
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
}

// Media Store Slice
interface MediaState {
  mediaFiles: any[]
  selectedMedia: string[]
  addMediaFile: (file: any) => void
  selectMedia: (id: string) => void
}

// Compositor Store Slice
interface CompositorState {
  canvas: any | null
  setCanvas: (canvas: any) => void
}

// Combined Store
interface AppStore extends ProjectState, TimelineState, MediaState, CompositorState {}

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // Project state
        currentProjectId: null,
        projects: [],
        setCurrentProject: (id) => set({ currentProjectId: id }),
        addProject: (project) => set((state) => ({ 
          projects: [...state.projects, project] 
        })),

        // Timeline state
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        zoom: 1,
        setCurrentTime: (time) => set({ currentTime: time }),
        setIsPlaying: (playing) => set({ isPlaying: playing }),

        // Media state
        mediaFiles: [],
        selectedMedia: [],
        addMediaFile: (file) => set((state) => ({ 
          mediaFiles: [...state.mediaFiles, file] 
        })),
        selectMedia: (id) => set((state) => ({
          selectedMedia: state.selectedMedia.includes(id)
            ? state.selectedMedia.filter((mediaId) => mediaId !== id)
            : [...state.selectedMedia, id]
        })),

        // Compositor state
        canvas: null,
        setCanvas: (canvas) => set({ canvas }),
      }),
      {
        name: 'proedit-storage',
        partialize: (state) => ({
          currentProjectId: state.currentProjectId,
          zoom: state.zoom,
        }),
      }
    )
  )
)
```

**必要な依存関係**:
```bash
npm install --legacy-peer-deps zustand
```

---

### T013: PIXI.js v8初期化

**ファイル**: `lib/pixi/setup.ts`

```typescript
import * as PIXI from 'pixi.js'

export interface CompositorConfig {
  width: number
  height: number
  backgroundColor?: number
}

export async function initializePixi(
  canvas: HTMLCanvasElement,
  config: CompositorConfig
): Promise<PIXI.Application> {
  const app = new PIXI.Application()

  await app.init({
    canvas,
    width: config.width,
    height: config.height,
    backgroundColor: config.backgroundColor || 0x000000,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  })

  // WebGL対応確認
  if (!app.renderer) {
    throw new Error('WebGL is not supported in this browser')
  }

  return app
}

export function cleanupPixi(app: PIXI.Application) {
  app.destroy(true, {
    children: true,
    texture: true,
    textureSource: true,
  })
}
```

**必要な依存関係**:
```bash
npm install --legacy-peer-deps pixi.js
```

**参照**: `vendor/omniclip/s/context/controllers/compositor/`

---

### T014: FFmpeg.wasmローダー

**ファイル**: `lib/ffmpeg/loader.ts`

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null

export interface FFmpegProgress {
  ratio: number
  time: number
}

export async function loadFFmpeg(
  onProgress?: (progress: FFmpegProgress) => void
): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance
  }

  const ffmpeg = new FFmpeg()

  // プログレスハンドラー
  if (onProgress) {
    ffmpeg.on('progress', ({ progress, time }) => {
      onProgress({ ratio: progress, time })
    })
  }

  // ログハンドラー（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message)
    })
  }

  // FFmpeg.wasm読み込み
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  ffmpegInstance = ffmpeg
  return ffmpeg
}

export function getFFmpegInstance(): FFmpeg | null {
  return ffmpegInstance
}

export async function unloadFFmpeg(): Promise<void> {
  if (ffmpegInstance) {
    ffmpegInstance.terminate()
    ffmpegInstance = null
  }
}
```

**必要な依存関係**:
```bash
npm install --legacy-peer-deps @ffmpeg/ffmpeg @ffmpeg/util
```

**参照**: `OMNICLIP_IMPLEMENTATION_ANALYSIS.md` のFFmpeg実装セクション

---

### T015: Supabaseユーティリティ

**ファイル**: `lib/supabase/utils.ts`

```typescript
import { createClient } from './client'
import type { Database } from '@/types/supabase'

export async function uploadMediaFile(
  file: File,
  userId: string,
  projectId: string
): Promise<string> {
  const supabase = createClient()
  
  const fileName = `${Date.now()}-${file.name}`
  const filePath = `${userId}/${projectId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('media-files')
    .upload(filePath, file)

  if (error) throw error

  return data.path
}

export async function getMediaFileUrl(path: string): Promise<string> {
  const supabase = createClient()
  
  const { data } = supabase.storage
    .from('media-files')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteMediaFile(path: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from('media-files')
    .remove([path])

  if (error) throw error
}
```

---

### T016: Effect型定義

**ファイル**: `types/effects.ts`

**参照元**: `vendor/omniclip/s/context/types.ts`

```typescript
// ベースエフェクト型
export interface BaseEffect {
  id: string
  type: string
  enabled: boolean
  order: number
}

// ビデオエフェクト
export interface VideoEffect extends BaseEffect {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sharpen'
  parameters: {
    intensity: number // 0-100
  }
}

// オーディオエフェクト
export interface AudioEffect extends BaseEffect {
  type: 'volume' | 'fade' | 'equalizer'
  parameters: {
    gain?: number // dB
    fadeIn?: number // seconds
    fadeOut?: number // seconds
    bands?: number[] // EQバンド
  }
}

// テキストエフェクト
export interface TextEffect extends BaseEffect {
  type: 'text-overlay'
  parameters: {
    text: string
    fontSize: number
    fontFamily: string
    color: string
    position: { x: number; y: number }
    animation?: 'fade' | 'slide' | 'bounce'
  }
}

// トランジション
export interface Transition {
  id: string
  type: 'fade' | 'dissolve' | 'wipe' | 'slide'
  duration: number // seconds
  parameters: Record<string, any>
}

// フィルター（色調整など）
export interface Filter {
  id: string
  type: 'lut' | 'color-correction' | 'vignette'
  enabled: boolean
  parameters: Record<string, any>
}

// エフェクトユニオン型
export type Effect = VideoEffect | AudioEffect | TextEffect

// エフェクトプリセット
export interface EffectPreset {
  id: string
  name: string
  category: string
  effects: Effect[]
}
```

---

### T017: Project/Media型定義

**ファイル1**: `types/project.ts`

```typescript
export interface Project {
  id: string
  user_id: string
  name: string
  settings: ProjectSettings
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export interface ProjectSettings {
  width: number // 1920
  height: number // 1080
  frameRate: number // 30, 60
  sampleRate: number // 48000
  duration: number // seconds
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  width: 1920,
  height: 1080,
  frameRate: 30,
  sampleRate: 48000,
  duration: 0,
}
```

**ファイル2**: `types/media.ts`

```typescript
export interface MediaFile {
  id: string
  project_id: string
  user_id: string
  file_name: string
  file_type: 'video' | 'audio' | 'image'
  file_size: number // bytes
  storage_path: string
  thumbnail_url?: string
  duration?: number // seconds (video/audioのみ)
  width?: number // pixels (video/imageのみ)
  height?: number // pixels (video/imageのみ)
  metadata: MediaMetadata
  created_at: string
}

export interface MediaMetadata {
  codec?: string
  bitrate?: number
  channels?: number // audio
  fps?: number // video
  [key: string]: any
}

export interface MediaUploadProgress {
  fileName: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}
```

---

### T018: Supabase型生成

**方法1: 自動生成（推奨）**

```bash
# Supabase CLIをインストール
npm install --legacy-peer-deps supabase --save-dev

# ログイン
npx supabase login

# 型生成
npx supabase gen types typescript --project-id blvcuxxwiykgcbsduhbc > types/supabase.ts
```

**方法2: 手動作成**

**ファイル**: `types/supabase.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          settings: Json
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          settings?: Json
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          settings?: Json
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media_files: {
        Row: {
          id: string
          project_id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          thumbnail_url: string | null
          duration: number | null
          width: number | null
          height: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          thumbnail_url?: string | null
          duration?: number | null
          width?: number | null
          height?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          thumbnail_url?: string | null
          duration?: number | null
          width?: number | null
          height?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      // 他のテーブルも同様に定義...
    }
  }
}
```

---

### T019: レイアウト構造

**ファイル1**: `app/(auth)/layout.tsx`

```typescript
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  )
}
```

**ファイル2**: `app/(editor)/layout.tsx`

```typescript
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EditorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {children}
    </div>
  )
}
```

**ファイル3**: `app/(auth)/login/page.tsx`（サンプル認証ページ）

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ProEdit へようこそ</CardTitle>
        <CardDescription>
          Googleアカウントでログインしてください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleGoogleLogin} 
          className="w-full"
        >
          Google でログイン
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

### T020: エラーハンドリング

**ファイル1**: `app/error.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラーが発生しました</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || '予期しないエラーが発生しました。'}
        </AlertDescription>
        <Button 
          onClick={reset} 
          variant="outline" 
          className="mt-4"
        >
          再試行
        </Button>
      </Alert>
    </div>
  )
}
```

**ファイル2**: `app/loading.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="h-screen flex flex-col p-4 gap-4">
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-4 flex-1">
        <Skeleton className="w-64 h-full" />
        <Skeleton className="flex-1 h-full" />
      </div>
    </div>
  )
}
```

**ファイル3**: `app/not-found.tsx`

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-4">
          ページが見つかりませんでした
        </p>
        <Button asChild>
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    </div>
  )
}
```

---

### T021: Adobe Premiere Pro風テーマ適用

**ファイル**: `app/globals.css` の更新

既存のファイルに以下を**追加**:

```css
/* Adobe Premiere Pro風ダークテーマ */
:root {
  /* Premiere Pro カラーパレット */
  --premiere-bg-darkest: #1a1a1a;
  --premiere-bg-dark: #232323;
  --premiere-bg-medium: #2e2e2e;
  --premiere-bg-light: #3a3a3a;
  
  --premiere-accent-blue: #2196f3;
  --premiere-accent-teal: #1ee3cf;
  
  --premiere-text-primary: #d9d9d9;
  --premiere-text-secondary: #a8a8a8;
  --premiere-text-disabled: #666666;
  
  --premiere-border: #3e3e3e;
  --premiere-hover: #404040;
  
  /* Timeline colors */
  --timeline-video: #6366f1;
  --timeline-audio: #10b981;
  --timeline-ruler: #525252;
  
  /* シャドウ */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.7);
}

.dark {
  --background: var(--premiere-bg-dark);
  --foreground: var(--premiere-text-primary);
  
  --card: var(--premiere-bg-medium);
  --card-foreground: var(--premiere-text-primary);
  
  --primary: var(--premiere-accent-blue);
  --primary-foreground: #ffffff;
  
  --secondary: var(--premiere-bg-light);
  --secondary-foreground: var(--premiere-text-primary);
  
  --muted: var(--premiere-bg-light);
  --muted-foreground: var(--premiere-text-secondary);
  
  --accent: var(--premiere-accent-teal);
  --accent-foreground: var(--premiere-bg-darkest);
  
  --border: var(--premiere-border);
  --input: var(--premiere-bg-light);
  --ring: var(--premiere-accent-blue);
}

/* カスタムスクロールバー */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--premiere-bg-darkest);
}

::-webkit-scrollbar-thumb {
  background: var(--premiere-bg-light);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--premiere-hover);
}

/* タイムラインスタイル */
.timeline-track {
  background: var(--premiere-bg-medium);
  border: 1px solid var(--premiere-border);
  border-radius: 4px;
}

.timeline-clip-video {
  background: var(--timeline-video);
  border-left: 2px solid rgba(255, 255, 255, 0.2);
}

.timeline-clip-audio {
  background: var(--timeline-audio);
  border-left: 2px solid rgba(255, 255, 255, 0.2);
}

/* プロパティパネル */
.property-panel {
  background: var(--premiere-bg-medium);
  border-left: 1px solid var(--premiere-border);
}

.property-group {
  border-bottom: 1px solid var(--premiere-border);
  padding: 12px;
}

/* ツールバー */
.toolbar {
  background: var(--premiere-bg-darkest);
  border-bottom: 1px solid var(--premiere-border);
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
}

.toolbar-button {
  background: transparent;
  border: 1px solid transparent;
  color: var(--premiere-text-secondary);
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.toolbar-button:hover {
  background: var(--premiere-hover);
  color: var(--premiere-text-primary);
}

.toolbar-button.active {
  background: var(--premiere-accent-blue);
  color: white;
  border-color: var(--premiere-accent-blue);
}

/* メディアブラウザ */
.media-browser {
  background: var(--premiere-bg-medium);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  padding: 12px;
}

.media-item {
  aspect-ratio: 16/9;
  background: var(--premiere-bg-darkest);
  border: 1px solid var(--premiere-border);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.media-item:hover {
  border-color: var(--premiere-accent-blue);
  transform: scale(1.05);
}

.media-item.selected {
  border-color: var(--premiere-accent-teal);
  border-width: 2px;
}
```

---

## 📦 必要な依存関係の一括インストール

Phase 2で必要な全パッケージを一括インストール:

```bash
cd /Users/teradakousuke/Developer/ProEdit

npm install --legacy-peer-deps \
  @supabase/ssr \
  @supabase/supabase-js \
  zustand \
  pixi.js \
  @ffmpeg/ffmpeg \
  @ffmpeg/util

npm install --legacy-peer-deps --save-dev \
  supabase
```

---

## ✅ Phase 2 完了チェックリスト

Phase 2完了時に以下をすべて確認:

### Supabase設定
```bash
[ ] lib/supabase/client.ts 作成済み
[ ] lib/supabase/server.ts 作成済み
[ ] lib/supabase/utils.ts 作成済み
[ ] Supabaseダッシュボードで全テーブル作成確認
[ ] RLSポリシーすべて適用確認
[ ] media-filesバケット作成確認
[ ] Google OAuth設定完了
[ ] app/auth/callback/route.ts 作成済み
```

### コアライブラリ
```bash
[ ] stores/index.ts 作成済み（Zustand）
[ ] lib/pixi/setup.ts 作成済み
[ ] lib/ffmpeg/loader.ts 作成済み
```

### 型定義
```bash
[ ] types/effects.ts 作成済み
[ ] types/project.ts 作成済み
[ ] types/media.ts 作成済み
[ ] types/supabase.ts 作成済み
```

### UI構造
```bash
[ ] app/(auth)/layout.tsx 作成済み
[ ] app/(auth)/login/page.tsx 作成済み
[ ] app/(editor)/layout.tsx 作成済み
[ ] app/error.tsx 作成済み
[ ] app/loading.tsx 作成済み
[ ] app/not-found.tsx 作成済み
[ ] app/globals.css にPremiere Pro風テーマ追加
```

### 動作確認
```bash
[ ] npm run dev 起動成功
[ ] npm run lint エラーなし
[ ] npm run type-check エラーなし
[ ] http://localhost:3000/login にアクセス可能
[ ] Googleログインボタン表示
```

---

## 🎬 次のチャットで最初に言うこと

```markdown
ProEdit MVP Phase 2の実装を開始します。

HANDOVER_PHASE2.mdの内容に従って、Phase 2: Foundation（T007-T021）を実装してください。

【実装手順】
1. 依存関係の一括インストール
2. Supabase設定（client, server, utils）
3. データベースマイグレーション + RLSポリシー
4. Storage設定 + Google OAuth
5. コアライブラリ（Zustand, PIXI.js, FFmpeg）
6. 型定義（effects, project, media, supabase）
7. UIレイアウト + エラーハンドリング
8. テーマ適用

完了後、Phase 2完了チェックリストですべて確認してください。
```

---

## 🔧 トラブルシューティング

### 問題1: npm installでpeer dependencyエラー

**解決策**: 常に`--legacy-peer-deps`フラグを使用
```bash
npm install --legacy-peer-deps <package>
```

### 問題2: Supabase接続エラー

**確認事項**:
1. `.env.local`の環境変数が正しいか
2. Supabaseプロジェクトが起動しているか
3. `NEXT_PUBLIC_`プレフィックスがあるか

**デバッグ**:
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20))
```

### 問題3: TypeScriptエラー

**解決策**: `tsconfig.json`の`strict`設定を確認
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

### 問題4: CORS エラー（FFmpeg.wasm）

**確認**: `next.config.ts`のheaders設定が正しいか
```typescript
headers: [
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
]
```

---

## 📞 重要な参照ドキュメント

### Phase 2実装時に参照
1. **specs/001-proedit-mvp-browser/data-model.md** - DBスキーマ詳細
2. **specs/001-proedit-mvp-browser/quickstart.md** - Supabase設定手順
3. **specs/001-proedit-mvp-browser/tasks.md** - タスク詳細（T007-T021）
4. **vendor/omniclip/s/context/types.ts** - Effect型定義の参照元
5. **OMNICLIP_IMPLEMENTATION_ANALYSIS.md** - 実装パターン

### 技術ドキュメント
- [Supabase Auth (SSR)](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [PIXI.js v8 Migration Guide](https://pixijs.com/8.x/guides/migrations/v8)
- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## 🎯 Phase 2完了後の次のステップ

Phase 2が完了したら、**Phase 3: User Story 1（認証 + プロジェクト管理）** に進みます。

Phase 3の概要:
- US1実装: Google認証 + プロジェクト管理UI
- 推定時間: 6時間
- タスク: T022-T030

**Phase 3は新しいチャットで開始してください。**

---

## 📊 プロジェクト全体の進捗

```
Phase 1: Setup          ✅ 70% (ディレクトリ構造完了)
Phase 2: Foundation     🎯 次のステップ（このドキュメント）
Phase 3-4: MVP Core     ⏳ Phase 2完了後
Phase 5-7: 編集機能     ⏳ Phase 4完了後
Phase 8-9: Export       ⏳ Phase 7完了後
Phase 10: Polish        ⏳ 最終段階
```

---

**このドキュメントで Phase 2 の実装をスムーズに開始できます！** 🚀

**作成者**: Claude (2025-10-14)  
**ドキュメントバージョン**: 2.0.0  
**対象フェーズ**: Phase 2 Foundation (T007-T021)