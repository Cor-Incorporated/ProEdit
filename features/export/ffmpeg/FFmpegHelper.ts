// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts (Line 12-96)
// Modified for Next.js: toBlobURL removed (Webpack compatibility)

import { AudioEffect, Effect, VideoEffect } from '@/types/effects'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export type ProgressCallback = (progress: number) => void

/**
 * FFmpegHelper - Wrapper for @ffmpeg/ffmpeg operations
 * Ported from omniclip FFmpegHelper
 */
export class FFmpegHelper {
  private ffmpeg: FFmpeg
  private isLoaded = false
  private progressCallbacks: Set<ProgressCallback> = new Set()

  constructor() {
    this.ffmpeg = new FFmpeg()
    this.setupProgressHandler()
  }

  // Modified from omniclip Line 24-30
  // Next.js adaptation: Direct URLs with fallback to blob URLs
  // Service Worker (coi-serviceworker) provides SharedArrayBuffer support
  async load(): Promise<void> {
    if (this.isLoaded) return

    try {
      // Check SharedArrayBuffer availability first
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error(
          'SharedArrayBuffer is not available. ' +
          'Make sure Service Worker (coi-serviceworker.js) is registered and page is reloaded. ' +
          'Check browser console for COOP/COEP header warnings.'
        )
      }

      console.log('[FFmpeg] SharedArrayBuffer is available ✓')
      console.log('[FFmpeg] Cross-origin isolated:', crossOriginIsolated)

      // Use local files from public directory
      // Next.js serves files from /public at the root URL
      const baseURL = typeof window !== 'undefined' 
        ? `${window.location.origin}/ffmpeg`
        : '/ffmpeg'

      // Try direct URLs first (faster, no blob conversion needed)
      // This works with Service Worker providing COOP/COEP headers
      console.log('[FFmpeg] Loading from:', baseURL)
      
      // Use full URLs for better compatibility
      await this.ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      })

      this.isLoaded = true
      console.log('[FFmpeg] Loaded successfully from local files')
    } catch (error) {
      console.error('[FFmpeg] Load failed:', error)

      // Fallback: Load from CDN using blob URLs (works without /public/ffmpeg)
      try {
        const cdnBase = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
        console.log('[FFmpeg] Falling back to CDN:', cdnBase)

        await this.ffmpeg.load({
          coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        this.isLoaded = true
        console.log('[FFmpeg] Loaded successfully from CDN fallback')
        return
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        let helpText = 'Troubleshooting:\n'

        if (typeof SharedArrayBuffer === 'undefined') {
          helpText += '1. Service Worker is not running - reload the page\n'
          helpText += '2. Check that /coi-serviceworker.js is accessible\n'
        } else {
          helpText += '1. Check that /public/ffmpeg/ contains ffmpeg-core.js and ffmpeg-core.wasm\n'
          helpText += '2. Run "npm run setup:ffmpeg" to download FFmpeg files\n'
          helpText += '3. Ensure these files are committed for Vercel deployment or rely on CDN fallback\n'
        }

        throw new Error(`Failed to load FFmpeg (CDN fallback): ${errorMessage}\n\n${helpText}`)
      }
    }
  }

  /**
   * Helper for preloading FFmpeg early (e.g., on editor mount)
   */
  static async preload(instance: FFmpegHelper): Promise<void> {
    try {
      await instance.load()
    } catch (e) {
      console.warn('[FFmpeg] Preload failed, will retry on demand:', e)
    }
  }

  // Ported from omniclip Line 32-34
  async writeFile(name: string, data: Uint8Array): Promise<void> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded. Call load() first.')
    }
    await this.ffmpeg.writeFile(name, data)
  }

  // Ported from omniclip Line 87-89
  async readFile(name: string): Promise<Uint8Array> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded. Call load() first.')
    }
    const data = await this.ffmpeg.readFile(name)
    return data as Uint8Array
  }

  // Execute FFmpeg command
  async run(command: string[]): Promise<void> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded. Call load() first.')
    }
    try {
      console.log('FFmpeg command:', command.join(' '))
      await this.ffmpeg.exec(command)
    } catch (error) {
      console.error('FFmpeg command failed:', error)
      throw error
    }
  }

  // Setup progress handler
  private setupProgressHandler(): void {
    this.ffmpeg.on('progress', ({ progress }) => {
      const percentage = Math.round(progress * 100)
      this.progressCallbacks.forEach((callback) => callback(percentage))
    })
  }

  // Register progress callback
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.add(callback)
  }

  // Remove progress callback
  offProgress(callback: ProgressCallback): void {
    this.progressCallbacks.delete(callback)
  }

  // Ported from omniclip Line 36-85
  // Merge audio with video and mux into final output
  async mergeAudioWithVideoAndMux(
    effects: Effect[],
    videoContainerName: string,
    outputFileName: string,
    getMediaFile: (fileHash: string) => Promise<File>,
    timebase: number
  ): Promise<void> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded. Call load() first.')
    }

    // Extract audio effects from video effects
    const audioFromVideoEffects = effects.filter(
      (effect) => effect.kind === 'video' && !effect.is_muted
    ) as VideoEffect[]

    // Added audio effects
    const addedAudioEffects = effects.filter(
      (effect) => effect.kind === 'audio' && !effect.is_muted
    ) as AudioEffect[]

    const allAudioEffects = [...audioFromVideoEffects, ...addedAudioEffects]
    const noAudioVideos: string[] = []

    // Extract audio from each effect
    for (const { id, kind, start, end, file_hash } of allAudioEffects) {
      try {
        const file = await getMediaFile(file_hash)

        if (kind === 'video') {
          // Extract audio from video
          await this.ffmpeg.writeFile(`${id}.mp4`, await fetchFile(file))
          await this.ffmpeg.exec([
            '-ss',
            `${start / 1000}`,
            '-i',
            `${id}.mp4`,
            '-t',
            `${(end - start) / 1000}`,
            '-vn',
            `${id}.mp3`,
          ])

          // Check if audio extraction succeeded
          await this.ffmpeg.readFile(`${id}.mp3`).catch(() => {
            // Video has no audio
            noAudioVideos.push(id)
          })
        } else {
          // Process audio file
          await this.ffmpeg.writeFile(`${id}x.mp3`, await fetchFile(file))
          await this.ffmpeg.exec([
            '-ss',
            `${start / 1000}`,
            '-i',
            `${id}x.mp3`,
            '-t',
            `${(end - start) / 1000}`,
            '-vn',
            `${id}.mp3`,
          ])
        }
      } catch (error) {
        console.error(`Failed to process audio for effect ${id}:`, error)
      }
    }

    // Filter out effects with no audio
    const filteredAudios = allAudioEffects.filter(
      (element) => !noAudioVideos.includes(element.id)
    )
    const noAudio = filteredAudios.length === 0

    // Mux video with audio
    if (noAudio) {
      // No audio - just copy video
      await this.ffmpeg.exec([
        '-r',
        `${timebase}`,
        '-i',
        `${videoContainerName}`,
        '-map',
        '0:v:0',
        '-c:v',
        'copy',
        '-y',
        `${outputFileName}`,
      ])
    } else {
      // Mix all audio tracks and add to video
      await this.ffmpeg.exec([
        '-r',
        `${timebase}`,
        '-i',
        `${videoContainerName}`,
        ...filteredAudios.flatMap(({ id }) => `-i, ${id}.mp3`.split(', ')),
        '-filter_complex',
        `${filteredAudios
          .map((effect, i) => `[${i + 1}:a]adelay=${effect.start_at_position}:all=1[a${i + 1}];`)
          .join('')}
        ${filteredAudios.map((_, i) => `[a${i + 1}]`).join('')}amix=inputs=${filteredAudios.length}[amixout]`,
        '-map',
        '0:v:0',
        '-map',
        '[amixout]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-y',
        `${outputFileName}`,
      ])
    }
  }

  // Check if FFmpeg is loaded
  get loaded(): boolean {
    return this.isLoaded
  }

  // Cleanup
  async terminate(): Promise<void> {
    this.progressCallbacks.clear()
    if (this.isLoaded) {
      await this.ffmpeg.terminate()
      this.isLoaded = false
    }
  }
}
