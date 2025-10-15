import { VideoEffect } from '@/types/effects'
import * as PIXI from 'pixi.js'

/**
 * VideoManager - Manages video effects on PIXI canvas
 * Ported from omniclip: /s/context/controllers/compositor/parts/video-manager.ts
 */
export class VideoManager {
  // Map of video effect ID to PIXI sprite and video element
  private videos = new Map<
    string,
    {
      sprite: PIXI.Sprite
      element: HTMLVideoElement
      texture: PIXI.Texture
    }
  >()

  constructor(
    private app: PIXI.Application,
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {}

  /**
   * Add video effect to canvas
   * Ported from omniclip:54-100
   * GUARD: Prevent duplicate additions
   */
  async addVideo(effect: VideoEffect): Promise<void> {
    // CRITICAL: Check if already added to prevent duplicates
    if (this.videos.has(effect.id)) {
      console.warn(`VideoManager: Video ${effect.id} already added, skipping`)
      return
    }

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
      // CRITICAL: Mute by default to allow autoplay (browser policy)
      // Audio will be handled separately by AudioManager
      element.muted = true
      element.playsInline = true // Required for mobile devices

      // Create PIXI texture from video (omniclip:60-62)
      const texture = PIXI.Texture.from(element)
      // Note: PIXI.js v7 doesn't have autoPlay property, handled by video element

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

      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video metadata load timeout'))
        }, 5000) // 5 second timeout

        element.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout)
          resolve()
        }, { once: true })

        element.addEventListener('error', (e) => {
          clearTimeout(timeout)
          reject(new Error(`Video load error: ${e.message || 'Unknown error'}`))
        }, { once: true })

        // Trigger load
        element.load()
      })

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
    console.log(
      `VideoManager: Added to stage ${effectId} (track ${track}, zIndex ${video.sprite.zIndex})`
    )
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
   * FIXED: Handle autoplay policy errors gracefully
   */
  async play(effectId: string): Promise<void> {
    const video = this.videos.get(effectId)
    if (!video) return

    // Check if video is ready to play
    if (!this.isVideoElementReady(effectId)) {
      console.debug(`VideoManager: Video ${effectId} not ready yet, skipping play`)
      return
    }

    if (video.element.paused) {
      try {
        await video.element.play()
        console.debug(`VideoManager: Playing ${effectId}`)
      } catch (error) {
        // Autoplay failed - this is expected on first load without user interaction
        // The video will play once the user interacts with the page (e.g., clicks play button)
        if (error instanceof Error && error.name === 'NotAllowedError') {
          console.debug(`VideoManager: Autoplay blocked for ${effectId} - waiting for user interaction`)
        } else {
          console.warn(`VideoManager: Play failed for ${effectId}:`, error)
        }
      }
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
    await Promise.all(effectIds.map((id) => this.play(id)))
  }

  /**
   * Pause all videos
   */
  pauseAll(effectIds: string[]): void {
    effectIds.forEach((id) => this.pause(id))
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
   * FIXED: Added error handling to prevent cleanup failures
   */
  destroy(): void {
    this.videos.forEach((_, id) => {
      try {
        this.remove(id)
      } catch (error) {
        console.warn(`VideoManager: Error removing video ${id}:`, error)
      }
    })
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
   * FIXED: Simply check if video exists in map (already added)
   * readyState check is unreliable during initial load
   */
  isReady(effectId: string): boolean {
    return this.videos.has(effectId)
  }

  /**
   * Check if video element is ready to play
   * Used for playback control
   */
  isVideoElementReady(effectId: string): boolean {
    const video = this.videos.get(effectId)
    return video !== undefined && video.element.readyState >= 2 // HAVE_CURRENT_DATA
  }
}
