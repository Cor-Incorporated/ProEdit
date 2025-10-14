# Phase 4 実装指示書 - User Story 2: Media Upload and Timeline Placement

> **対象**: 実装エンジニア  
> **フェーズ**: Phase 4 (T033-T046) - 14タスク  
> **推定時間**: 8時間  
> **前提条件**: Phase 1-3完了、レビューレポート理解済み  
> **重要度**: 🚨 CRITICAL - MVP Core Functionality

---

## ⚠️ 実装前の必須作業

### 🔴 CRITICAL: Effect型の修正が先決

**問題**: 現在の `types/effects.ts` はomniclipの重要なフィールドが欠落している

**修正が必要な箇所**:

```typescript
// ❌ 現在の実装（不完全）
export interface VideoEffect extends BaseEffect {
  kind: "video";
  properties: VideoImageProperties;
  media_file_id: string;
}

// ✅ 修正後（omniclip準拠）
export interface VideoEffect extends BaseEffect {
  kind: "video";
  properties: VideoImageProperties;
  media_file_id: string;
  
  // omniclipから欠落していたフィールド
  file_hash: string;      // ファイル重複排除用（必須）
  name: string;           // 元ファイル名（必須）
  thumbnail: string;      // サムネイルURL（必須）
}
```

**同様に AudioEffect, ImageEffect も修正**:

```typescript
export interface AudioEffect extends BaseEffect {
  kind: "audio";
  properties: AudioProperties;
  media_file_id: string;
  file_hash: string;  // 追加
  name: string;       // 追加
}

export interface ImageEffect extends BaseEffect {
  kind: "image";
  properties: VideoImageProperties;
  media_file_id: string;
  file_hash: string;  // 追加
  name: string;       // 追加
  thumbnail: string;  // 追加
}
```

**📋 タスク T000 (Phase 4開始前)**:
```bash
1. types/effects.ts を上記のように修正
2. npx tsc --noEmit で型チェック
3. 修正をコミット: "fix: Add missing omniclip fields to Effect types"
```

---

## 🎯 Phase 4 実装目標

### ユーザーストーリー
```
As a video creator
I want to upload media files and add them to the timeline
So that I can start editing my video
```

### 受け入れ基準
- [ ] ユーザーがファイルをドラッグ&ドロップでアップロードできる
- [ ] アップロード中に進捗が表示される
- [ ] 同じファイルは重複してアップロードされない（ハッシュチェック）
- [ ] アップロード後、メディアライブラリに表示される
- [ ] メディアをドラッグしてタイムラインに配置できる
- [ ] タイムライン上でエフェクトが正しく表示される
- [ ] エフェクトの重なりが自動調整される（omniclipのplacement logic）

---

## 📁 実装ファイル構成

Phase 4で作成するファイル一覧:

```
app/actions/
  └── media.ts              (T035) Server Actions for media operations

features/media/
  ├── components/
  │   ├── MediaLibrary.tsx   (T033) Sheet panel with media list
  │   ├── MediaUpload.tsx    (T034) Drag-drop upload zone
  │   └── MediaCard.tsx      (T037) Individual media item card
  ├── hooks/
  │   └── useMediaUpload.ts  Custom hook for upload logic
  └── utils/
      ├── hash.ts            (T036) SHA-256 file hashing
      └── metadata.ts        (T046) Video/audio/image metadata extraction

features/timeline/
  ├── components/
  │   ├── Timeline.tsx       (T039) Main timeline container
  │   ├── TimelineTrack.tsx  (T040) Individual track component
  │   └── EffectBlock.tsx    (T043) Visual effect block on timeline
  └── utils/
      └── placement.ts       (T042) Effect placement logic from omniclip

stores/
  ├── media.ts               (T038) Zustand media store
  └── timeline.ts            (T044) Zustand timeline store

tests/
  └── unit/
      ├── media.test.ts      Media upload tests
      └── timeline.test.ts   Timeline placement tests
```

---

## 🔧 詳細実装指示

### Task T033: MediaLibrary Component

**ファイル**: `features/media/components/MediaLibrary.tsx`

**要件**:
- shadcn/ui Sheet を使用した右パネル
- メディアファイル一覧をグリッド表示
- MediaCard コンポーネントを使用
- 空状態の表示
- MediaUpload コンポーネントを含む

**omniclip参照**: `vendor/omniclip/s/components/omni-media/omni-media.ts`

**実装サンプル**:

```typescript
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { MediaUpload } from './MediaUpload'
import { MediaCard } from './MediaCard'
import { useMediaStore } from '@/stores/media'

interface MediaLibraryProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MediaLibrary({ projectId, open, onOpenChange }: MediaLibraryProps) {
  const { mediaFiles, isLoading } = useMediaStore()
  
  // projectIdでフィルター
  const projectMedia = mediaFiles.filter(m => m.project_id === projectId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Media Library</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* アップロードゾーン */}
          <MediaUpload projectId={projectId} />
          
          {/* メディア一覧 */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading media...
            </div>
          ) : projectMedia.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No media files yet</p>
              <p className="text-sm mt-2">Drag and drop files to upload</p>
            </div>
          ) : (
            <div className="media-browser">
              {projectMedia.map(media => (
                <MediaCard key={media.id} media={media} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**⚠️ 注意点**:
- `useMediaStore()` は T038 で実装するため、先にストアを作成すること
- `media-browser` クラスは `globals.css` で定義済み
- Server Component内で使わないこと（'use client'必須）

---

### Task T034: MediaUpload Component

**ファイル**: `features/media/components/MediaUpload.tsx`

**要件**:
- ドラッグ&ドロップエリア
- クリックでファイル選択
- 複数ファイル対応
- 進捗表示（shadcn/ui Progress）
- アップロード中は操作不可
- エラーハンドリング（toast）

**omniclip参照**: `vendor/omniclip/s/components/omni-media/parts/file-input.ts`

**実装サンプル**:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone' // npm install react-dropzone
import { Progress } from '@/components/ui/progress'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload'
import { 
  SUPPORTED_VIDEO_TYPES, 
  SUPPORTED_AUDIO_TYPES, 
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE 
} from '@/types/media'

interface MediaUploadProps {
  projectId: string
}

export function MediaUpload({ projectId }: MediaUploadProps) {
  const { uploadFiles, isUploading, progress } = useMediaUpload(projectId)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // ファイルサイズチェック
    const oversized = acceptedFiles.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      toast.error('File too large', {
        description: `Maximum file size is 500MB`
      })
      return
    }

    try {
      await uploadFiles(acceptedFiles)
      toast.success('Upload complete', {
        description: `${acceptedFiles.length} file(s) uploaded`
      })
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [uploadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': SUPPORTED_VIDEO_TYPES,
      'audio/*': SUPPORTED_AUDIO_TYPES,
      'image/*': SUPPORTED_IMAGE_TYPES,
    },
    disabled: isUploading,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
      `}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Uploading...</p>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here' : 'Drag and drop files'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to select files
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports video, audio, and images up to 500MB
          </p>
        </div>
      )}
    </div>
  )
}
```

**⚠️ CRITICAL注意点**:
1. `react-dropzone` をインストール: `npm install react-dropzone`
2. `useMediaUpload` フック（後述）が必須
3. ファイルハッシュチェック（T036）をアップロード前に実行
4. 進捗は各ファイルごとではなく全体の平均値

---

### Task T035: Media Server Actions

**ファイル**: `app/actions/media.ts`

**要件**:
- uploadMedia: ファイルアップロード + DB登録
- getMediaFiles: プロジェクトのメディア一覧
- deleteMedia: メディア削除
- ファイルハッシュによる重複チェック

**⚠️ CRITICAL**: この実装でハッシュ重複排除を必ず実装すること（FR-012）

**実装サンプル**:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadMediaFile, deleteMediaFile } from '@/lib/supabase/utils'
import { revalidatePath } from 'next/cache'
import { MediaFile } from '@/types/media'

/**
 * Upload media file with deduplication check
 * Returns existing file if hash matches
 */
export async function uploadMedia(
  projectId: string,
  file: File,
  fileHash: string,
  metadata: Record<string, unknown>
): Promise<MediaFile> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 🚨 CRITICAL: ハッシュで重複チェック（FR-012）
  const { data: existing } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user.id)
    .eq('file_hash', fileHash)
    .single()

  if (existing) {
    console.log('File already exists, reusing:', existing.id)
    return existing as MediaFile
  }

  // 新規アップロード
  const storagePath = await uploadMediaFile(file, user.id, projectId)

  const { data, error } = await supabase
    .from('media_files')
    .insert({
      user_id: user.id,
      file_hash: fileHash,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      metadata: metadata as any,
    })
    .select()
    .single()

  if (error) {
    console.error('Insert media error:', error)
    throw new Error(error.message)
  }

  revalidatePath(`/editor/${projectId}`)
  return data as MediaFile
}

export async function getMediaFiles(projectId: string): Promise<MediaFile[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // media_filesテーブルから取得（project_idカラムはない）
  // effectsテーブルで使用されているmedia_file_idから逆引き
  // または、user_idでフィルタして全メディアを返す
  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get media files error:', error)
    throw new Error(error.message)
  }

  return data as MediaFile[]
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // メディアファイル情報取得
  const { data: media } = await supabase
    .from('media_files')
    .select('storage_path')
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (!media) throw new Error('Media not found')

  // Storageから削除
  await deleteMediaFile(media.storage_path)

  // DBから削除
  const { error } = await supabase
    .from('media_files')
    .delete()
    .eq('id', mediaId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete media error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/editor')
}
```

**⚠️ 注意点**:
1. `media_files` テーブルには `project_id` カラムがない（ユーザー共通）
2. ハッシュ重複チェックは**必須**（FR-012 compliance）
3. `file_hash` は T036 で計算してクライアントから渡される

---

### Task T036: File Hash Calculation

**ファイル**: `features/media/utils/hash.ts`

**要件**:
- SHA-256ハッシュ計算
- Web Crypto API使用
- 大容量ファイル対応（チャンク処理）

**omniclip参照**: `vendor/omniclip/s/context/controllers/media/parts/file-hasher.ts`

**実装サンプル**:

```typescript
/**
 * Calculate SHA-256 hash of a file
 * Uses Web Crypto API for security and performance
 * @param file File to hash
 * @returns Promise<string> Hex-encoded hash
 */
export async function calculateFileHash(file: File): Promise<string> {
  const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB chunks
  const chunks = Math.ceil(file.size / CHUNK_SIZE)
  const hashBuffer: ArrayBuffer[] = []

  // Read file in chunks to avoid memory issues
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    const arrayBuffer = await chunk.arrayBuffer()
    hashBuffer.push(arrayBuffer)
  }

  // Concatenate all chunks
  const concatenated = new Uint8Array(
    hashBuffer.reduce((acc, buf) => acc + buf.byteLength, 0)
  )
  let offset = 0
  for (const buf of hashBuffer) {
    concatenated.set(new Uint8Array(buf), offset)
    offset += buf.byteLength
  }

  // Calculate SHA-256 hash
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', concatenated)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashArrayBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Calculate hash for multiple files
 * @param files Array of files
 * @returns Promise<Map<File, string>> Map of file to hash
 */
export async function calculateFileHashes(
  files: File[]
): Promise<Map<File, string>> {
  const hashes = new Map<File, string>()
  
  for (const file of files) {
    const hash = await calculateFileHash(file)
    hashes.set(file, hash)
  }
  
  return hashes
}
```

**⚠️ CRITICAL注意点**:
1. 大容量ファイル（500MB）でメモリオーバーフローしないようチャンク処理必須
2. Web Crypto APIはHTTPSまたはlocalhostでのみ動作
3. Node.js環境では動かない（クライアント側でのみ実行）

---

### Task T046: Metadata Extraction

**ファイル**: `features/media/utils/metadata.ts`

**要件**:
- ビデオ: duration, fps, width, height, codec
- オーディオ: duration, bitrate, channels, sampleRate, codec
- 画像: width, height, format

**実装サンプル**:

```typescript
import { VideoMetadata, AudioMetadata, ImageMetadata, MediaType, getMediaType } from '@/types/media'

/**
 * Extract metadata from video file
 */
async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        fps: 30, // ⚠️ Actual FPS detection requires more complex logic
        frames: Math.floor(video.duration * 30),
        width: video.videoWidth,
        height: video.videoHeight,
        codec: 'unknown', // Requires MediaInfo.js or similar
        thumbnail: '', // Generated separately
      }
      
      URL.revokeObjectURL(video.src)
      resolve(metadata)
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }
    
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from audio file
 */
async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    
    audio.onloadedmetadata = () => {
      const metadata: AudioMetadata = {
        duration: audio.duration,
        bitrate: 128000, // Requires MediaInfo.js for accurate detection
        channels: 2, // Requires MediaInfo.js
        sampleRate: 48000, // Requires MediaInfo.js
        codec: 'unknown',
      }
      
      URL.revokeObjectURL(audio.src)
      resolve(metadata)
    }
    
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src)
      reject(new Error('Failed to load audio metadata'))
    }
    
    audio.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from image file
 */
async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        format: file.type.split('/')[1] || 'unknown',
      }
      
      URL.revokeObjectURL(img.src)
      resolve(metadata)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image metadata'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from any supported media file
 */
export async function extractMetadata(file: File): Promise<VideoMetadata | AudioMetadata | ImageMetadata> {
  const mediaType = getMediaType(file.type)
  
  switch (mediaType) {
    case 'video':
      return extractVideoMetadata(file)
    case 'audio':
      return extractAudioMetadata(file)
    case 'image':
      return extractImageMetadata(file)
    default:
      throw new Error(`Unsupported media type: ${file.type}`)
  }
}
```

**⚠️ 注意点**:
1. 正確なFPS/bitrate/codecにはMediaInfo.jsが必要（Phase 4では概算値でOK）
2. サムネイル生成は別タスク
3. メモリリーク防止のため必ずrevokeObjectURL()を呼ぶ

---

### Task T038: Media Store

**ファイル**: `stores/media.ts`

**要件**:
- メディアファイル一覧管理
- アップロード進捗管理
- 選択状態管理
- Zustand + devtools

**実装サンプル**:

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { MediaFile } from '@/types/media'

export interface MediaStore {
  // State
  mediaFiles: MediaFile[]
  isLoading: boolean
  uploadProgress: number
  selectedMediaIds: string[]
  
  // Actions
  setMediaFiles: (files: MediaFile[]) => void
  addMediaFile: (file: MediaFile) => void
  removeMediaFile: (id: string) => void
  setLoading: (loading: boolean) => void
  setUploadProgress: (progress: number) => void
  toggleMediaSelection: (id: string) => void
  clearSelection: () => void
}

export const useMediaStore = create<MediaStore>()(
  devtools(
    (set) => ({
      // Initial state
      mediaFiles: [],
      isLoading: false,
      uploadProgress: 0,
      selectedMediaIds: [],
      
      // Actions
      setMediaFiles: (files) => set({ mediaFiles: files }),
      
      addMediaFile: (file) => set((state) => ({
        mediaFiles: [file, ...state.mediaFiles]
      })),
      
      removeMediaFile: (id) => set((state) => ({
        mediaFiles: state.mediaFiles.filter(f => f.id !== id),
        selectedMediaIds: state.selectedMediaIds.filter(sid => sid !== id)
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      
      toggleMediaSelection: (id) => set((state) => ({
        selectedMediaIds: state.selectedMediaIds.includes(id)
          ? state.selectedMediaIds.filter(sid => sid !== id)
          : [...state.selectedMediaIds, id]
      })),
      
      clearSelection: () => set({ selectedMediaIds: [] }),
    }),
    { name: 'media-store' }
  )
)
```

---

### Task T042: Effect Placement Logic (🚨 MOST CRITICAL)

**ファイル**: `features/timeline/utils/placement.ts`

**要件**:
- omniclipの `EffectPlacementProposal` ロジックを正確に移植
- エフェクトの重なり検出
- 自動調整（縮小、前方プッシュ）
- スナップ処理

**omniclip参照**: 
- `vendor/omniclip/s/context/controllers/timeline/parts/effect-placement-proposal.ts`
- `vendor/omniclip/s/context/controllers/timeline/parts/effect-placement-utilities.ts`

**⚠️ CRITICAL**: このロジックはomniclipから**正確に**移植すること

**実装サンプル**:

```typescript
import { Effect } from '@/types/effects'

/**
 * Proposed placement result
 */
export interface ProposedTimecode {
  proposed_place: {
    start_at_position: number
    track: number
  }
  duration?: number  // Shrunk duration if collision
  effects_to_push?: Effect[]  // Effects to push forward
}

/**
 * Effect placement utilities (from omniclip)
 */
class EffectPlacementUtilities {
  /**
   * Get all effects before a timeline position
   */
  getEffectsBefore(effects: Effect[], timelineStart: number): Effect[] {
    return effects
      .filter(effect => effect.start_at_position < timelineStart)
      .sort((a, b) => b.start_at_position - a.start_at_position)
  }

  /**
   * Get all effects after a timeline position
   */
  getEffectsAfter(effects: Effect[], timelineStart: number): Effect[] {
    return effects
      .filter(effect => effect.start_at_position > timelineStart)
      .sort((a, b) => a.start_at_position - b.start_at_position)
  }

  /**
   * Calculate space between two effects
   */
  calculateSpaceBetween(effectBefore: Effect, effectAfter: Effect): number {
    const effectBeforeEnd = effectBefore.start_at_position + effectBefore.duration
    return effectAfter.start_at_position - effectBeforeEnd
  }

  /**
   * Round position to nearest frame
   */
  roundToNearestFrame(position: number, fps: number): number {
    const frameTime = 1000 / fps
    return Math.round(position / frameTime) * frameTime
  }
}

/**
 * Calculate proposed position for effect placement
 * Ported from omniclip EffectPlacementProposal
 */
export function calculateProposedTimecode(
  effect: Effect,
  targetPosition: number,
  targetTrack: number,
  existingEffects: Effect[]
): ProposedTimecode {
  const utilities = new EffectPlacementUtilities()
  
  // Filter effects on the same track
  const trackEffects = existingEffects.filter(e => e.track === targetTrack && e.id !== effect.id)
  
  const effectBefore = utilities.getEffectsBefore(trackEffects, targetPosition)[0]
  const effectAfter = utilities.getEffectsAfter(trackEffects, targetPosition)[0]
  
  let proposedStartPosition = targetPosition
  let shrinkedDuration: number | undefined
  let effectsToPush: Effect[] | undefined

  // Check for collisions
  if (effectBefore && effectAfter) {
    const spaceBetween = utilities.calculateSpaceBetween(effectBefore, effectAfter)
    
    if (spaceBetween < effect.duration && spaceBetween > 0) {
      // Shrink effect to fit
      shrinkedDuration = spaceBetween
      proposedStartPosition = effectBefore.start_at_position + effectBefore.duration
    } else if (spaceBetween === 0) {
      // Push effects forward
      effectsToPush = utilities.getEffectsAfter(trackEffects, targetPosition)
      proposedStartPosition = effectBefore.start_at_position + effectBefore.duration
    }
  } else if (effectBefore) {
    const effectBeforeEnd = effectBefore.start_at_position + effectBefore.duration
    if (targetPosition < effectBeforeEnd) {
      // Snap to end of previous effect
      proposedStartPosition = effectBeforeEnd
    }
  } else if (effectAfter) {
    const proposedEnd = targetPosition + effect.duration
    if (proposedEnd > effectAfter.start_at_position) {
      // Shrink to fit before next effect
      shrinkedDuration = effectAfter.start_at_position - targetPosition
    }
  }

  return {
    proposed_place: {
      start_at_position: proposedStartPosition,
      track: targetTrack,
    },
    duration: shrinkedDuration,
    effects_to_push: effectsToPush,
  }
}

/**
 * Find empty position for new effect
 * Places after last effect on the closest track
 */
export function findPlaceForNewEffect(
  effects: Effect[],
  trackCount: number
): { position: number; track: number } {
  let closestPosition = 0
  let track = 0

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
    const trackEffects = effects.filter(e => e.track === trackIndex)
    const lastEffect = trackEffects[trackEffects.length - 1]
    
    if (lastEffect) {
      const newPosition = lastEffect.start_at_position + lastEffect.duration
      if (closestPosition === 0 || newPosition < closestPosition) {
        closestPosition = newPosition
        track = trackIndex
      }
    } else {
      // Empty track found
      return { position: 0, track: trackIndex }
    }
  }

  return { position: closestPosition, track }
}
```

**⚠️ CRITICAL注意点**:
1. omniclipのロジックを**そのまま**移植すること（独自改良は危険）
2. ミリ秒単位で計算（omniclipと同様）
3. `effectsToPush` が返された場合は、全エフェクトの位置を更新する処理が必要

---

### Task T044: Timeline Store

**ファイル**: `stores/timeline.ts`

**要件**:
- エフェクト一覧管理
- 現在時刻（タイムコード）管理
- 再生状態管理
- ズームレベル管理

**実装サンプル**:

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Effect } from '@/types/effects'

export interface TimelineStore {
  // State
  effects: Effect[]
  currentTime: number  // milliseconds
  duration: number     // milliseconds
  isPlaying: boolean
  zoom: number         // pixels per second
  trackCount: number
  
  // Actions
  setEffects: (effects: Effect[]) => void
  addEffect: (effect: Effect) => void
  updateEffect: (id: string, updates: Partial<Effect>) => void
  removeEffect: (id: string) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setZoom: (zoom: number) => void
  setTrackCount: (count: number) => void
}

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    (set) => ({
      // Initial state
      effects: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      zoom: 100,  // 100px = 1 second
      trackCount: 3,
      
      // Actions
      setEffects: (effects) => set({ effects }),
      
      addEffect: (effect) => set((state) => ({
        effects: [...state.effects, effect],
        duration: Math.max(
          state.duration,
          effect.start_at_position + effect.duration
        )
      })),
      
      updateEffect: (id, updates) => set((state) => ({
        effects: state.effects.map(e =>
          e.id === id ? { ...e, ...updates } : e
        )
      })),
      
      removeEffect: (id) => set((state) => ({
        effects: state.effects.filter(e => e.id !== id)
      })),
      
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setZoom: (zoom) => set({ zoom }),
      setTrackCount: (count) => set({ trackCount: count }),
    }),
    { name: 'timeline-store' }
  )
)
```

---

## 🧪 テスト実装（必須）

Phase 4では**最低30%のテストカバレッジ**を確保すること。

### `tests/unit/media.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateFileHash } from '@/features/media/utils/hash'

describe('File Hash Calculation', () => {
  it('should generate consistent hash for same file', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const hash1 = await calculateFileHash(file)
    const hash2 = await calculateFileHash(file)
    
    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different files', async () => {
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' })
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' })
    
    const hash1 = await calculateFileHash(file1)
    const hash2 = await calculateFileHash(file2)
    
    expect(hash1).not.toBe(hash2)
  })
})
```

### `tests/unit/timeline.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { calculateProposedTimecode, findPlaceForNewEffect } from '@/features/timeline/utils/placement'
import { Effect } from '@/types/effects'

describe('Timeline Placement Logic', () => {
  it('should place effect at target position when no collision', () => {
    const effect: Effect = {
      id: '1',
      kind: 'video',
      track: 0,
      start_at_position: 0,
      duration: 1000,
      start_time: 0,
      end_time: 1000,
    } as Effect

    const result = calculateProposedTimecode(effect, 2000, 0, [])
    
    expect(result.proposed_place.start_at_position).toBe(2000)
    expect(result.proposed_place.track).toBe(0)
  })

  it('should shrink effect when space is limited', () => {
    const existingEffect: Effect = {
      id: '2',
      kind: 'video',
      track: 0,
      start_at_position: 0,
      duration: 1000,
      start_time: 0,
      end_time: 1000,
    } as Effect

    const nextEffect: Effect = {
      id: '3',
      kind: 'video',
      track: 0,
      start_at_position: 1500,
      duration: 1000,
      start_time: 0,
      end_time: 1000,
    } as Effect

    const newEffect: Effect = {
      id: '1',
      kind: 'video',
      track: 0,
      start_at_position: 0,
      duration: 1000,
      start_time: 0,
      end_time: 1000,
    } as Effect

    const result = calculateProposedTimecode(
      newEffect,
      1000,
      0,
      [existingEffect, nextEffect]
    )
    
    expect(result.duration).toBe(500) // Shrunk to fit
  })
})
```

---

## ⚠️ 実装時の重要注意事項

### 1. 絶対にやってはいけないこと

- ❌ omniclipのロジックを「理解したつもり」で独自実装
- ❌ Effect型の `file_hash`, `name`, `thumbnail` を省略
- ❌ ハッシュ重複チェックをスキップ
- ❌ テストを書かない
- ❌ TypeScript型エラーを無視
- ❌ Server ActionsをClient Componentで直接import

### 2. 必ずやるべきこと

- ✅ Effect型修正（T000）を**最初に**完了
- ✅ omniclipコードを**読んでから**実装
- ✅ ファイルハッシュによる重複排除を実装（FR-012）
- ✅ 各タスク完了後に `npx tsc --noEmit` 実行
- ✅ 最低30%のテストカバレッジ確保
- ✅ 各機能のマニュアルテスト実施

### 3. コミット戦略

```bash
# T000: Effect型修正
git commit -m "fix: Add missing omniclip fields to Effect types (file_hash, name, thumbnail)"

# T033-T037: Media機能
git commit -m "feat(media): Implement media library and upload with deduplication"

# T038: Media Store
git commit -m "feat(media): Add Zustand media store"

# T039-T044: Timeline機能
git commit -m "feat(timeline): Implement timeline with omniclip placement logic"

# Tests
git commit -m "test: Add media and timeline unit tests"
```

---

## 📊 Phase 4 完了チェックリスト

実装完了後、以下をすべて確認:

### 型チェック
```bash
[ ] npx tsc --noEmit - エラー0件
[ ] Effect型にfile_hash, name, thumbnailがある
[ ] MediaFile型とEffect型が正しく連携
```

### 機能テスト
```bash
[ ] ファイルをドラッグ&ドロップでアップロード可能
[ ] アップロード進捗が表示される
[ ] 同じファイルを再アップロード → 重複排除される
[ ] メディアライブラリに表示される
[ ] メディアをクリックで選択可能
[ ] メディアをタイムラインにドラッグ可能
[ ] タイムライン上でエフェクトが表示される
[ ] エフェクトの重なりが自動調整される
[ ] エフェクトを削除可能
```

### データベース確認
```sql
-- 同じファイルのfile_hashが一致
SELECT file_hash, filename, COUNT(*) 
FROM media_files 
GROUP BY file_hash, filename 
HAVING COUNT(*) > 1;
-- → 結果0件（重複なし）

-- Effectがmedia_fileに正しくリンク
SELECT e.id, e.kind, m.filename 
FROM effects e 
LEFT JOIN media_files m ON e.media_file_id = m.id 
WHERE e.media_file_id IS NOT NULL
LIMIT 5;
```

### テストカバレッジ
```bash
[ ] npm run test で全テストパス
[ ] カバレッジ30%以上
[ ] hash計算のテスト存在
[ ] placement logicのテスト存在
```

---

## 🎯 成功基準

Phase 4は以下の状態で「完了」:

1. ✅ ユーザーがビデオファイルをドラッグ&ドロップでアップロードできる
2. ✅ 同じファイルは2回アップロードされない（ハッシュチェック）
3. ✅ メディアライブラリに全アップロードファイルが表示される
4. ✅ メディアをタイムラインにドラッグすると、適切な位置に配置される
5. ✅ エフェクトが重なる場合、自動で調整される（omniclipロジック）
6. ✅ TypeScript型エラー0件
7. ✅ テストカバレッジ30%以上
8. ✅ すべての機能が実際に動作する

---

## 📚 参考資料

### omniclip参照ファイル（必読）

```
vendor/omniclip/s/
├── context/
│   ├── types.ts                                    # Effect型定義
│   └── controllers/
│       ├── media/
│       │   └── controller.ts                       # メディア管理
│       └── timeline/
│           ├── controller.ts                       # タイムライン管理
│           └── parts/
│               ├── effect-placement-proposal.ts    # 🚨 CRITICAL: 配置ロジック
│               └── effect-placement-utilities.ts   # ユーティリティ
└── components/
    └── omni-media/
        ├── omni-media.ts                          # メディアライブラリUI
        └── parts/
            └── file-input.ts                       # ファイル入力
```

### ProEdit仕様書

- `specs/001-proedit-mvp-browser/spec.md` - 要件定義
- `specs/001-proedit-mvp-browser/tasks.md` - タスク詳細
- `specs/001-proedit-mvp-browser/data-model.md` - DB設計

---

## 🆘 質問・確認事項

実装中に不明点があれば、以下を確認:

1. **Effect型について** → `types/effects.ts` と `vendor/omniclip/s/context/types.ts` を比較
2. **配置ロジック** → `vendor/omniclip/s/context/controllers/timeline/parts/` を参照
3. **DB操作** → `app/actions/projects.ts` の実装パターンを参照
4. **ストア設計** → `stores/project.ts` の実装パターンを参照

---

**Phase 4実装開始！頑張ってください！** 🚀

**最終更新**: 2025-10-14  
**作成者**: ProEdit Technical Lead  
**対象フェーズ**: Phase 4 (T033-T046)

