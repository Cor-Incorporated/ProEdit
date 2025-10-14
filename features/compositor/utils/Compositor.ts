import * as PIXI from 'pixi.js'
import { Effect, isVideoEffect, isImageEffect, isAudioEffect, isTextEffect, TextEffect } from '@/types/effects'
import { VideoManager } from '../managers/VideoManager'
import { ImageManager } from '../managers/ImageManager'
import { AudioManager } from '../managers/AudioManager'
import { TextManager } from '../managers/TextManager'

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
  private textManager: TextManager

  // Callbacks
  private onTimecodeChange?: (timecode: number) => void
  private onFpsUpdate?: (fps: number) => void

  // FPS tracking
  private fpsFrames: number[] = []
  private fpsLastTime = performance.now()

  constructor(
    public app: PIXI.Application,
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>,
    private fps: number = 30,
    private onTextEffectUpdate?: (effectId: string, updates: Partial<TextEffect>) => Promise<void>
  ) {
    // Initialize managers
    this.videoManager = new VideoManager(app, getMediaFileUrl)
    this.imageManager = new ImageManager(app, getMediaFileUrl)
    this.audioManager = new AudioManager(getMediaFileUrl)
    this.textManager = new TextManager(app, onTextEffectUpdate)

    console.log('Compositor: Initialized with TextManager')
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
      .map((e) => e.id)
    const audioIds = Array.from(this.currentlyPlayedEffects.values())
      .filter(isAudioEffect)
      .map((e) => e.id)

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
    return effects.filter((effect) => {
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
    const newIds = new Set(newEffects.map((e) => e.id))

    // Find effects to add and remove
    const toAdd = newEffects.filter((e) => !currentIds.has(e.id))
    const toRemove = Array.from(currentIds).filter((id) => !newIds.has(id))

    // Remove old effects
    for (const id of toRemove) {
      const effect = this.currentlyPlayedEffects.get(id)
      if (!effect) continue

      if (isVideoEffect(effect)) {
        this.videoManager.removeFromStage(id)
      } else if (isImageEffect(effect)) {
        this.imageManager.removeFromStage(id)
      } else if (isTextEffect(effect)) {
        this.textManager.remove_text_from_canvas(effect)
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
      } else if (isTextEffect(effect)) {
        // Text overlay - Phase 7 T079
        if (!this.textManager.has(effect.id)) {
          await this.textManager.add_text_effect(effect, false)
        }
        this.textManager.add_text_to_canvas(effect)
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
    if (this.fpsFrames.length > 0 && delta > 16) {
      // Update every ~16ms
      const avgDelta =
        this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length
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
      } else if (isTextEffect(effect)) {
        this.textManager.remove_text_from_canvas(effect)
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
    this.textManager.destroy()
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

  /**
   * Render a single frame for export at a specific timestamp
   * Used by ExportController to capture frames during export
   * Ported from omniclip export workflow (non-destructive seek + render)
   *
   * @param timestamp Timestamp in ms to render
   * @param effects All effects to compose at this timestamp
   * @returns HTMLCanvasElement containing the rendered frame
   */
  async renderFrameForExport(timestamp: number, effects: Effect[]): Promise<HTMLCanvasElement> {
    // Store current playback state to restore later
    const wasPlaying = this.isPlaying

    // Ensure paused state for deterministic rendering
    if (wasPlaying) {
      this.pause()
    }

    // Seek to target timestamp and compose effects
    await this.seek(timestamp, effects)

    // Force explicit render
    this.app.render()

    // Restore playback state if needed
    if (wasPlaying) {
      this.play()
    }

    // Return canvas for frame capture (v7 uses app.view instead of app.canvas)
    return this.app.view as HTMLCanvasElement
  }
}
