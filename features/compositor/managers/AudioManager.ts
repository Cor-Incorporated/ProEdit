import { AudioEffect } from '@/types/effects'

/**
 * AudioManager - Manages audio effects playback
 * Ported from omniclip: /s/context/controllers/compositor/parts/audio-manager.ts
 */
export class AudioManager {
  private audios = new Map<string, HTMLAudioElement>()

  constructor(private getMediaFileUrl: (mediaFileId: string) => Promise<string>) {}

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
      await audio.play().catch((error) => {
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
    await Promise.all(effectIds.map((id) => this.play(id)))
  }

  /**
   * Pause all audios
   * Ported from omniclip:48-56
   */
  pauseAll(effectIds: string[]): void {
    effectIds.forEach((id) => this.pause(id))
  }

  remove(effectId: string): void {
    const audio = this.audios.get(effectId)
    if (!audio) return

    audio.pause()
    audio.src = ''
    this.audios.delete(effectId)
  }

  /**
   * FIXED: Added error handling to prevent cleanup failures
   */
  destroy(): void {
    this.audios.forEach((_, id) => {
      try {
        this.remove(id)
      } catch (error) {
        console.warn(`AudioManager: Error removing audio ${id}:`, error)
      }
    })
    this.audios.clear()
  }
}
