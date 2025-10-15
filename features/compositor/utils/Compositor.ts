import { logger } from '@/lib/utils/logger'
import { Effect, isAudioEffect, isImageEffect, isTextEffect, isVideoEffect, TextEffect } from '@/types/effects'
import * as PIXI from 'pixi.js'
import { AudioManager } from '../managers/AudioManager'
import { ImageManager } from '../managers/ImageManager'
import { TextManager } from '../managers/TextManager'
import { VideoManager } from '../managers/VideoManager'

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

  // Cleanup guard to prevent double-destroy in React Strict Mode
  private isDestroyed = false

  // FIXED: Store all effects for playback loop access
  private allEffects: Effect[] = []

  // Track visible effect IDs to detect changes
  private visibleEffectIds = new Set<string>()

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

    logger.debug('Compositor: Initialized with TextManager')
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
   * Set effects for playback
   * FIXED: Store effects internally so playback loop can access them
   * OPTIMIZED: Don't immediately recompose - let playback loop handle it
   * This prevents infinite loops when effects are updated frequently (e.g., auto-save)
   */
  setEffects(effects: Effect[]): void {
    this.allEffects = effects
    // Don't immediately recompose - the playback loop will handle it on next frame
    // If paused, caller should explicitly call seek() or composeEffects()
  }

  /**
   * Recompose only if visible effects changed
   * FIXED: Performance optimization - only recompose when necessary
   * GUARD: Prevent execution after destroy
   */
  private async recomposeIfNeeded(): Promise<void> {
    // Guard: Don't execute if compositor is destroyed
    if (this.isDestroyed) {
      logger.warn('Compositor.recomposeIfNeeded: Compositor is destroyed, skipping')
      return
    }

    try {
      // Get effects visible at current timecode
      const visibleEffects = this.getEffectsRelativeToTimecode(
        this.allEffects,
        this.timecode
      )
      const newIds = new Set(visibleEffects.map(e => e.id))

      // Only recompose if the set of visible effects changed
      if (!this.setsEqual(this.visibleEffectIds, newIds)) {
        // Guard before async compose
        if (this.isDestroyed) return
        await this.composeEffects(this.allEffects, this.timecode)
        // Guard after async compose
        if (this.isDestroyed) return
        this.visibleEffectIds = newIds
      }
    } catch (error) {
      logger.error('Compositor: Recompose failed:', error)
      // Keep going - don't crash the playback loop
    }
  }

  /**
   * Compare two sets for equality
   */
  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false
    for (const item of a) {
      if (!b.has(item)) return false
    }
    return true
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

    logger.debug('Compositor: Play')
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

    logger.debug('Compositor: Pause')
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    this.pause()
    this.seek(0)
    logger.debug('Compositor: Stop')
  }

  /**
   * Seek to specific timecode
   * Ported from omniclip:203-227
   */
  async seek(timecode: number, effects?: Effect[]): Promise<void> {
    // Guard: Check if destroyed
    if (this.isDestroyed || !this.app) {
      return
    }

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

    // Render frame - with null check
    if (this.app && this.app.renderer && !this.isDestroyed) {
      try {
        this.app.render()
      } catch (error) {
        logger.error('Compositor: Render failed during seek', error)
      }
    }
  }

  /**
   * Main playback loop
   * Ported from omniclip:87-98
   * FIXED: Recompose effects every frame to update visibility based on timecode
   */
  private startPlaybackLoop = (): void => {
    if (!this.isPlaying || this.isDestroyed) return

    // Calculate elapsed time (omniclip:150-155)
    const now = performance.now() - this.pauseTime
    const elapsedTime = now - this.lastTime
    this.lastTime = now

    // Update timecode
    this.timecode += elapsedTime

    // FIXED: Only recompose if visible effects changed (performance optimization)
    // Prevents unnecessary composeEffects calls (60fps → ~2-5fps)
    if (this.allEffects.length > 0) {
      this.recomposeIfNeeded().catch((err) => {
        // Avoid spamming logs; could be upgraded to circuit breaker if needed
        // Keep loop running but record an error once
        logger.error('Compositor: Recompose failed:', err)
      })
    }

    // CRITICAL: Update video textures for smooth playback
    // PIXI.js video textures need manual update in some cases
    if (this.app && this.app.renderer && !this.isDestroyed) {
      try {
        this.app.render()
      } catch {
        // Ignore render errors during cleanup
      }
    }

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
   * GUARD: Prevent execution after destroy
   */
  async composeEffects(effects: Effect[], timecode: number): Promise<void> {
    // Guard: Don't execute if compositor is destroyed or app is invalid
    if (this.isDestroyed || !this.app || !this.app.stage || !this.app.renderer) {
      logger.warn('Compositor: Cannot compose - app is destroyed or invalid')
      return
    }

    this.timecode = timecode

    // Get effects that should be visible at this timecode
    const visibleEffects = this.getEffectsRelativeToTimecode(effects, timecode)

    // Update currently played effects
    await this.updateCurrentlyPlayedEffects(visibleEffects, timecode)

    // Render frame - with final null check
    if (this.app && this.app.renderer && !this.isDestroyed) {
      try {
        this.app.render()
      } catch (error) {
        logger.error('Compositor: Render failed', error)
      }
    }
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
   * GUARD: Prevent execution after destroy
   * OPTIMIZED: Only add/remove effects that actually changed
   */
  private async updateCurrentlyPlayedEffects(
    newEffects: Effect[],
    timecode: number
  ): Promise<void> {
    // Guard: Don't execute if compositor is destroyed or stage is null
    if (this.isDestroyed || !this.app.stage) {
      return
    }

    const currentIds = new Set(this.currentlyPlayedEffects.keys())
    const newIds = new Set(newEffects.map((e) => e.id))

    // Find effects to add and remove
    const toAdd = newEffects.filter((e) => !currentIds.has(e.id))
    const toRemove = Array.from(currentIds).filter((id) => !newIds.has(id))

    // CRITICAL: Only process if there are actual changes
    // Skip if nothing to add or remove
    if (toAdd.length === 0 && toRemove.length === 0) {
      // No changes - skip processing to avoid unnecessary operations
      logger.debug('Compositor: No effect changes, skipping update')
      return
    }

    logger.debug(`Compositor: Updating effects - adding ${toAdd.length}, removing ${toRemove.length}`)

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
      // Guard: Check if destroyed during async operations
      if (this.isDestroyed) {
        return
      }

      // Ensure media is loaded and add to stage ONLY if not already added
      if (isVideoEffect(effect)) {
        // Only load video if not already ready
        if (!this.videoManager.isReady(effect.id)) {
          await this.videoManager.addVideo(effect)
        }
        
        // Seek to correct position
        await this.videoManager.seek(effect.id, effect, timecode)
        
        // Add to stage ONLY if not already on stage
        const sprite = this.videoManager.getSprite(effect.id)
        if (sprite && !sprite.parent) {
          this.videoManager.addToStage(effect.id, effect.track, 3)
        }

        // Play if compositor is playing
        if (this.isPlaying) {
          await this.videoManager.play(effect.id)
        }
      } else if (isImageEffect(effect)) {
        // Only add image if not already loaded
        if (!this.imageManager.getSprite(effect.id)) {
          await this.imageManager.addImage(effect)
        }
        
        // Add to stage ONLY if not already on stage
        const sprite = this.imageManager.getSprite(effect.id)
        if (sprite && !sprite.parent) {
          this.imageManager.addToStage(effect.id, effect.track, 3)
        }
      } else if (isAudioEffect(effect)) {
        // Audio doesn't have visual representation
        if (this.isPlaying) {
          await this.audioManager.play(effect.id)
        }
      } else if (isTextEffect(effect)) {
        // Text overlay - Phase 7 T079
        // Only add text if not already added
        if (!this.textManager.has(effect.id)) {
          await this.textManager.add_text_effect(effect, false)
        }
        
        // Add to canvas ONLY if not already on canvas
        const textData = this.textManager.get(effect.id)
        const textSprite = textData?.sprite
        if (textSprite && !textSprite.parent) {
          this.textManager.add_text_to_canvas(effect)
        }
      }

      this.currentlyPlayedEffects.set(effect.id, effect)
    }

    // Guard: Check stage again before sorting (async operations may have destroyed it)
    if (!this.isDestroyed && this.app.stage) {
      // Sort children by z-index
      this.app.stage.sortChildren()
    }

    // Prune any cached media that is no longer referenced (memory guard)
    try {
      const allowedIds = new Set(newEffects.filter(isVideoEffect).map(e => e.id))
      this.videoManager.pruneUnused(allowedIds)
    } catch {
      // ignore prune errors
    }
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
   * P0-FIX: Proper cleanup to prevent memory leaks
   * CR-FIX: Enhanced cleanup with explicit resource disposal
   * STRICT-MODE-FIX: Guard against double-destroy in React Strict Mode
   */
  destroy(): void {
    // Guard: Prevent double-destroy (React Strict Mode issue)
    if (this.isDestroyed) {
      logger.warn('Compositor: Already destroyed, skipping cleanup')
      return
    }

    this.isDestroyed = true
    this.pause()

    // Stop animation frame if running
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // CR-FIX: Remove all effects from stage explicitly before manager cleanup
    this.currentlyPlayedEffects.forEach((effect) => {
      if (isVideoEffect(effect)) {
        this.videoManager.removeFromStage(effect.id)
      } else if (isImageEffect(effect)) {
        this.imageManager.removeFromStage(effect.id)
      } else if (isTextEffect(effect)) {
        this.textManager.remove_text_from_canvas(effect)
      }
    })

    // Clear references
    this.currentlyPlayedEffects.clear()

    // CR-FIX: Destroy managers in correct order (media first, then text)
    // This ensures all textures and sprites are released before PIXI cleanup
    this.videoManager.destroy()
    this.imageManager.destroy()
    this.audioManager.destroy()
    this.textManager.clear()

    // IMPORTANT: Following omniclip pattern - DO NOT call app.destroy()
    // omniclip/s/context/controllers/compositor/controller.ts:136-141
    // Only clears renderer and removes children - never destroys the app
    // Canvas component owns the app lifecycle and will destroy it
    try {
      if (this.app.renderer) {
        this.app.renderer.clear()
      }
      if (this.app.stage) {
        this.app.stage.removeChildren()
      }
      logger.info('Compositor: Cleaned up all resources (omniclip pattern - no app.destroy)')
    } catch (error) {
      logger.error('Compositor: Error during cleanup', error)
    }
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
