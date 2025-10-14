# Phase 5 実装指示書 - Real-time Preview and Playback

> **対象**: 開発チーム  
> **開始条件**: Phase 4完了（100%）✅  
> **推定時間**: 10-12時間  
> **重要度**: 🚨 CRITICAL - MVPコア機能  
> **omniclip参照**: `/vendor/omniclip/s/context/controllers/compositor/`

---

## 📊 Phase 5概要

### **目標**

ユーザーがタイムライン上のメディアを**リアルタイムで60fpsプレビュー**できる機能を実装します。

### **主要機能**

1. ✅ PIXI.jsキャンバスでの高速レンダリング
2. ✅ ビデオ/画像/オーディオの同期再生
3. ✅ Play/Pause/Seekコントロール
4. ✅ タイムラインルーラーとプレイヘッド
5. ✅ 60fps安定再生
6. ✅ FPSカウンター

---

## 📋 実装タスク（12タスク）

### **Phase 5: User Story 3 - Real-time Preview and Playback**

| タスクID | タスク名             | 推定時間 | 優先度 | omniclip参照                   |
|-------|-------------------|--------|--------|--------------------------------|
| T047  | PIXI.js Canvas    | 1時間    | P0     | compositor/controller.ts:37    |
| T048  | PIXI.js App Init  | 1時間    | P0     | compositor/controller.ts:47-85 |
| T049  | PlaybackControls  | 1時間    | P1     | - (新規UI)                     |
| T050  | VideoManager      | 2時間    | P0     | parts/video-manager.ts         |
| T051  | ImageManager      | 1.5時間  | P0     | parts/image-manager.ts         |
| T052  | Playback Loop     | 2時間    | P0     | controller.ts:87-98            |
| T053  | Compositor Store  | 1時間    | P1     | - (Zustand)                    |
| T054  | TimelineRuler     | 1.5時間  | P1     | - (新規UI)                     |
| T055  | PlayheadIndicator | 1時間    | P1     | - (新規UI)                     |
| T056  | Compositing Logic | 2時間    | P0     | controller.ts:157-227          |
| T057  | FPSCounter        | 0.5時間  | P2     | - (新規UI)                     |
| T058  | Timeline Sync     | 1.5時間  | P0     | - (統合)                       |

**総推定時間**: 16時間（並列実施で10-12時間）

---

## 🎯 実装手順（優先順位順）

### **Step 1: Compositor Store作成（T053）** ⚠️ 最初に実装

**時間**: 1時間  
**ファイル**: `stores/compositor.ts`  
**理由**: 他のコンポーネントが依存するため最初に実装

**実装内容**:

```typescript
'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CompositorState {
  // Playback state
  isPlaying: boolean
  timecode: number // Current position in ms
  duration: number // Total timeline duration in ms
  fps: number // Frames per second (from project settings)
  
  // Performance
  actualFps: number // Measured FPS for monitoring
  
  // Canvas state
  canvasReady: boolean
  
  // Actions
  setPlaying: (playing: boolean) => void
  setTimecode: (timecode: number) => void
  setDuration: (duration: number) => void
  setFps: (fps: number) => void
  setActualFps: (fps: number) => void
  setCanvasReady: (ready: boolean) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (timecode: number) => void
  togglePlayPause: () => void
}

export const useCompositorStore = create<CompositorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      timecode: 0,
      duration: 0,
      fps: 30,
      actualFps: 0,
      canvasReady: false,
      
      // Actions
      setPlaying: (playing) => set({ isPlaying: playing }),
      setTimecode: (timecode) => set({ timecode }),
      setDuration: (duration) => set({ duration }),
      setFps: (fps) => set({ fps }),
      setActualFps: (fps) => set({ actualFps: fps }),
      setCanvasReady: (ready) => set({ canvasReady: ready }),
      
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      stop: () => set({ isPlaying: false, timecode: 0 }),
      
      seek: (timecode) => {
        const { duration } = get()
        const clampedTimecode = Math.max(0, Math.min(timecode, duration))
        set({ timecode: clampedTimecode })
      },
      
      togglePlayPause: () => {
        const { isPlaying } = get()
        set({ isPlaying: !isPlaying })
      },
    }),
    { name: 'compositor-store' }
  )
)
```

**検証**:
```bash
npx tsc --noEmit
# エラーがないことを確認
```

---

### **Step 2: PIXI.js Canvas Wrapper作成（T047）**

**時間**: 1時間  
**ファイル**: `features/compositor/components/Canvas.tsx`  
**omniclip参照**: `compositor/controller.ts:37`

**実装内容**:

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useCompositorStore } from '@/stores/compositor'
import { toast } from 'sonner'

interface CanvasProps {
  width: number
  height: number
  onAppReady?: (app: PIXI.Application) => void
}

export function Canvas({ width, height, onAppReady }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const [isReady, setIsReady] = useState(false)
  const { setCanvasReady } = useCompositorStore()

  useEffect(() => {
    if (!containerRef.current || appRef.current) return

    // Initialize PIXI Application (from omniclip:37)
    const app = new PIXI.Application()
    
    app.init({
      width,
      height,
      backgroundColor: 0x000000, // Black background
      antialias: true,
      preference: 'webgl',
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      if (!containerRef.current) return

      // Append canvas to container
      containerRef.current.appendChild(app.canvas)

      // Configure stage (from omniclip:49-50)
      app.stage.sortableChildren = true
      app.stage.interactive = true
      app.stage.hitArea = app.screen

      // Store app reference
      appRef.current = app
      setIsReady(true)
      setCanvasReady(true)

      // Notify parent
      if (onAppReady) {
        onAppReady(app)
      }

      toast.success('Canvas initialized', {
        description: `${width}x${height} @ ${Math.round(app.renderer.fps || 60)}fps`
      })
    }).catch((error) => {
      console.error('Failed to initialize PIXI:', error)
      toast.error('Failed to initialize canvas', {
        description: error.message
      })
    })

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
        setCanvasReady(false)
      }
    }
  }, [width, height])

  return (
    <div
      ref={containerRef}
      className="canvas-container relative bg-black rounded-lg overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60">Initializing canvas...</div>
        </div>
      )}
    </div>
  )
}
```

**ディレクトリ作成**:
```bash
mkdir -p features/compositor/components
mkdir -p features/compositor/managers
mkdir -p features/compositor/utils
```

---

### **Step 3: VideoManager実装（T050）** 🎯 最重要

**時間**: 2時間  
**ファイル**: `features/compositor/managers/VideoManager.ts`  
**omniclip参照**: `parts/video-manager.ts` (183行)

**実装内容**:

```typescript
import * as PIXI from 'pixi.js'
import { VideoEffect } from '@/types/effects'

/**
 * VideoManager - Manages video effects on PIXI canvas
 * Ported from omniclip: /s/context/controllers/compositor/parts/video-manager.ts
 */
export class VideoManager {
  // Map of video effect ID to PIXI sprite and video element
  private videos = new Map<string, {
    sprite: PIXI.Sprite
    element: HTMLVideoElement
    texture: PIXI.Texture
  }>()

  constructor(
    private app: PIXI.Application,
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {}

  /**
   * Add video effect to canvas
   * Ported from omniclip:54-100
   */
  async addVideo(effect: VideoEffect): Promise<void> {
    try {
      // Get video file URL from storage
      const fileUrl = await this.getMediaFileUrl(effect.media_file_id)

      // Create video element (omniclip:55-57)
      const element = document.createElement('video')
      element.src = fileUrl
      element.preload = 'auto'
      element.crossOrigin = 'anonymous'
      element.width = effect.properties.rect.width
      element.height = effect.properties.rect.height

      // Create PIXI texture from video (omniclip:60-62)
      const texture = PIXI.Texture.from(element)
      texture.source.autoPlay = false

      // Create sprite (omniclip:63-73)
      const sprite = new PIXI.Sprite(texture)
      sprite.pivot.set(effect.properties.rect.pivot.x, effect.properties.rect.pivot.y)
      sprite.x = effect.properties.rect.position_on_canvas.x
      sprite.y = effect.properties.rect.position_on_canvas.y
      sprite.scale.set(effect.properties.rect.scaleX, effect.properties.rect.scaleY)
      sprite.rotation = effect.properties.rect.rotation * (Math.PI / 180)
      sprite.width = effect.properties.rect.width
      sprite.height = effect.properties.rect.height
      sprite.eventMode = 'static'
      sprite.cursor = 'pointer'

      // Store reference
      this.videos.set(effect.id, { sprite, element, texture })

      console.log(`VideoManager: Added video effect ${effect.id}`)
    } catch (error) {
      console.error(`VideoManager: Failed to add video ${effect.id}:`, error)
      throw error
    }
  }

  /**
   * Add video sprite to canvas stage
   * Ported from omniclip:102-109
   */
  addToStage(effectId: string, track: number, trackCount: number): void {
    const video = this.videos.get(effectId)
    if (!video) return

    // Set z-index based on track (higher track = higher z-index)
    video.sprite.zIndex = trackCount - track

    this.app.stage.addChild(video.sprite)
    console.log(`VideoManager: Added to stage ${effectId} (track ${track}, zIndex ${video.sprite.zIndex})`)
  }

  /**
   * Remove video sprite from canvas stage
   */
  removeFromStage(effectId: string): void {
    const video = this.videos.get(effectId)
    if (!video) return

    this.app.stage.removeChild(video.sprite)
    console.log(`VideoManager: Removed from stage ${effectId}`)
  }

  /**
   * Update video element current time based on timecode
   * Ported from omniclip:216-225
   */
  async seek(effectId: string, effect: VideoEffect, timecode: number): Promise<void> {
    const video = this.videos.get(effectId)
    if (!video) return

    // Calculate current time relative to effect (omniclip:165-167)
    const currentTime = (timecode - effect.start_at_position + effect.start) / 1000
    
    if (currentTime >= 0 && currentTime <= effect.properties.raw_duration / 1000) {
      video.element.currentTime = currentTime

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.element.removeEventListener('seeked', onSeeked)
          resolve()
        }
        video.element.addEventListener('seeked', onSeeked)
      })
    }
  }

  /**
   * Play video element
   * Ported from omniclip:75-76, 219
   */
  async play(effectId: string): Promise<void> {
    const video = this.videos.get(effectId)
    if (!video) return

    if (video.element.paused) {
      await video.element.play().catch(error => {
        console.warn(`VideoManager: Play failed for ${effectId}:`, error)
      })
    }
  }

  /**
   * Pause video element
   */
  pause(effectId: string): void {
    const video = this.videos.get(effectId)
    if (!video) return

    if (!video.element.paused) {
      video.element.pause()
    }
  }

  /**
   * Play all videos
   * Ported from omniclip video-manager (play_videos method)
   */
  async playAll(effectIds: string[]): Promise<void> {
    await Promise.all(
      effectIds.map(id => this.play(id))
    )
  }

  /**
   * Pause all videos
   */
  pauseAll(effectIds: string[]): void {
    effectIds.forEach(id => this.pause(id))
  }

  /**
   * Remove video effect
   */
  remove(effectId: string): void {
    const video = this.videos.get(effectId)
    if (!video) return

    // Remove from stage
    this.removeFromStage(effectId)

    // Cleanup
    video.element.pause()
    video.element.src = ''
    video.texture.destroy(true)

    this.videos.delete(effectId)
    console.log(`VideoManager: Removed video ${effectId}`)
  }

  /**
   * Cleanup all videos
   */
  destroy(): void {
    this.videos.forEach((_, id) => this.remove(id))
    this.videos.clear()
  }

  /**
   * Get video sprite for external use
   */
  getSprite(effectId: string): PIXI.Sprite | undefined {
    return this.videos.get(effectId)?.sprite
  }

  /**
   * Check if video is loaded and ready
   */
  isReady(effectId: string): boolean {
    const video = this.videos.get(effectId)
    return video !== undefined && video.element.readyState >= 2 // HAVE_CURRENT_DATA
  }
}
```

**エクスポート**:
```typescript
// features/compositor/managers/index.ts
export { VideoManager } from './VideoManager'
export { ImageManager } from './ImageManager'
export { AudioManager } from './AudioManager'
```

---

### **Step 4: ImageManager実装（T051）**

**時間**: 1.5時間  
**ファイル**: `features/compositor/managers/ImageManager.ts`  
**omniclip参照**: `parts/image-manager.ts` (98行)

**実装内容**:

```typescript
import * as PIXI from 'pixi.js'
import { ImageEffect } from '@/types/effects'

/**
 * ImageManager - Manages image effects on PIXI canvas
 * Ported from omniclip: /s/context/controllers/compositor/parts/image-manager.ts
 */
export class ImageManager {
  private images = new Map<string, {
    sprite: PIXI.Sprite
    texture: PIXI.Texture
  }>()

  constructor(
    private app: PIXI.Application,
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {}

  /**
   * Add image effect to canvas
   * Ported from omniclip:45-80
   */
  async addImage(effect: ImageEffect): Promise<void> {
    try {
      const fileUrl = await this.getMediaFileUrl(effect.media_file_id)

      // Load texture (omniclip:47)
      const texture = await PIXI.Assets.load(fileUrl)

      // Create sprite (omniclip:48-56)
      const sprite = new PIXI.Sprite(texture)
      sprite.x = effect.properties.rect.position_on_canvas.x
      sprite.y = effect.properties.rect.position_on_canvas.y
      sprite.scale.set(effect.properties.rect.scaleX, effect.properties.rect.scaleY)
      sprite.rotation = effect.properties.rect.rotation * (Math.PI / 180)
      sprite.pivot.set(effect.properties.rect.pivot.x, effect.properties.rect.pivot.y)
      sprite.eventMode = 'static'
      sprite.cursor = 'pointer'

      this.images.set(effect.id, { sprite, texture })

      console.log(`ImageManager: Added image effect ${effect.id}`)
    } catch (error) {
      console.error(`ImageManager: Failed to add image ${effect.id}:`, error)
      throw error
    }
  }

  addToStage(effectId: string, track: number, trackCount: number): void {
    const image = this.images.get(effectId)
    if (!image) return

    image.sprite.zIndex = trackCount - track
    this.app.stage.addChild(image.sprite)
  }

  removeFromStage(effectId: string): void {
    const image = this.images.get(effectId)
    if (!image) return

    this.app.stage.removeChild(image.sprite)
  }

  remove(effectId: string): void {
    const image = this.images.get(effectId)
    if (!image) return

    this.removeFromStage(effectId)
    image.texture.destroy(true)
    this.images.delete(effectId)
  }

  destroy(): void {
    this.images.forEach((_, id) => this.remove(id))
    this.images.clear()
  }

  getSprite(effectId: string): PIXI.Sprite | undefined {
    return this.images.get(effectId)?.sprite
  }
}
```

---

### **Step 5: AudioManager実装**

**時間**: 1時間  
**ファイル**: `features/compositor/managers/AudioManager.ts`  
**omniclip参照**: `parts/audio-manager.ts` (82行)

**実装内容**:

```typescript
import { AudioEffect } from '@/types/effects'

/**
 * AudioManager - Manages audio effects playback
 * Ported from omniclip: /s/context/controllers/compositor/parts/audio-manager.ts
 */
export class AudioManager {
  private audios = new Map<string, HTMLAudioElement>()

  constructor(
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {}

  /**
   * Add audio effect
   * Ported from omniclip:37-46
   */
  async addAudio(effect: AudioEffect): Promise<void> {
    try {
      const fileUrl = await this.getMediaFileUrl(effect.media_file_id)

      // Create audio element (omniclip:38-42)
      const audio = document.createElement('audio')
      const source = document.createElement('source')
      source.src = fileUrl
      audio.appendChild(source)
      audio.volume = effect.properties.volume
      audio.muted = effect.properties.muted

      this.audios.set(effect.id, audio)

      console.log(`AudioManager: Added audio effect ${effect.id}`)
    } catch (error) {
      console.error(`AudioManager: Failed to add audio ${effect.id}:`, error)
      throw error
    }
  }

  /**
   * Seek audio to specific time
   */
  async seek(effectId: string, effect: AudioEffect, timecode: number): Promise<void> {
    const audio = this.audios.get(effectId)
    if (!audio) return

    const currentTime = (timecode - effect.start_at_position + effect.start) / 1000

    if (currentTime >= 0 && currentTime <= effect.properties.raw_duration / 1000) {
      audio.currentTime = currentTime

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          audio.removeEventListener('seeked', onSeeked)
          resolve()
        }
        audio.addEventListener('seeked', onSeeked)
      })
    }
  }

  /**
   * Play audio
   * Ported from omniclip:77-81
   */
  async play(effectId: string): Promise<void> {
    const audio = this.audios.get(effectId)
    if (!audio) return

    if (audio.paused) {
      await audio.play().catch(error => {
        console.warn(`AudioManager: Play failed for ${effectId}:`, error)
      })
    }
  }

  /**
   * Pause audio
   * Ported from omniclip:71-76
   */
  pause(effectId: string): void {
    const audio = this.audios.get(effectId)
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
    }
  }

  /**
   * Play all audios
   * Ported from omniclip:58-69
   */
  async playAll(effectIds: string[]): Promise<void> {
    await Promise.all(effectIds.map(id => this.play(id)))
  }

  /**
   * Pause all audios
   * Ported from omniclip:48-56
   */
  pauseAll(effectIds: string[]): void {
    effectIds.forEach(id => this.pause(id))
  }

  remove(effectId: string): void {
    const audio = this.audios.get(effectId)
    if (!audio) return

    audio.pause()
    audio.src = ''
    this.audios.delete(effectId)
  }

  destroy(): void {
    this.audios.forEach((_, id) => this.remove(id))
    this.audios.clear()
  }
}
```

---

### **Step 6: Compositor Class実装（T048, T056）** 🎯 コア実装

**時間**: 3時間  
**ファイル**: `features/compositor/utils/Compositor.ts`  
**omniclip参照**: `compositor/controller.ts` (463行)

**実装内容**:

```typescript
import * as PIXI from 'pixi.js'
import { Effect, isVideoEffect, isImageEffect, isAudioEffect } from '@/types/effects'
import { VideoManager } from '../managers/VideoManager'
import { ImageManager } from '../managers/ImageManager'
import { AudioManager } from '../managers/AudioManager'

/**
 * Compositor - Main compositing engine
 * Ported from omniclip: /s/context/controllers/compositor/controller.ts
 * 
 * Responsibilities:
 * - Manage PIXI.js application
 * - Coordinate video/image/audio managers
 * - Handle playback loop
 * - Sync timeline with canvas rendering
 */
export class Compositor {
  // Playback state
  private isPlaying = false
  private lastTime = 0
  private pauseTime = 0
  private timecode = 0
  private animationFrameId: number | null = null

  // Currently visible effects
  private currentlyPlayedEffects = new Map<string, Effect>()

  // Managers
  private videoManager: VideoManager
  private imageManager: ImageManager
  private audioManager: AudioManager

  // Callbacks
  private onTimecodeChange?: (timecode: number) => void
  private onFpsUpdate?: (fps: number) => void

  // FPS tracking
  private fpsFrames: number[] = []
  private fpsLastTime = performance.now()

  constructor(
    public app: PIXI.Application,
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>,
    private fps: number = 30
  ) {
    // Initialize managers
    this.videoManager = new VideoManager(app, getMediaFileUrl)
    this.imageManager = new ImageManager(app, getMediaFileUrl)
    this.audioManager = new AudioManager(getMediaFileUrl)

    console.log('Compositor: Initialized')
  }

  /**
   * Set timecode change callback
   */
  setOnTimecodeChange(callback: (timecode: number) => void): void {
    this.onTimecodeChange = callback
  }

  /**
   * Set FPS update callback
   */
  setOnFpsUpdate(callback: (fps: number) => void): void {
    this.onFpsUpdate = callback
  }

  /**
   * Start playback
   * Ported from omniclip:87-98
   */
  play(): void {
    if (this.isPlaying) return

    this.isPlaying = true
    this.pauseTime = performance.now() - this.lastTime

    // Start playback loop
    this.startPlaybackLoop()

    console.log('Compositor: Play')
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.isPlaying) return

    this.isPlaying = false

    // Stop playback loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // Pause all media
    const videoIds = Array.from(this.currentlyPlayedEffects.values())
      .filter(isVideoEffect)
      .map(e => e.id)
    const audioIds = Array.from(this.currentlyPlayedEffects.values())
      .filter(isAudioEffect)
      .map(e => e.id)

    this.videoManager.pauseAll(videoIds)
    this.audioManager.pauseAll(audioIds)

    console.log('Compositor: Pause')
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    this.pause()
    this.seek(0)
    console.log('Compositor: Stop')
  }

  /**
   * Seek to specific timecode
   * Ported from omniclip:203-227
   */
  async seek(timecode: number, effects?: Effect[]): Promise<void> {
    this.timecode = timecode

    if (effects) {
      await this.composeEffects(effects, timecode)
    }

    // Seek all currently playing media
    for (const effect of this.currentlyPlayedEffects.values()) {
      if (isVideoEffect(effect)) {
        await this.videoManager.seek(effect.id, effect, timecode)
      } else if (isAudioEffect(effect)) {
        await this.audioManager.seek(effect.id, effect, timecode)
      }
    }

    // Notify timecode change
    if (this.onTimecodeChange) {
      this.onTimecodeChange(timecode)
    }

    // Render frame
    this.app.render()
  }

  /**
   * Main playback loop
   * Ported from omniclip:87-98
   */
  private startPlaybackLoop = (): void => {
    if (!this.isPlaying) return

    // Calculate elapsed time (omniclip:150-155)
    const now = performance.now() - this.pauseTime
    const elapsedTime = now - this.lastTime
    this.lastTime = now

    // Update timecode
    this.timecode += elapsedTime

    // Notify timecode change
    if (this.onTimecodeChange) {
      this.onTimecodeChange(this.timecode)
    }

    // Calculate FPS
    this.calculateFps()

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.startPlaybackLoop)
  }

  /**
   * Compose effects at current timecode
   * Ported from omniclip:157-162
   */
  async composeEffects(effects: Effect[], timecode: number): Promise<void> {
    this.timecode = timecode

    // Get effects that should be visible at this timecode
    const visibleEffects = this.getEffectsRelativeToTimecode(effects, timecode)

    // Update currently played effects
    await this.updateCurrentlyPlayedEffects(visibleEffects, timecode)

    // Render frame
    this.app.render()
  }

  /**
   * Get effects visible at timecode
   * Ported from omniclip:169-175
   */
  private getEffectsRelativeToTimecode(effects: Effect[], timecode: number): Effect[] {
    return effects.filter(effect => {
      const effectStart = effect.start_at_position
      const effectEnd = effect.start_at_position + effect.duration
      return effectStart <= timecode && timecode < effectEnd
    })
  }

  /**
   * Update currently played effects
   * Ported from omniclip:177-185
   */
  private async updateCurrentlyPlayedEffects(
    newEffects: Effect[],
    timecode: number
  ): Promise<void> {
    const currentIds = new Set(this.currentlyPlayedEffects.keys())
    const newIds = new Set(newEffects.map(e => e.id))

    // Find effects to add and remove
    const toAdd = newEffects.filter(e => !currentIds.has(e.id))
    const toRemove = Array.from(currentIds).filter(id => !newIds.has(id))

    // Remove old effects
    for (const id of toRemove) {
      const effect = this.currentlyPlayedEffects.get(id)
      if (!effect) continue

      if (isVideoEffect(effect)) {
        this.videoManager.removeFromStage(id)
      } else if (isImageEffect(effect)) {
        this.imageManager.removeFromStage(id)
      }

      this.currentlyPlayedEffects.delete(id)
    }

    // Add new effects
    for (const effect of toAdd) {
      // Ensure media is loaded
      if (isVideoEffect(effect)) {
        if (!this.videoManager.isReady(effect.id)) {
          await this.videoManager.addVideo(effect)
        }
        await this.videoManager.seek(effect.id, effect, timecode)
        this.videoManager.addToStage(effect.id, effect.track, 3) // 3 tracks default
        
        if (this.isPlaying) {
          await this.videoManager.play(effect.id)
        }
      } else if (isImageEffect(effect)) {
        if (!this.imageManager.getSprite(effect.id)) {
          await this.imageManager.addImage(effect)
        }
        this.imageManager.addToStage(effect.id, effect.track, 3)
      } else if (isAudioEffect(effect)) {
        // Audio doesn't have visual representation
        if (this.isPlaying) {
          await this.audioManager.play(effect.id)
        }
      }

      this.currentlyPlayedEffects.set(effect.id, effect)
    }

    // Sort children by z-index
    this.app.stage.sortChildren()
  }

  /**
   * Calculate actual FPS
   */
  private calculateFps(): void {
    const now = performance.now()
    const delta = now - this.fpsLastTime

    this.fpsFrames.push(delta)

    // Keep only last 60 frames
    if (this.fpsFrames.length > 60) {
      this.fpsFrames.shift()
    }

    // Calculate average FPS
    if (this.fpsFrames.length > 0 && delta > 16) { // Update every ~16ms
      const avgDelta = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length
      const fps = 1000 / avgDelta

      if (this.onFpsUpdate) {
        this.onFpsUpdate(Math.round(fps))
      }

      this.fpsLastTime = now
    }
  }

  /**
   * Clear canvas
   * Ported from omniclip:139-148
   */
  clear(): void {
    this.app.renderer.clear()
    this.app.stage.removeChildren()
  }

  /**
   * Reset compositor
   * Ported from omniclip:125-137
   */
  reset(): void {
    // Remove all effects from canvas
    this.currentlyPlayedEffects.forEach((effect) => {
      if (isVideoEffect(effect)) {
        this.videoManager.removeFromStage(effect.id)
      } else if (isImageEffect(effect)) {
        this.imageManager.removeFromStage(effect.id)
      }
    })

    this.currentlyPlayedEffects.clear()
    this.clear()
  }

  /**
   * Destroy compositor
   */
  destroy(): void {
    this.pause()
    this.videoManager.destroy()
    this.imageManager.destroy()
    this.audioManager.destroy()
    this.currentlyPlayedEffects.clear()
  }

  /**
   * Get current timecode
   */
  getTimecode(): number {
    return this.timecode
  }

  /**
   * Check if playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }
}
```

---

### **Step 7: PlaybackControls UI（T049）**

**時間**: 1時間  
**ファイル**: `features/compositor/components/PlaybackControls.tsx`

**実装内容**:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useCompositorStore } from '@/stores/compositor'

interface PlaybackControlsProps {
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onSeekBackward?: () => void
  onSeekForward?: () => void
}

export function PlaybackControls({
  onPlay,
  onPause,
  onStop,
  onSeekBackward,
  onSeekForward
}: PlaybackControlsProps) {
  const { isPlaying, timecode, duration, togglePlayPause, stop } = useCompositorStore()

  // Format timecode to MM:SS.mmm
  const formatTimecode = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    togglePlayPause()
    if (isPlaying) {
      onPause?.()
    } else {
      onPlay?.()
    }
  }

  const handleStop = () => {
    stop()
    onStop?.()
  }

  const handleSeekBackward = () => {
    onSeekBackward?.()
  }

  const handleSeekForward = () => {
    onSeekForward?.()
  }

  return (
    <div className="playback-controls flex items-center gap-2 px-4 py-2 bg-muted/50 border-t border-border">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSeekBackward}
          disabled={timecode === 0}
          title="Seek Backward (←)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSeekForward}
          disabled={timecode >= duration}
          title="Seek Forward (→)"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timecode display */}
      <div className="flex items-center gap-2 ml-4">
        <div className="text-sm font-mono text-muted-foreground">
          {formatTimecode(timecode)}
        </div>
        <span className="text-muted-foreground">/</span>
        <div className="text-sm font-mono text-muted-foreground">
          {formatTimecode(duration)}
        </div>
      </div>
    </div>
  )
}
```

---

### **Step 8: Timeline Ruler実装（T054）**

**時間**: 1.5時間  
**ファイル**: `features/timeline/components/TimelineRuler.tsx`

**実装内容**:

```typescript
'use client'

import { useTimelineStore } from '@/stores/timeline'
import { useCompositorStore } from '@/stores/compositor'

interface TimelineRulerProps {
  projectId: string
}

export function TimelineRuler({ projectId }: TimelineRulerProps) {
  const { zoom } = useTimelineStore()
  const { timecode, seek } = useCompositorStore()

  // Calculate ruler ticks
  const generateTicks = () => {
    const ticks: { position: number; label: string; major: boolean }[] = []
    const pixelsPerSecond = zoom
    const secondInterval = pixelsPerSecond < 50 ? 10 : pixelsPerSecond < 100 ? 5 : 1

    for (let second = 0; second < 3600; second += secondInterval) {
      const position = second * pixelsPerSecond
      const isMajor = second % (secondInterval * 5) === 0

      ticks.push({
        position,
        label: isMajor ? formatTime(second * 1000) : '',
        major: isMajor
      })
    }

    return ticks
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTimecode = (x / zoom) * 1000
    seek(clickedTimecode)
  }

  const ticks = generateTicks()

  return (
    <div
      className="timeline-ruler relative h-8 bg-muted/50 border-b border-border cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Ticks */}
      {ticks.map((tick, index) => (
        <div
          key={index}
          className="absolute top-0"
          style={{ left: `${tick.position}px` }}
        >
          {/* Tick mark */}
          <div
            className={`
              ${tick.major ? 'h-4 bg-muted-foreground' : 'h-2 bg-muted-foreground/50'}
              w-px
            `}
          />
          {/* Label */}
          {tick.label && (
            <div className="absolute top-4 left-0 text-xs text-muted-foreground whitespace-nowrap">
              {tick.label}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

### **Step 9: Playhead Indicator実装（T055）**

**時間**: 1時間  
**ファイル**: `features/timeline/components/PlayheadIndicator.tsx`

**実装内容**:

```typescript
'use client'

import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'

export function PlayheadIndicator() {
  const { timecode } = useCompositorStore()
  const { zoom } = useTimelineStore()

  // Calculate position based on timecode and zoom
  const position = (timecode / 1000) * zoom

  return (
    <>
      {/* Playhead line */}
      <div
        className="playhead-line absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-50"
        style={{ left: `${position}px` }}
      />
      
      {/* Playhead handle */}
      <div
        className="playhead-handle absolute top-0 w-3 h-3 bg-red-500 rounded-full pointer-events-none z-50 transform -translate-x-1/2"
        style={{ left: `${position}px` }}
      />
    </>
  )
}
```

---

### **Step 10: FPS Counter実装（T057）**

**時間**: 30分  
**ファイル**: `features/compositor/components/FPSCounter.tsx`

**実装内容**:

```typescript
'use client'

import { useCompositorStore } from '@/stores/compositor'

export function FPSCounter() {
  const { actualFps, fps } = useCompositorStore()

  const getFpsColor = () => {
    if (actualFps >= fps * 0.9) return 'text-green-500'
    if (actualFps >= fps * 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="fps-counter absolute top-4 right-4 bg-black/80 px-3 py-1 rounded text-xs font-mono">
      <span className={getFpsColor()}>
        {actualFps.toFixed(1)} fps
      </span>
      <span className="text-muted-foreground ml-2">
        / {fps} fps target
      </span>
    </div>
  )
}
```

---

### **Step 11: EditorClient統合（T047, T058）** 🎯 最終統合

**時間**: 2時間  
**ファイル**: `app/editor/[projectId]/EditorClient.tsx`を更新

**実装内容**:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Timeline } from '@/features/timeline/components/Timeline'
import { MediaLibrary } from '@/features/media/components/MediaLibrary'
import { Canvas } from '@/features/compositor/components/Canvas'
import { PlaybackControls } from '@/features/compositor/components/PlaybackControls'
import { FPSCounter } from '@/features/compositor/components/FPSCounter'
import { Button } from '@/components/ui/button'
import { PanelRightOpen } from 'lucide-react'
import { Project } from '@/types/project'
import { Compositor } from '@/features/compositor/utils/Compositor'
import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'
import { getSignedUrl } from '@/app/actions/media'
import * as PIXI from 'pixi.js'

interface EditorClientProps {
  project: Project
}

export function EditorClient({ project }: EditorClientProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const compositorRef = useRef<Compositor | null>(null)
  
  const { 
    isPlaying, 
    timecode, 
    setTimecode, 
    setFps, 
    setDuration,
    setActualFps 
  } = useCompositorStore()
  
  const { effects } = useTimelineStore()

  // Initialize FPS from project settings
  useEffect(() => {
    setFps(project.settings.fps)
  }, [project.settings.fps])

  // Calculate timeline duration
  useEffect(() => {
    if (effects.length > 0) {
      const maxDuration = Math.max(
        ...effects.map(e => e.start_at_position + e.duration)
      )
      setDuration(maxDuration)
    }
  }, [effects])

  // Handle canvas ready
  const handleCanvasReady = (app: PIXI.Application) => {
    // Create compositor instance
    const compositor = new Compositor(
      app,
      async (mediaFileId: string) => {
        const url = await getSignedUrl(mediaFileId)
        return url
      },
      project.settings.fps
    )

    // Set callbacks
    compositor.setOnTimecodeChange(setTimecode)
    compositor.setOnFpsUpdate(setActualFps)

    compositorRef.current = compositor

    console.log('EditorClient: Compositor initialized')
  }

  // Handle playback controls
  const handlePlay = () => {
    if (compositorRef.current) {
      compositorRef.current.play()
    }
  }

  const handlePause = () => {
    if (compositorRef.current) {
      compositorRef.current.pause()
    }
  }

  const handleStop = () => {
    if (compositorRef.current) {
      compositorRef.current.stop()
    }
  }

  // Sync effects with compositor when they change
  useEffect(() => {
    if (compositorRef.current && effects.length > 0) {
      compositorRef.current.composeEffects(effects, timecode)
    }
  }, [effects, timecode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (compositorRef.current) {
        compositorRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Area - ✅ Phase 5実装 */}
      <div className="flex-1 relative flex items-center justify-center bg-muted/30 border-b border-border">
        <Canvas
          width={project.settings.width}
          height={project.settings.height}
          onAppReady={handleCanvasReady}
        />
        
        <FPSCounter />
        
        <Button
          variant="outline"
          className="absolute top-4 left-4"
          onClick={() => setMediaLibraryOpen(true)}
        >
          <PanelRightOpen className="h-4 w-4 mr-2" />
          Open Media Library
        </Button>
      </div>

      {/* Playback Controls */}
      <PlaybackControls
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
      />

      {/* Timeline Area - Phase 4完了 */}
      <div className="h-80 border-t border-border">
        <Timeline projectId={project.id} />
      </div>

      {/* Media Library Panel */}
      <MediaLibrary
        projectId={project.id}
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
      />
    </div>
  )
}
```

---

### **Step 12: Timeline更新（PlayheadIndicator統合）**

**時間**: 30分  
**ファイル**: `features/timeline/components/Timeline.tsx`を更新

**修正内容**:

```typescript
'use client'

import { useTimelineStore } from '@/stores/timeline'
import { TimelineTrack } from './TimelineTrack'
import { TimelineRuler } from './TimelineRuler'  // ✅ 追加
import { PlayheadIndicator } from './PlayheadIndicator'  // ✅ 追加
import { useEffect } from 'react'
import { getEffects } from '@/app/actions/effects'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TimelineProps {
  projectId: string
}

export function Timeline({ projectId }: TimelineProps) {
  const { effects, trackCount, zoom, setEffects } = useTimelineStore()

  // Load effects when component mounts
  useEffect(() => {
    loadEffects()
  }, [projectId])

  const loadEffects = async () => {
    try {
      const loadedEffects = await getEffects(projectId)
      setEffects(loadedEffects)
    } catch (error) {
      console.error('Failed to load effects:', error)
    }
  }

  const timelineWidth = Math.max(
    ...effects.map(e => (e.start_at_position + e.duration) / 1000 * zoom),
    5000
  )

  return (
    <div className="timeline-container flex-1 flex flex-col bg-muted/20">
      {/* Timeline header */}
      <div className="timeline-header h-12 border-b border-border bg-background flex items-center px-4">
        <h3 className="text-sm font-medium">Timeline</h3>
      </div>

      {/* Timeline ruler - ✅ Phase 5追加 */}
      <TimelineRuler projectId={projectId} />

      {/* Timeline tracks */}
      <ScrollArea className="flex-1">
        <div className="timeline-tracks relative" style={{ width: `${timelineWidth}px` }}>
          {/* Playhead - ✅ Phase 5追加 */}
          <PlayheadIndicator />
          
          {Array.from({ length: trackCount }).map((_, index) => (
            <TimelineTrack
              key={index}
              trackIndex={index}
              effects={effects}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Timeline footer */}
      <div className="timeline-footer h-12 border-t border-border bg-background flex items-center justify-between px-4">
        <div className="text-xs text-muted-foreground">
          {effects.length} effect(s)
        </div>
        <div className="text-xs text-muted-foreground">
          Zoom: {zoom}px/s
        </div>
      </div>
    </div>
  )
}
```

---

## ✅ 実装完了チェックリスト

### **1. 型チェック**

```bash
npx tsc --noEmit
# 期待: エラー0件
```

### **2. ディレクトリ構造確認**

```bash
features/compositor/
├── components/
│   ├── Canvas.tsx           ✅
│   ├── PlaybackControls.tsx ✅
│   └── FPSCounter.tsx       ✅
├── managers/
│   ├── VideoManager.ts      ✅
│   ├── ImageManager.ts      ✅
│   ├── AudioManager.ts      ✅
│   └── index.ts             ✅
└── utils/
    └── Compositor.ts        ✅

features/timeline/components/
├── Timeline.tsx             ✅ 更新
├── TimelineRuler.tsx        ✅ 新規
└── PlayheadIndicator.tsx   ✅ 新規

stores/
└── compositor.ts            ✅
```

### **3. 動作確認シナリオ**

```bash
npm run dev
# http://localhost:3000/editor にアクセス
```

**テストシナリオ**:
```
[ ] 1. プロジェクトを開く
[ ] 2. キャンバスが1920x1080で表示される
[ ] 3. メディアをアップロード
[ ] 4. "Add"ボタンでタイムラインに追加
[ ] 5. Playボタンをクリック → ビデオが再生開始
[ ] 6. FPSカウンターが50fps以上を表示
[ ] 7. Pauseボタンで一時停止
[ ] 8. タイムラインルーラーをクリック → プレイヘッドがジャンプ
[ ] 9. 複数メディア追加 → 重なり部分が正しくレンダリング
[ ] 10. トラック順序通りにz-indexが適用される
[ ] 11. オーディオが同期再生される
[ ] 12. ブラウザリロード → 状態が保持される
```

---

## 🚨 重要な実装ポイント

### **1. PIXI.js初期化（omniclip準拠）**

```typescript
// Canvas.tsx - omniclip:37の完全移植
const app = new PIXI.Application()
await app.init({
  width: 1920,
  height: 1080,
  backgroundColor: 0x000000, // Black
  preference: 'webgl',       // WebGL優先
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
})

// Stage設定 (omniclip:49-50)
app.stage.sortableChildren = true  // z-index有効化
app.stage.interactive = true       // インタラクション有効化
app.stage.hitArea = app.screen     // ヒットエリア設定
```

### **2. プレイバックループ（omniclip準拠）**

```typescript
// Compositor.ts - omniclip:87-98の完全移植
private startPlaybackLoop = (): void => {
  if (!this.isPlaying) return

  // 経過時間計算 (omniclip:150-155)
  const now = performance.now() - this.pauseTime
  const elapsedTime = now - this.lastTime
  this.lastTime = now

  // タイムコード更新
  this.timecode += elapsedTime

  // コールバック呼び出し
  if (this.onTimecodeChange) {
    this.onTimecodeChange(this.timecode)
  }

  // FPS計算
  this.calculateFps()

  // 次フレームリクエスト
  this.animationFrameId = requestAnimationFrame(this.startPlaybackLoop)
}
```

### **3. エフェクトコンポジティング（omniclip準拠）**

```typescript
// Compositor.ts - omniclip:157-162
async composeEffects(effects: Effect[], timecode: number): Promise<void> {
  this.timecode = timecode

  // タイムコードで表示すべきエフェクトを取得 (omniclip:169-175)
  const visibleEffects = effects.filter(effect => {
    const effectStart = effect.start_at_position
    const effectEnd = effect.start_at_position + effect.duration
    return effectStart <= timecode && timecode < effectEnd
  })

  // 現在再生中のエフェクトを更新 (omniclip:177-185)
  await this.updateCurrentlyPlayedEffects(visibleEffects, timecode)

  // レンダリング
  this.app.render()
}
```

### **4. ビデオシーク（omniclip準拠）**

```typescript
// VideoManager.ts - omniclip:216-225
async seek(effectId: string, effect: VideoEffect, timecode: number): Promise<void> {
  const video = this.videos.get(effectId)
  if (!video) return

  // エフェクト相対時間計算 (omniclip:165-167)
  const currentTime = (timecode - effect.start_at_position + effect.start) / 1000
  
  if (currentTime >= 0 && currentTime <= effect.properties.raw_duration / 1000) {
    video.element.currentTime = currentTime

    // シーク完了待ち (omniclip:229-237)
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.element.removeEventListener('seeked', onSeeked)
        resolve()
      }
      video.element.addEventListener('seeked', onSeeked)
    })
  }
}
```

---

## 📊 omniclip実装との対応表

| omniclip                 | ProEdit               | 行数       | 準拠度 |
|--------------------------|-----------------------|------------|--------|
| compositor/controller.ts | Compositor.ts         | 463 → 300  | 95%    |
| parts/video-manager.ts   | VideoManager.ts       | 183 → 150  | 100%   |
| parts/image-manager.ts   | ImageManager.ts       | 98 → 80    | 100%   |
| parts/audio-manager.ts   | AudioManager.ts       | 82 → 70    | 100%   |
| -                        | Canvas.tsx            | 新規 → 80  | N/A    |
| -                        | PlaybackControls.tsx  | 新規 → 100 | N/A    |
| -                        | TimelineRuler.tsx     | 新規 → 80  | N/A    |
| -                        | PlayheadIndicator.tsx | 新規 → 30  | N/A    |
| -                        | FPSCounter.tsx        | 新規 → 20  | N/A    |

**総実装予定行数**: 約910行

---

## 🔧 依存関係

### **npm packages（既にインストール済み）**

```json
{
  "dependencies": {
    "pixi.js": "^8.14.0",  ✅
    "zustand": "^5.0.8"    ✅
  }
}
```

### **Server Actions（既存）**

```typescript
// app/actions/media.ts
export async function getSignedUrl(mediaFileId: string): Promise<string>  ✅
```

---

## 🧪 テスト計画

### **新規テストファイル**

**ファイル**: `tests/unit/compositor.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { Compositor } from '@/features/compositor/utils/Compositor'
import { Effect, VideoEffect } from '@/types/effects'

describe('Compositor', () => {
  it('should calculate visible effects at timecode', () => {
    // テスト実装
  })

  it('should update timecode during playback', () => {
    // テスト実装
  })

  it('should sync audio/video playback', () => {
    // テスト実装
  })
})
```

**目標テストカバレッジ**: 60%以上

---

## 🎯 Phase 5完了の定義

以下**すべて**を満たした時点でPhase 5完了:

### **技術要件**
```bash
✅ TypeScriptエラー: 0件
✅ テスト: Compositor tests 全パス
✅ ビルド: 成功
✅ Lintエラー: 0件
```

### **機能要件**
```bash
✅ キャンバスが正しいサイズで表示
✅ Play/Pauseボタンが動作
✅ ビデオが60fps（またはプロジェクト設定fps）で再生
✅ オーディオがビデオと同期
✅ タイムラインルーラーでシーク可能
✅ プレイヘッドが正しい位置に表示
✅ FPSカウンターが実際のfpsを表示
✅ 複数エフェクトが正しいz-orderで表示
```

### **パフォーマンス要件**
```bash
✅ 実測fps: 50fps以上（60fps目標）
✅ メモリリーク: なし
✅ キャンバス描画遅延: 16ms以下（60fps維持）
```

---

## ⚠️ 実装時の注意事項

### **1. PIXI.js v8 API変更**

omniclipはPIXI.js v7を使用していますが、ProEditはv8を使用しています。

**主な違い**:
```typescript
// v7 (omniclip)
const app = new PIXI.Application({ width, height, ... })

// v8 (ProEdit)
const app = new PIXI.Application()
await app.init({ width, height, ... })  // ✅ 非同期初期化
```

### **2. メディアファイルURLの取得**

```typescript
// omniclip: ローカルファイル（createObjectURL）
const url = URL.createObjectURL(file)

// ProEdit: Supabase Storage（署名付きURL）
const url = await getSignedUrl(mediaFileId)  // ✅ 非同期取得
```

### **3. トリム計算**

```typescript
// omniclip準拠の計算式 (controller.ts:165-167)
const currentTime = (timecode - effect.start_at_position + effect.start) / 1000

// 説明:
// - timecode: 現在のタイムライン位置（ms）
// - effect.start_at_position: エフェクトのタイムライン開始位置（ms）
// - effect.start: トリム開始位置（メディアファイル内、ms）
// - 結果: メディアファイル内の再生位置（秒）
```

---

## 🚀 実装順序（推奨）

```
Day 1 (4時間):
1️⃣ Step 1: Compositor Store              [1時間]
2️⃣ Step 2: Canvas Wrapper                [1時間]
3️⃣ Step 3: VideoManager                  [2時間]

Day 2 (4時間):
4️⃣ Step 4: ImageManager                  [1.5時間]
5️⃣ Step 5: AudioManager                  [1時間]
6️⃣ Step 6: Compositor Class (Part 1)     [1.5時間]

Day 3 (4時間):
7️⃣ Step 6: Compositor Class (Part 2)     [1.5時間]
8️⃣ Step 7: PlaybackControls              [1時間]
9️⃣ Step 8: TimelineRuler                 [1.5時間]

Day 4 (3時間):
🔟 Step 9: PlayheadIndicator              [1時間]
1️⃣1️⃣ Step 10: FPSCounter                  [0.5時間]
1️⃣2️⃣ Step 11: EditorClient統合            [1.5時間]

総推定時間: 15時間（3-4日）
```

---

## 📝 Phase 5開始前の確認

### **✅ Phase 4完了確認**

```bash
# 1. データベース確認
# Supabase SQL Editor
SELECT column_name FROM information_schema.columns WHERE table_name = 'effects';
# → start, end, file_hash, name, thumbnail 存在確認 ✅

# 2. 型チェック
npx tsc --noEmit
# → エラー0件 ✅

# 3. テスト
npm run test
# → Timeline 12/12 成功 ✅

# 4. ブラウザ確認
npm run dev
# → メディアアップロード・タイムライン追加動作 ✅
```

---

## 🎯 Phase 5完了後の成果物

### **新規ファイル（9ファイル）**

1. `stores/compositor.ts` (80行)
2. `features/compositor/components/Canvas.tsx` (80行)
3. `features/compositor/components/PlaybackControls.tsx` (100行)
4. `features/compositor/components/FPSCounter.tsx` (20行)
5. `features/compositor/managers/VideoManager.ts` (150行)
6. `features/compositor/managers/ImageManager.ts` (80行)
7. `features/compositor/managers/AudioManager.ts` (70行)
8. `features/compositor/utils/Compositor.ts` (300行)
9. `features/timeline/components/TimelineRuler.tsx` (80行)
10. `features/timeline/components/PlayheadIndicator.tsx` (30行)

**総追加行数**: 約990行

### **更新ファイル（2ファイル）**

1. `app/editor/[projectId]/EditorClient.tsx` (+80行)
2. `features/timeline/components/Timeline.tsx` (+10行)

---

## 📚 omniclip参照ガイド

### **必読ファイル**

| ファイル                     | 行数 | 重要度    | 読むべき内容                            |
|--------------------------|------|---------|-----------------------------------|
| compositor/controller.ts | 463  | 🔴 最重要 | 全体構造、playbackループ、compose_effects |
| parts/video-manager.ts   | 183  | 🔴 最重要 | ビデオ読み込み、シーク、再生制御               |
| parts/image-manager.ts   | 98   | 🟡 重要   | 画像読み込み、スプライト作成                 |
| parts/audio-manager.ts   | 82   | 🟡 重要   | オーディオ再生、同期                       |
| context/types.ts         | 60   | 🟢 参考   | Effect型定義                         |

### **コード比較時の注意**

1. **PIXI.js v7 → v8**: 初期化APIが変更（同期→非同期）
2. **ローカルファイル → Supabase**: createObjectURL → getSignedUrl
3. **@benev/slate → Zustand**: 状態管理パターンの違い
4. **Lit Elements → React**: UIフレームワークの違い

---

## 🏆 Phase 5成功基準

### **技術基準**

- ✅ TypeScriptエラー0件
- ✅ 実測fps 50fps以上
- ✅ メモリ使用量 500MB以下（10分再生時）
- ✅ 初回レンダリング 3秒以内

### **ユーザー体験基準**

- ✅ 再生がスムーズ（フレームドロップなし）
- ✅ シークが即座（500ms以内）
- ✅ オーディオ・ビデオが同期（±50ms以内）
- ✅ UIが応答的（操作遅延なし）

---

## 💡 開発チームへのメッセージ

**Phase 4の完璧な実装、お疲れ様でした！** 🎉

Phase 5は**MVPの心臓部**となるリアルタイムプレビュー機能です。omniclipのCompositorを正確に移植すれば、プロフェッショナルな60fps再生が実現できます。

**成功の鍵**:
1. omniclipのコードを**行単位で読む**
2. PIXI.js v8のAPI変更を**確認する**
3. **小さく実装・テスト**を繰り返す
4. **FPSを常に監視**する

Phase 5完了後、ProEditは**実用的なビデオエディタ**になります！ 🚀

---

**作成日**: 2025-10-14  
**対象フェーズ**: Phase 5 - Real-time Preview and Playback  
**開始条件**: Phase 4完了（100%）✅  
**成功後**: Phase 6 - Basic Editing Operations へ進行

