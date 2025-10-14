# Phase 4 完了作業指示書 - 最終統合とバグ修正

> **対象**: 開発エンジニア  
> **目的**: Phase 4を100%完成させ、Phase 5へ進める  
> **推定時間**: 4-6時間  
> **重要度**: 🚨 CRITICAL - これなしではPhase 5に進めない

---

## 📊 2つのレビュー結果の総合判断

### **Technical Review Team #1 (私) の評価**
- 全体評価: **85/100点**
- Phase 4実装: **95%完了**（5つの問題）
- 評価視点: コードの存在と品質

### **Technical Review Team #2 (別エンジニア) の評価**
- 全体評価: **78%完了**
- Phase 4実装: **Backend 100%, Frontend 0%統合**（7つのCRITICAL問題）
- 評価視点: 実際の動作可能性

### **総合判断（最終結論）**

```
Phase 4の実態:
✅ バックエンドロジック: 100%実装済み（高品質）
❌ フロントエンド統合: 0%（コンポーネントが使われていない）
⚠️ omniclip整合性: 85%（細かい違いあり）

結論: コードは存在するが、ユーザーが使えない状態
    = 「車のエンジンは完璧だが、タイヤに繋がっていない」
```

---

## 🚨 発見された全問題（統合リスト）

### **🔴 CRITICAL（即座に修正必須）**

#### **C1: Editor PageへのUI統合がゼロ**（Review #2 - Finding C1）
- **現状**: Timeline/MediaLibraryコンポーネントが実装されているが、エディタページに表示されない
- **影響**: ユーザーがPhase 4機能を一切使えない
- **修正**: `app/editor/[projectId]/page.tsx`の完全書き換え

#### **C2: Effect型にstart/endフィールドがない**（Review #2 - Finding C2）
- **現状**: omniclipの`start`/`end`（トリム点）がない、`start_time`/`end_time`は別物
- **影響**: Phase 6のトリム機能が実装不可能
- **修正**: `types/effects.ts`に`start`/`end`追加

#### **C3: effectsテーブルのスキーマ不足**（Review #1 - 問題#1）
- **現状**: `file_hash`, `name`, `thumbnail`カラムがない
- **影響**: Effectを保存・取得時にデータ消失
- **修正**: マイグレーション実行

#### **C4: vitestが未インストール**（Review #1 - 問題#2）
- **現状**: テストファイル存在するが実行不可
- **影響**: テストカバレッジ0%、Constitution違反
- **修正**: `npm install vitest`

#### **C5: Editor PageがServer Component**（Review #2 - Finding C6）
- **現状**: `'use client'`なし、Timeline/MediaLibraryをimport不可
- **影響**: Client Componentを統合できない
- **修正**: Client Componentに変換

### **🟡 HIGH（できるだけ早く修正）**

#### **H1: Placement Logicの不完全移植**（Review #2 - Finding C3）
- **現状**: `#adjustStartPosition`等のメソッドが欠落
- **影響**: 複雑なシナリオで配置が不正確
- **修正**: omniclipから追加メソッド移植

#### **H2: MediaCardからEffect作成への接続なし**（Review #2 - Finding C7）
- **現状**: MediaCardをクリックしてもタイムラインに追加できない
- **影響**: UIとバックエンドが繋がっていない
- **修正**: ドラッグ&ドロップまたはボタンで`createEffect`呼び出し

### **🟢 MEDIUM（Phase 5前に修正推奨）**

#### **M1: サムネイル生成未実装**（Review #2 - Finding C4）
- **現状**: `thumbnail: ''`固定
- **影響**: UX低下、FR-015違反
- **修正**: omniclipの`create_video_thumbnail`移植

#### **M2: createEffectFromMediaFileヘルパー不足**（Review #1 - 問題#4）
- **現状**: UIからEffect作成が複雑
- **修正**: ヘルパー関数追加

#### **M3: ImageEffect.thumbnailの拡張**（Review #1 - 問題#3）
- **現状**: 必須フィールドだがomniclipにはない
- **修正**: オプショナルに変更

---

## 🎯 修正作業の全体像

```
Phase 4完了までの作業:
├─ CRITICAL修正（4-5時間）
│  ├─ C1: UI統合（2時間）
│  ├─ C2: Effect型修正（1時間）
│  ├─ C3: DBマイグレーション（15分）
│  ├─ C4: vitest導入（15分）
│  └─ C5: Client Component化（30分）
│
├─ HIGH修正（1-2時間）
│  ├─ H1: Placement Logic完成（1時間）
│  └─ H2: MediaCard統合（30分）
│
└─ MEDIUM修正（1-2時間）
   ├─ M1: サムネイル生成（1時間）
   ├─ M2: ヘルパー関数（30分）
   └─ M3: 型修正（15分）

総推定時間: 6-9時間
```

---

## 📋 修正手順（優先順位順）

### **Step 1: Effect型の完全修正（CRITICAL - C2対応）**

**時間**: 1時間  
**ファイル**: `types/effects.ts`

**問題**: omniclipの`start`/`end`フィールドがない

**omniclipのEffect構造**:
```typescript
// vendor/omniclip/s/context/types.ts (lines 53-60)
export interface Effect {
  id: string
  start_at_position: number  // Timeline上の位置
  duration: number           // 表示時間（計算値: end - start）
  start: number             // トリム開始（メディア内の位置）
  end: number               // トリム終了（メディア内の位置）
  track: number
}

// 重要な関係式:
// duration = end - start
// 例: 10秒のビデオの3秒目から5秒目を使う場合
//   start = 3000ms
//   end = 5000ms
//   duration = 2000ms
```

**ProEditの現在の実装**:
```typescript
// types/effects.ts (現在)
export interface BaseEffect {
  start_at_position: number  // ✅ OK
  duration: number           // ✅ OK
  start_time: number         // ❌ これは別物！
  end_time: number           // ❌ これは別物！
  // ❌ start がない
  // ❌ end がない
}
```

**修正内容**:

```typescript
// types/effects.ts - BaseEffect を以下に修正
export interface BaseEffect {
  id: string;
  project_id: string;
  kind: EffectKind;
  track: number;
  
  // Timeline positioning (from omniclip)
  start_at_position: number; // Timeline position in ms
  duration: number;          // Display duration in ms (calculated: end - start)
  
  // Trim points (from omniclip) - CRITICAL for Phase 6
  start: number;             // ✅ ADD: Trim start position in ms (within media file)
  end: number;               // ✅ ADD: Trim end position in ms (within media file)
  
  // Database-specific fields
  media_file_id?: string;
  created_at: string;
  updated_at: string;
}

// IMPORTANT: start/end と start_time/end_time は別物
// - start/end: メディアファイル内のトリム位置（omniclip準拠）
// - start_time/end_time: 削除する（混乱を招く）
```

**⚠️ BREAKING CHANGE**: これによりDBスキーマも変更必要

**データベースマイグレーション**:

**ファイル**: `supabase/migrations/004_fix_effect_schema.sql`

```sql
-- Remove confusing columns
ALTER TABLE effects DROP COLUMN IF EXISTS start_time;
ALTER TABLE effects DROP COLUMN IF EXISTS end_time;

-- Add omniclip-compliant columns
ALTER TABLE effects ADD COLUMN start INTEGER NOT NULL DEFAULT 0;
ALTER TABLE effects ADD COLUMN end INTEGER NOT NULL DEFAULT 0;

-- Add metadata columns (C3対応)
ALTER TABLE effects ADD COLUMN file_hash TEXT;
ALTER TABLE effects ADD COLUMN name TEXT;
ALTER TABLE effects ADD COLUMN thumbnail TEXT;

-- Add indexes
CREATE INDEX idx_effects_file_hash ON effects(file_hash);
CREATE INDEX idx_effects_name ON effects(name);

-- Add comments
COMMENT ON COLUMN effects.start IS 'Trim start position in ms (within media file) - from omniclip';
COMMENT ON COLUMN effects.end IS 'Trim end position in ms (within media file) - from omniclip';
COMMENT ON COLUMN effects.duration IS 'Display duration in ms (calculated: end - start) - from omniclip';
COMMENT ON COLUMN effects.file_hash IS 'SHA-256 hash from source media file';
COMMENT ON COLUMN effects.name IS 'Original filename from source media file';
COMMENT ON COLUMN effects.thumbnail IS 'Thumbnail URL or data URL';
```

**app/actions/effects.ts 修正**:

```typescript
// createEffect修正
.insert({
  project_id: projectId,
  kind: effect.kind,
  track: effect.track,
  start_at_position: effect.start_at_position,
  duration: effect.duration,
  start: effect.start,              // ✅ ADD
  end: effect.end,                  // ✅ ADD
  media_file_id: effect.media_file_id || null,
  properties: effect.properties as any,
  file_hash: 'file_hash' in effect ? effect.file_hash : null,     // ✅ ADD
  name: 'name' in effect ? effect.name : null,                   // ✅ ADD
  thumbnail: 'thumbnail' in effect ? effect.thumbnail : null,     // ✅ ADD
})
```

**検証**:
```bash
npx tsc --noEmit
# エラーがないことを確認
```

---

### **Step 2: Editor PageのClient Component化（CRITICAL - C5, C1対応）**

**時間**: 30分  
**ファイル**: `app/editor/[projectId]/page.tsx`

**問題**: 現在Server ComponentでTimeline/MediaLibraryをimport不可

**修正方法**: Client Wrapperパターン使用

**新規ファイル**: `app/editor/[projectId]/EditorClient.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Timeline } from '@/features/timeline/components/Timeline'
import { MediaLibrary } from '@/features/media/components/MediaLibrary'
import { Button } from '@/components/ui/button'
import { PanelRightOpen } from 'lucide-react'
import { Project } from '@/types/project'

interface EditorClientProps {
  project: Project
}

export function EditorClient({ project }: EditorClientProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Area - Phase 5で実装 */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 border-b border-border">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {project.settings.width}x{project.settings.height} • {project.settings.fps}fps
            </p>
          </div>
          <p className="text-muted-foreground max-w-md">
            Real-time preview will be available in Phase 5
          </p>
          <Button variant="outline" onClick={() => setMediaLibraryOpen(true)}>
            <PanelRightOpen className="h-4 w-4 mr-2" />
            Open Media Library
          </Button>
        </div>
      </div>

      {/* Timeline Area - ✅ Phase 4統合 */}
      <div className="h-80 border-t border-border">
        <Timeline projectId={project.id} />
      </div>

      {/* Media Library Panel - ✅ Phase 4統合 */}
      <MediaLibrary
        projectId={project.id}
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
      />
    </div>
  )
}
```

**app/editor/[projectId]/page.tsx 修正**:

```typescript
// Server Componentのまま維持（認証チェック用）
import { redirect } from "next/navigation";
import { getUser } from "@/app/actions/auth";
import { getProject } from "@/app/actions/projects";
import { EditorClient } from "./EditorClient";  // ✅ Client wrapper import

interface EditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    redirect("/editor");
  }

  // ✅ Client Componentに委譲
  return <EditorClient project={project} />;
}
```

**パターン**: Server Component（認証） → Client Component（UI）の分離

---

### **Step 3: MediaCardからタイムラインへの接続（CRITICAL - H2対応）**

**時間**: 30分  
**ファイル**: `features/media/components/MediaCard.tsx`

**問題**: メディアをクリックしてもタイムラインに追加できない

**修正内容**:

```typescript
// MediaCard.tsx に追加
'use client'

import { MediaFile, isVideoMetadata, isAudioMetadata, isImageMetadata } from '@/types/media'
import { Card } from '@/components/ui/card'
import { FileVideo, FileAudio, FileImage, Trash2, Plus } from 'lucide-react'  // ✅ Plus追加
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { deleteMedia } from '@/app/actions/media'
import { createEffectFromMediaFile } from '@/app/actions/effects'  // ✅ 新規import
import { useMediaStore } from '@/stores/media'
import { useTimelineStore } from '@/stores/timeline'  // ✅ 新規import
import { toast } from 'sonner'

interface MediaCardProps {
  media: MediaFile
  projectId: string  // ✅ 追加必須
}

export function MediaCard({ media, projectId }: MediaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)  // ✅ 追加
  const { removeMediaFile, toggleMediaSelection, selectedMediaIds } = useMediaStore()
  const { addEffect } = useTimelineStore()  // ✅ 追加
  const isSelected = selectedMediaIds.includes(media.id)

  // ... 既存のコード ...

  // ✅ 新規関数: タイムラインに追加
  const handleAddToTimeline = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    setIsAdding(true)
    try {
      // createEffectFromMediaFile を呼び出し
      // この関数はStep 4で実装
      const effect = await createEffectFromMediaFile(
        projectId,
        media.id,
        0,  // Position: 最適位置は自動計算
        0   // Track: 最適トラックは自動計算
      )
      
      addEffect(effect)
      toast.success('Added to timeline', {
        description: media.filename
      })
    } catch (error) {
      toast.error('Failed to add to timeline', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card
      className={`
        media-card p-4 cursor-pointer hover:bg-accent transition-colors
        ${isSelected ? 'ring-2 ring-primary' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex flex-col space-y-2">
        {/* 既存のサムネイル/アイコン表示 */}
        {/* ... */}

        {/* Actions */}
        <div className="flex justify-between gap-2">
          {/* ✅ タイムライン追加ボタン */}
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleAddToTimeline}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
          
          {/* 既存の削除ボタン */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
```

**MediaLibrary.tsx も修正**:

```typescript
// MediaLibrary.tsx (line 64)
{mediaFiles.map(media => (
  <MediaCard 
    key={media.id} 
    media={media} 
    projectId={projectId}  // ✅ projectIdを渡す
  />
))}
```

---

### **Step 4: createEffectFromMediaFileヘルパー実装（HIGH - M2対応）**

**時間**: 30分  
**ファイル**: `app/actions/effects.ts` に追加

**実装**:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Effect, VideoEffect, AudioEffect, ImageEffect } from '@/types/effects'
import { findPlaceForNewEffect } from '@/features/timeline/utils/placement'

/**
 * Create effect from media file with automatic positioning and defaults
 * This is the main entry point from UI (MediaCard "Add to Timeline" button)
 * 
 * @param projectId Project ID
 * @param mediaFileId Media file ID
 * @param targetPosition Optional target position (auto-calculated if not provided)
 * @param targetTrack Optional target track (auto-calculated if not provided)
 * @returns Promise<Effect> Created effect with proper defaults
 */
export async function createEffectFromMediaFile(
  projectId: string,
  mediaFileId: string,
  targetPosition?: number,
  targetTrack?: number
): Promise<Effect> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get media file
  const { data: mediaFile, error: mediaError } = await supabase
    .from('media_files')
    .select('*')
    .eq('id', mediaFileId)
    .eq('user_id', user.id)
    .single()

  if (mediaError || !mediaFile) {
    throw new Error('Media file not found')
  }

  // 2. Get existing effects for smart placement
  const existingEffects = await getEffects(projectId)

  // 3. Determine effect kind from MIME type
  const kind = mediaFile.mime_type.startsWith('video/') ? 'video' as const :
               mediaFile.mime_type.startsWith('audio/') ? 'audio' as const :
               mediaFile.mime_type.startsWith('image/') ? 'image' as const :
               null

  if (!kind) throw new Error('Unsupported media type')

  // 4. Get metadata
  const metadata = mediaFile.metadata as any
  const rawDuration = (metadata.duration || 5) * 1000 // Default 5s for images

  // 5. Calculate optimal position and track if not provided
  let position = targetPosition ?? 0
  let track = targetTrack ?? 0
  
  if (targetPosition === undefined || targetTrack === undefined) {
    const optimal = findPlaceForNewEffect(existingEffects, 3) // 3 tracks default
    position = targetPosition ?? optimal.position
    track = targetTrack ?? optimal.track
  }

  // 6. Create effect with appropriate properties
  const effectData: any = {
    kind,
    track,
    start_at_position: position,
    duration: rawDuration,
    start: 0,                      // ✅ omniclip準拠
    end: rawDuration,              // ✅ omniclip準拠
    media_file_id: mediaFileId,
    file_hash: mediaFile.file_hash,
    name: mediaFile.filename,
    thumbnail: '',  // サムネイルはStep 6で生成
    properties: createDefaultProperties(kind, metadata),
  }

  // 7. Create effect in database
  return createEffect(projectId, effectData)
}

/**
 * Create default properties based on media type
 */
function createDefaultProperties(kind: 'video' | 'audio' | 'image', metadata: any): any {
  if (kind === 'video' || kind === 'image') {
    const width = metadata.width || 1920
    const height = metadata.height || 1080
    
    return {
      rect: {
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: { 
          x: 1920 / 2,  // Center X
          y: 1080 / 2   // Center Y
        },
        rotation: 0,
        pivot: { 
          x: width / 2, 
          y: height / 2 
        }
      },
      raw_duration: (metadata.duration || 5) * 1000,
      frames: metadata.frames || Math.floor((metadata.duration || 5) * (metadata.fps || 30))
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

**export追加**:
```typescript
// app/actions/effects.ts の最後に
export { createEffectFromMediaFile }
```

---

### **Step 5: Placement Logicの完全移植（HIGH - H1対応）**

**時間**: 1時間  
**ファイル**: `features/timeline/utils/placement.ts`

**問題**: `#adjustStartPosition`、`calculateDistanceToBefore/After`が欠落

**追加実装**:

```typescript
// placement.ts に追加

class EffectPlacementUtilities {
  // 既存のメソッド...

  /**
   * Calculate distance from effect to timeline start position
   * @param effectBefore Effect before target position
   * @param timelineStart Target start position
   * @returns Distance in ms
   */
  calculateDistanceToBefore(effectBefore: Effect, timelineStart: number): number {
    const effectBeforeEnd = effectBefore.start_at_position + effectBefore.duration
    return timelineStart - effectBeforeEnd
  }

  /**
   * Calculate distance from timeline end to next effect
   * @param effectAfter Effect after target position
   * @param timelineEnd Target end position
   * @returns Distance in ms
   */
  calculateDistanceToAfter(effectAfter: Effect, timelineEnd: number): number {
    return effectAfter.start_at_position - timelineEnd
  }
}

/**
 * Adjust start position based on surrounding effects
 * Ported from omniclip's #adjustStartPosition (private method)
 */
function adjustStartPosition(
  effectBefore: Effect | undefined,
  effectAfter: Effect | undefined,
  proposedStartPosition: number,
  proposedEndPosition: number,
  effectDuration: number,
  effectsToPush: Effect[] | undefined,
  shrinkedDuration: number | undefined,
  utilities: EffectPlacementUtilities
): number {
  let adjustedPosition = proposedStartPosition

  // Case 1: Has effects to push - snap to previous effect
  if (effectsToPush && effectsToPush.length > 0 && effectBefore) {
    adjustedPosition = effectBefore.start_at_position + effectBefore.duration
  }
  
  // Case 2: Will be shrunk - snap to previous effect
  else if (shrinkedDuration && effectBefore) {
    adjustedPosition = effectBefore.start_at_position + effectBefore.duration
  }
  
  // Case 3: Check snapping distance to before
  else if (effectBefore) {
    const distanceToBefore = utilities.calculateDistanceToBefore(effectBefore, proposedStartPosition)
    const SNAP_THRESHOLD = 100 // 100ms threshold
    
    if (distanceToBefore >= 0 && distanceToBefore < SNAP_THRESHOLD) {
      // Snap to end of previous effect
      adjustedPosition = effectBefore.start_at_position + effectBefore.duration
    }
  }
  
  // Case 4: Check snapping distance to after
  if (effectAfter) {
    const distanceToAfter = utilities.calculateDistanceToAfter(effectAfter, proposedEndPosition)
    const SNAP_THRESHOLD = 100 // 100ms threshold
    
    if (distanceToAfter >= 0 && distanceToAfter < SNAP_THRESHOLD) {
      // Snap to start of next effect
      adjustedPosition = effectAfter.start_at_position - effectDuration
    }
  }

  return Math.max(0, adjustedPosition) // Never negative
}

/**
 * Enhanced calculateProposedTimecode with full omniclip logic
 */
export function calculateProposedTimecode(
  effect: Effect,
  targetPosition: number,
  targetTrack: number,
  existingEffects: Effect[]
): ProposedTimecode {
  const utilities = new EffectPlacementUtilities()

  const trackEffects = existingEffects.filter(
    e => e.track === targetTrack && e.id !== effect.id
  )

  const effectBefore = utilities.getEffectsBefore(trackEffects, targetPosition)[0]
  const effectAfter = utilities.getEffectsAfter(trackEffects, targetPosition)[0]

  let proposedStartPosition = targetPosition
  let shrinkedDuration: number | undefined
  let effectsToPush: Effect[] | undefined

  // Collision detection
  if (effectBefore && effectAfter) {
    const spaceBetween = utilities.calculateSpaceBetween(effectBefore, effectAfter)

    if (spaceBetween < effect.duration && spaceBetween > 0) {
      shrinkedDuration = spaceBetween
      proposedStartPosition = effectBefore.start_at_position + effectBefore.duration
    } else if (spaceBetween === 0) {
      effectsToPush = utilities.getEffectsAfter(trackEffects, targetPosition)
      proposedStartPosition = effectBefore.start_at_position + effectBefore.duration
    }
  }
  else if (effectBefore) {
    const effectBeforeEnd = effectBefore.start_at_position + effectBefore.duration
    if (targetPosition < effectBeforeEnd) {
      proposedStartPosition = effectBeforeEnd
    }
  }
  else if (effectAfter) {
    const proposedEnd = targetPosition + effect.duration
    if (proposedEnd > effectAfter.start_at_position) {
      shrinkedDuration = effectAfter.start_at_position - targetPosition
    }
  }

  // ✅ Apply #adjustStartPosition logic (omniclip準拠)
  const proposedEnd = proposedStartPosition + (shrinkedDuration || effect.duration)
  proposedStartPosition = adjustStartPosition(
    effectBefore,
    effectAfter,
    proposedStartPosition,
    proposedEnd,
    shrinkedDuration || effect.duration,
    effectsToPush,
    shrinkedDuration,
    utilities
  )

  return {
    proposed_place: {
      start_at_position: proposedStartPosition,
      track: targetTrack,
    },
    duration: shrinkedDuration,
    effects_to_push: effectsToPush,
  }
}
```

---

### **Step 6: サムネイル生成実装（MEDIUM - M1対応）**

**時間**: 1時間  
**ファイル**: `features/media/utils/metadata.ts`

**問題**: ビデオサムネイルが生成されない（`thumbnail: ''`固定）

**omniclip参照**: `vendor/omniclip/s/context/controllers/media/controller.ts` (lines 220-235)

**修正内容**:

```typescript
// metadata.ts に追加

/**
 * Generate thumbnail from video file
 * Ported from omniclip's create_video_thumbnail
 * @param file Video file
 * @returns Promise<string> Data URL of thumbnail
 */
async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of video, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime
    }
    
    video.onseeked = () => {
      try {
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas')
        const THUMBNAIL_WIDTH = 150
        const THUMBNAIL_HEIGHT = Math.floor((THUMBNAIL_WIDTH / video.videoWidth) * video.videoHeight)
        
        canvas.width = THUMBNAIL_WIDTH
        canvas.height = THUMBNAIL_HEIGHT
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Failed to get canvas context')
        }
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        URL.revokeObjectURL(video.src)
        resolve(dataUrl)
      } catch (error) {
        URL.revokeObjectURL(video.src)
        reject(error)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video for thumbnail'))
    }
    
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from video file WITH thumbnail generation
 */
async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = async () => {
      try {
        // Generate thumbnail
        const thumbnail = await generateVideoThumbnail(file)
        
        const metadata: VideoMetadata = {
          duration: video.duration,
          fps: 30, // Default FPS
          frames: Math.floor(video.duration * 30),
          width: video.videoWidth,
          height: video.videoHeight,
          codec: 'unknown',
          thumbnail,  // ✅ Generated thumbnail
        }

        URL.revokeObjectURL(video.src)
        resolve(metadata)
      } catch (error) {
        URL.revokeObjectURL(video.src)
        reject(error)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

// extractImageMetadata も同様にサムネイル生成可能
```

**⚠️ 注意**: 
- サムネイル生成は非同期処理
- ビデオファイルの読み込み待ちが発生
- アップロード時間が若干増加（許容範囲）

---

### **Step 7: vitest導入とテスト実行（CRITICAL - C4対応）**

**時間**: 15分

**インストール**:

```bash
cd /Users/teradakousuke/Developer/proedit

npm install --save-dev \
  vitest \
  @vitest/ui \
  jsdom \
  @testing-library/react \
  @testing-library/user-event \
  @vitejs/plugin-react
```

**設定ファイル**: `vitest.config.ts`

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
      include: ['app/**', 'features/**', 'lib/**', 'stores/**'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'app/layout.tsx',
        'app/page.tsx',
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

**セットアップファイル**: `tests/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))
```

**テスト実行**:

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

# 目標: 30%以上
```

---

### **Step 8: 型の最終調整（MEDIUM - M3対応）**

**時間**: 15分  
**ファイル**: `types/effects.ts`

**修正**: ImageEffect.thumbnailをオプショナルに

```typescript
export interface ImageEffect extends BaseEffect {
  kind: "image";
  properties: VideoImageProperties;
  media_file_id: string;
  file_hash: string;
  name: string;
  thumbnail?: string;  // ✅ Optional (omniclip互換)
}
```

**理由**: omniclipのImageEffectにはthumbnailフィールドがない

---

## ✅ 完了確認チェックリスト

すべて完了後、以下を確認:

### **1. データベース確認**

```sql
-- Supabase SQL Editor で実行

-- effectsテーブル構造確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'effects';

-- 必須カラム:
-- ✅ start (integer)
-- ✅ end (integer)
-- ✅ file_hash (text)
-- ✅ name (text)
-- ✅ thumbnail (text)
-- ❌ start_time (削除済み)
-- ❌ end_time (削除済み)
```

### **2. TypeScript型チェック**

```bash
npx tsc --noEmit

# 期待: エラー0件
# ✅ No errors found
```

### **3. テスト実行**

```bash
npm run test

# 期待: 全テストパス
# ✓ tests/unit/media.test.ts (4)
# ✓ tests/unit/timeline.test.ts (10)
# Test Files  2 passed (2)
# Tests  14 passed (14)

npm run test:coverage

# 期待: 30%以上
# Statements: 35%
# Branches: 30%
# Functions: 40%
# Lines: 35%
```

### **4. ブラウザ動作確認**

```bash
npm run dev

# http://localhost:3000/editor にアクセス
```

**手動テストシナリオ**:

```
[ ] 1. ログイン → ダッシュボード表示
[ ] 2. プロジェクト作成 → エディタページ表示
[ ] 3. "Open Media Library"ボタン表示
[ ] 4. ボタンクリック → Media Libraryパネル開く
[ ] 5. ファイルドラッグ&ドロップ → アップロード進捗表示
[ ] 6. アップロード完了 → メディアライブラリに表示
[ ] 7. 同じファイルを再アップロード → 重複検出（即座に完了）
[ ] 8. MediaCardの"Add"ボタン → タイムラインにエフェクト表示
[ ] 9. エフェクトブロックが正しい位置と幅で表示
[ ] 10. エフェクトクリック → 選択状態表示（ring）
[ ] 11. 複数エフェクト追加 → 重ならずに配置される
[ ] 12. ブラウザリロード → データが保持される
```

### **5. データベースデータ確認**

```sql
-- メディアファイル確認
SELECT id, filename, file_hash, file_size, mime_type
FROM media_files
ORDER BY created_at DESC
LIMIT 5;

-- エフェクト確認（全フィールド）
SELECT 
  id, kind, track, start_at_position, duration,
  start, end,  -- ✅ トリム点
  file_hash, name, thumbnail  -- ✅ メタデータ
FROM effects
ORDER BY created_at DESC
LIMIT 5;

-- 重複チェック（同じfile_hashが1件のみ）
SELECT file_hash, COUNT(*) as count
FROM media_files
GROUP BY file_hash
HAVING COUNT(*) > 1;
-- 結果: 0件（重複なし）
```

---

## 📋 修正作業の実行順序

```
優先度順に実行:

1️⃣ Step 1: Effect型修正（start/end追加）         [1時間]
   → npx tsc --noEmit で確認

2️⃣ Step 1: DBマイグレーション実行                [15分]
   → Supabaseダッシュボードで確認

3️⃣ Step 4: createEffectFromMediaFile実装        [30分]
   → npx tsc --noEmit で確認

4️⃣ Step 3: MediaCard修正（Add to Timelineボタン）[30分]
   → npx tsc --noEmit で確認

5️⃣ Step 2: EditorClient作成とpage.tsx修正      [30分]
   → npx tsc --noEmit で確認

6️⃣ Step 7: vitest導入とテスト実行               [15分]
   → npm run test で確認

7️⃣ Step 5: Placement Logic完全化                [1時間]
   → テスト追加と実行

8️⃣ Step 6: サムネイル生成                        [1時間]
   → ブラウザで確認

9️⃣ Step 8: 型の最終調整                         [15分]
   → npx tsc --noEmit で確認

🔟 最終確認: ブラウザテスト（上記シナリオ）       [30分]
```

**総推定時間**: 5.5-6.5時間

---

## 🎯 Phase 4完了の明確な定義

以下**すべて**を満たした時点でPhase 4完了:

### **技術要件**
```bash
✅ TypeScriptエラー: 0件
✅ テスト: 全テストパス（14+ tests）
✅ テストカバレッジ: 30%以上
✅ Lintエラー: 0件
✅ ビルド: 成功
```

### **機能要件**
```bash
✅ メディアをドラッグ&ドロップでアップロード可能
✅ アップロード中に進捗バー表示
✅ 同じファイルは重複アップロードされない（ハッシュチェック）
✅ メディアライブラリに全ファイル表示
✅ ビデオサムネイルが表示される
✅ MediaCardの"Add"ボタンでタイムラインに追加可能
✅ タイムライン上でエフェクトブロック表示
✅ エフェクトが重ならずに自動配置される
✅ エフェクトクリックで選択状態表示
✅ 複数エフェクト追加が正常動作
✅ ブラウザリロードでデータ保持
```

### **データ要件**
```bash
✅ effectsテーブルにstart/end/file_hash/name/thumbnailがある
✅ Effectを保存・取得時に全フィールド保持される
✅ media_filesテーブルでfile_hash一意性確保
```

### **omniclip整合性**
```bash
✅ Effect型がomniclipと95%以上一致
✅ Placement logicがomniclipと100%一致
✅ start/endフィールドでトリム対応可能
```

---

## 🚦 Phase 5進行判定

### **❌ 現在の状態: NO-GO**

**理由**:
- UI統合0%（ユーザーが機能を使えない）
- effectsテーブルのスキーマ不足
- start/endフィールド欠落

### **✅ 上記修正完了後: GO**

**条件**:
```
✅ すべてのCRITICAL問題解決
✅ すべてのHIGH問題解決
✅ 動作確認チェックリスト完了
✅ テスト実行成功
```

**Phase 5開始可能の証明**:
```bash
# 以下をすべて実行してスクリーンショット提出
1. npm run test → 全パス
2. npm run type-check → エラー0
3. ブラウザでメディアアップロード → タイムライン追加 → スクリーンショット
4. DB確認 → effectsテーブルにstart/end/file_hash存在確認
```

---

## 💡 2つのレビュー結果の統合結論

### **Technical Review #1の評価**: 85/100点
- **強み**: コード品質、omniclip移植精度を評価
- **弱み**: UI統合の欠如を軽視

### **Technical Review #2の評価**: 78/100点
- **強み**: 実際の動作可能性を重視
- **弱み**: 実装されたコードの質を評価せず

### **統合評価**: **82/100点**（両方の平均）

```
実装済み:
✅ バックエンド: 100%（高品質）
✅ コンポーネント: 100%（存在する）
❌ 統合: 0%（繋がっていない）

Phase 4の実態:
= 優れた部品が揃っているが、組み立てられていない状態
= 「IKEAの家具を買ったが、まだ組み立てていない」
```

---

## 🎯 開発エンジニアへの最終指示

### **明確なゴール**

```
Phase 4完了 = ユーザーがブラウザでメディアをアップロードし、
            タイムラインに配置できる状態
```

### **作業指示**

1. **このドキュメント（PHASE4_COMPLETION_DIRECTIVE.md）を最初から最後まで読む**
2. **Step 1から順番に実行**（スキップ禁止）
3. **各Step完了後に型チェック実行**（`npx tsc --noEmit`）
4. **Step 10の動作確認チェックリスト完了**
5. **完了報告時にスクリーンショット提出**

### **禁止事項**

- ❌ Stepをスキップする
- ❌ omniclipロジックを独自解釈で変更する
- ❌ 型エラーを無視する
- ❌ テストを書かない/実行しない
- ❌ 動作確認せずに「完了」報告する

### **成功の証明方法**

以下を**すべて**提出:
1. ✅ `npm run test`のスクリーンショット（全テストパス）
2. ✅ ブラウザでメディアアップロード → タイムライン追加のスクリーンショット
3. ✅ SupabaseダッシュボードのeffectsテーブルSELECT結果（start/end/file_hash確認）
4. ✅ `npx tsc --noEmit`の出力（エラー0件確認）

---

## 📊 期待される最終状態

```
修正後のPhase 4:
├─ TypeScriptエラー: 0件            ✅
├─ Lintエラー: 0件                  ✅
├─ テスト: 14+ passed               ✅
├─ テストカバレッジ: 35%以上        ✅
├─ UI統合: 100%                     ✅
├─ データ永続化: 100%               ✅
├─ omniclip準拠: 95%                ✅
└─ ユーザー動作確認: 100%           ✅

総合評価: 98/100点（Phase 4完璧完了）
```

---

**作成日**: 2025-10-14  
**統合レポート**: Technical Review #1 + #2  
**最終判断**: **Phase 4は85%完了。残り15%（6-9時間）で100%完成可能。**  
**次のマイルストーン**: Phase 5 - Real-time Preview and Playback

---

## 📞 質問・確認事項

実装中に不明点があれば:

1. **Effect型について** → このドキュメントのStep 1参照
2. **UI統合について** → Step 2, 3参照
3. **omniclipロジック** → `vendor/omniclip/s/context/`を直接参照
4. **テスト** → Step 7参照

**この指示書通りに実装すれば、Phase 4は完璧に完了します！** 🚀

