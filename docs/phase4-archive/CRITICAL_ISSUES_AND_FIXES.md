# 🚨 Phase 4 Critical Issues & Immediate Fixes

> **発見日**: 2025-10-14  
> **検証**: Phase 1-4 徹底調査  
> **状態**: 5つの問題発見、うち2つがCRITICAL

---

## 問題サマリー

| ID | 重要度      | 問題                              | 影響          | 修正時間 |
|----|-------------|-----------------------------------|-------------|---------|
| #1 | 🔴 CRITICAL | effectsテーブルにfile_hash等のカラムがない    | Effectデータ消失 | 15分     |
| #2 | 🔴 CRITICAL | vitestが未インストール                   | テスト実行不可   | 5分      |
| #3 | 🟡 HIGH     | ImageEffect.thumbnailがomniclipにない | 互換性問題    | 5分      |
| #4 | 🟡 MEDIUM   | createEffectFromMediaFileヘルパー不足 | UI実装が複雑   | 30分     |
| #5 | 🟢 LOW      | エディタページにTimeline未統合            | 機能が見えない    | 10分     |

**総修正時間**: 約65分（1時間強）

---

## 🔴 問題#1: effectsテーブルのスキーマ不足 (CRITICAL)

### **問題詳細**

**現在のeffectsテーブル**:
```sql
CREATE TABLE effects (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  kind TEXT CHECK (kind IN ('video', 'audio', 'image', 'text')),
  track INTEGER,
  start_at_position INTEGER,
  duration INTEGER,
  start_time INTEGER,
  end_time INTEGER,
  media_file_id UUID REFERENCES media_files,
  properties JSONB,
  -- ❌ file_hash カラムなし
  -- ❌ name カラムなし
  -- ❌ thumbnail カラムなし
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Effect型定義**:
```typescript
interface VideoEffect extends BaseEffect {
  file_hash: string     // ✅ 型にはある
  name: string          // ✅ 型にはある
  thumbnail: string     // ✅ 型にはある
  // しかしDBに保存されない！
}
```

**問題の影響**:
1. Effectを作成してDBに保存 → file_hash, name, thumbnailが**消失**
2. DBから取得したEffectには file_hash, name, thumbnail が**ない**
3. Timeline表示時にファイル名が表示できない
4. 重複チェックができない

### **修正方法**

#### Step 1: マイグレーションファイル作成

**ファイル**: `supabase/migrations/004_add_effect_metadata.sql`

```sql
-- Add metadata columns to effects table
ALTER TABLE effects ADD COLUMN file_hash TEXT;
ALTER TABLE effects ADD COLUMN name TEXT;
ALTER TABLE effects ADD COLUMN thumbnail TEXT;

-- Add indexes for performance
CREATE INDEX idx_effects_file_hash ON effects(file_hash);
CREATE INDEX idx_effects_name ON effects(name);

-- Add comments
COMMENT ON COLUMN effects.file_hash IS 'SHA-256 hash from source media file (for deduplication)';
COMMENT ON COLUMN effects.name IS 'Original filename from source media file';
COMMENT ON COLUMN effects.thumbnail IS 'Thumbnail URL (video/image only)';
```

#### Step 2: Server Actions修正

**ファイル**: `app/actions/effects.ts`

```typescript
// 修正前 (line 33-44)
.insert({
  project_id: projectId,
  kind: effect.kind,
  track: effect.track,
  start_at_position: effect.start_at_position,
  duration: effect.duration,
  start_time: effect.start_time,
  end_time: effect.end_time,
  media_file_id: effect.media_file_id || null,
  properties: effect.properties as any,
  // ❌ file_hash, name, thumbnail が保存されない
})

// 修正後
.insert({
  project_id: projectId,
  kind: effect.kind,
  track: effect.track,
  start_at_position: effect.start_at_position,
  duration: effect.duration,
  start_time: effect.start_time,
  end_time: effect.end_time,
  media_file_id: effect.media_file_id || null,
  properties: effect.properties as any,
  // ✅ メタデータを保存
  file_hash: 'file_hash' in effect ? effect.file_hash : null,
  name: 'name' in effect ? effect.name : null,
  thumbnail: 'thumbnail' in effect ? effect.thumbnail : null,
})
```

#### Step 3: 型定義更新（オプショナル）

**ファイル**: `types/supabase.ts`

```bash
# Supabase型を再生成
npx supabase gen types typescript \
  --project-id blvcuxxwiykgcbsduhbc > types/supabase.ts
```

### **検証方法**

```bash
# マイグレーション実行
cd /Users/teradakousuke/Developer/proedit
# SupabaseダッシュボードでSQL実行 または
supabase db push

# 型チェック
npx tsc --noEmit

# 動作確認
# 1. メディアアップロード
# 2. タイムラインに配置
# 3. DBでeffectsテーブル確認
SELECT id, kind, name, file_hash, thumbnail FROM effects LIMIT 5;
# → name, file_hash, thumbnail が入っていることを確認
```

---

## 🔴 問題#2: vitest未インストール (CRITICAL)

### **問題詳細**

**現状**:
```bash
$ npx tsc --noEmit
error TS2307: Cannot find module 'vitest'

$ npm list vitest
└── (empty)
```

**実装されたテストファイル**:
- `tests/unit/media.test.ts` (45行)
- `tests/unit/timeline.test.ts` (177行)

**問題**: テストが実行できない → Constitution要件違反（70%カバレッジ）

### **修正方法**

#### Step 1: vitest インストール

```bash
cd /Users/teradakousuke/Developer/proedit

npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
```

#### Step 2: vitest設定ファイル作成

**ファイル**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

#### Step 3: テストセットアップファイル

**ファイル**: `tests/setup.ts`

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.crypto for hash tests (if needed in Node environment)
if (typeof window !== 'undefined' && !window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: {
        digest: async (algorithm: string, data: ArrayBuffer) => {
          // Fallback to Node crypto for tests
          const crypto = await import('crypto')
          return crypto.createHash('sha256').update(Buffer.from(data)).digest()
        }
      }
    }
  })
}
```

#### Step 4: package.json更新

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### **検証方法**

```bash
# テスト実行
npm run test

# 期待される出力:
# ✓ tests/unit/media.test.ts (4 tests) 
# ✓ tests/unit/timeline.test.ts (10 tests)
# 
# Test Files  2 passed (2)
# Tests  14 passed (14)

# カバレッジ確認
npm run test:coverage
# → 35%以上を目標
```

---

## 🟡 問題#3: ImageEffect.thumbnail (HIGH)

### **問題詳細**

**omniclip ImageEffect**:
```typescript
export interface ImageEffect extends Effect {
  kind: "image"
  rect: EffectRect
  file_hash: string
  name: string
  // ❌ thumbnail フィールドなし
}
```

**ProEdit ImageEffect**:
```typescript
export interface ImageEffect extends BaseEffect {
  kind: "image"
  properties: VideoImageProperties
  media_file_id: string
  file_hash: string
  name: string
  thumbnail: string  // ⚠️ omniclipにない拡張
}
```

**影響**:
- omniclipのImageEffect作成コードと非互換
- 画像にはサムネイル不要（元画像がサムネイル）
- 型の厳密性が低下

### **修正方法**

**ファイル**: `types/effects.ts`

```typescript
// 修正前
export interface ImageEffect extends BaseEffect {
  kind: "image";
  properties: VideoImageProperties;
  media_file_id: string;
  file_hash: string;
  name: string;
  thumbnail: string;  // ❌ 必須
}

// 修正後
export interface ImageEffect extends BaseEffect {
  kind: "image";
  properties: VideoImageProperties;
  media_file_id: string;
  file_hash: string;
  name: string;
  thumbnail?: string;  // ✅ オプショナル（omniclip互換）
}
```

**理由**: 画像の場合、元ファイル自体がサムネイルとして使える

---

## 🟡 問題#4: Effect作成ヘルパー不足 (MEDIUM)

### **問題詳細**

**現状**: MediaFileからEffectを作成するコードがUIコンポーネント側で必要

```typescript
// EffectBlock.tsx でドラッグ&ドロップ時に必要な処理
const handleDrop = (mediaFile: MediaFile) => {
  // ❌ UIコンポーネントでこれを全部書く必要がある
  const effect = {
    kind: getKindFromMimeType(mediaFile.mime_type),
    track: 0,
    start_at_position: 0,
    duration: mediaFile.metadata.duration * 1000,
    start_time: 0,
    end_time: mediaFile.metadata.duration * 1000,
    media_file_id: mediaFile.id,
    file_hash: mediaFile.file_hash,
    name: mediaFile.filename,
    thumbnail: mediaFile.metadata.thumbnail || '',
    properties: {
      rect: createDefaultRect(mediaFile.metadata),
      raw_duration: mediaFile.metadata.duration * 1000,
      frames: calculateFrames(mediaFile.metadata)
    }
  }
  await createEffect(projectId, effect)
}
```

### **修正方法**

**ファイル**: `app/actions/effects.ts` に追加

```typescript
/**
 * Create effect from media file with smart defaults
 * Automatically calculates properties based on media metadata
 * @param projectId Project ID
 * @param mediaFileId Media file ID
 * @param position Timeline position in ms
 * @param track Track index
 * @returns Promise<Effect> Created effect
 */
export async function createEffectFromMediaFile(
  projectId: string,
  mediaFileId: string,
  position: number,
  track: number
): Promise<Effect> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get media file
  const { data: mediaFile, error: mediaError } = await supabase
    .from('media_files')
    .select('*')
    .eq('id', mediaFileId)
    .eq('user_id', user.id)
    .single()

  if (mediaError || !mediaFile) {
    throw new Error('Media file not found')
  }

  // Determine effect kind
  const kind = mediaFile.mime_type.startsWith('video/') ? 'video' :
               mediaFile.mime_type.startsWith('audio/') ? 'audio' :
               mediaFile.mime_type.startsWith('image/') ? 'image' :
               null

  if (!kind) throw new Error('Unsupported media type')

  // Get metadata
  const metadata = mediaFile.metadata as any
  const duration = (metadata.duration || 5) * 1000 // Default 5s for images

  // Create effect with defaults
  const effectData = {
    kind,
    track,
    start_at_position: position,
    duration,
    start_time: 0,
    end_time: duration,
    media_file_id: mediaFileId,
    file_hash: mediaFile.file_hash,
    name: mediaFile.filename,
    thumbnail: kind === 'video' ? (metadata.thumbnail || '') : 
               kind === 'image' ? mediaFile.storage_path : '',
    properties: createDefaultProperties(kind, metadata),
  }

  return createEffect(projectId, effectData as any)
}

function createDefaultProperties(kind: string, metadata: any): any {
  if (kind === 'video' || kind === 'image') {
    return {
      rect: {
        width: metadata.width || 1920,
        height: metadata.height || 1080,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: { x: 960, y: 540 }, // Center
        rotation: 0,
        pivot: { x: (metadata.width || 1920) / 2, y: (metadata.height || 1080) / 2 }
      },
      raw_duration: (metadata.duration || 5) * 1000,
      frames: metadata.frames || Math.floor((metadata.duration || 5) * 30)
    }
  } else if (kind === 'audio') {
    return {
      volume: 1.0,
      muted: false,
      raw_duration: metadata.duration * 1000
    }
  }
  return {}
}
```

**使用方法**:
```typescript
// UIコンポーネントから簡単に呼び出し
const effect = await createEffectFromMediaFile(
  projectId,
  mediaFile.id,
  1000,  // 1秒の位置
  0      // Track 0
)
```

---

## 🟢 問題#5: エディタページへの統合 (LOW)

### **問題詳細**

**現在の `app/editor/[projectId]/page.tsx`**:
```typescript
// 空のプレビュー + プレースホルダーのみ
<div className="text-center">
  <p>Start by adding media files to your timeline</p>
</div>
```

**問題**: Phase 4で実装したMediaLibraryとTimelineが表示されない

### **修正方法**

**ファイル**: `app/editor/[projectId]/page.tsx` を完全書き換え

```typescript
'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/auth'
import { getProject } from '@/app/actions/projects'
import { MediaLibrary } from '@/features/media/components/MediaLibrary'
import { Timeline } from '@/features/timeline/components/Timeline'
import { Button } from '@/components/ui/button'
import { PanelRightOpen } from 'lucide-react'

interface EditorPageProps {
  params: Promise<{
    projectId: string
  }>
}

export default function EditorPage({ params }: EditorPageProps) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(true)

  // Get projectId from params
  useEffect(() => {
    params.then(p => setProjectId(p.projectId))
  }, [params])

  if (!projectId) return null

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Area (Phase 5で実装) */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 border-b border-border">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Preview Canvas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time preview will be available in Phase 5
            </p>
          </div>
          <Button variant="outline" onClick={() => setMediaLibraryOpen(true)}>
            <PanelRightOpen className="h-4 w-4 mr-2" />
            Open Media Library
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="h-80 border-t border-border">
        <Timeline projectId={projectId} />
      </div>

      {/* Media Library Panel */}
      <MediaLibrary
        projectId={projectId}
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
      />
    </div>
  )
}
```

**注意**: `'use client'` directive必須（Client Component）

---

## 📋 修正手順チェックリスト

### **Phase 5前に完了すべきタスク**

```bash
[ ] 1. effectsテーブルマイグレーション実行
    - supabase/migrations/004_add_effect_metadata.sql 作成
    - Supabaseダッシュボードで実行
    - テーブル構造確認

[ ] 2. app/actions/effects.ts 修正
    - INSERT文にfile_hash, name, thumbnail追加
    - 型チェック実行

[ ] 3. vitest インストール
    - npm install --save-dev vitest @vitest/ui jsdom
    - vitest.config.ts 作成
    - tests/setup.ts 作成

[ ] 4. テスト実行
    - npm run test
    - 全テストパス確認
    - カバレッジ30%以上確認

[ ] 5. types/effects.ts 修正
    - ImageEffect.thumbnail → thumbnail?（オプショナル）
    - 型チェック実行

[ ] 6. createEffectFromMediaFile ヘルパー実装
    - app/actions/effects.ts に追加
    - 型チェック実行

[ ] 7. app/editor/[projectId]/page.tsx 更新
    - 'use client' 追加
    - Timeline/MediaLibrary統合
    - ブラウザで動作確認

[ ] 8. 最終確認
    - npm run type-check → エラー0件
    - npm run test → 全テストパス
    - npm run dev → 起動成功
    - ブラウザでメディアアップロード → タイムライン配置確認
```

**推定所要時間**: 60-90分

---

## 🎯 修正完了後の期待状態

### **Phase 4完璧完了の条件**

```bash
✅ effectsテーブルにfile_hash, name, thumbnailカラムがある
✅ Effect作成時にfile_hash, name, thumbnailが保存される
✅ DBから取得したEffectに全フィールドが含まれる
✅ npm run test で全テストパス
✅ テストカバレッジ35%以上
✅ ブラウザでメディアアップロード可能
✅ タイムライン上でエフェクトが表示される
✅ エフェクトドラッグ&ドロップで配置可能
✅ 重複ファイルがアップロード時に検出される
✅ TypeScriptエラー0件
```

---

## 📊 問題修正の優先順位

### **即座に修正（Phase 5前）**

1. 🔴 **問題#1**: effectsテーブルマイグレーション
2. 🔴 **問題#2**: vitest インストール

### **できるだけ早く修正（Phase 5開始前）**

3. 🟡 **問題#4**: createEffectFromMediaFileヘルパー
4. 🟡 **問題#3**: ImageEffect.thumbnail オプショナル化

### **Phase 5と並行で可能**

5. 🟢 **問題#5**: エディタページ統合

---

## 💡 修正後の状態

```
Phase 1: Setup          ✅ 100% (完璧)
Phase 2: Foundation     ✅ 100% (完璧)
Phase 3: User Story 1   ✅ 100% (完璧)
Phase 4: User Story 2   ✅ 100% (5問題修正後)
                        ↓
                  Phase 5 開始可能 🚀
```

---

**作成日**: 2025-10-14  
**対象**: Phase 1-4 実装  
**結論**: **5つの問題を修正すれば、Phase 4は100%完成**

