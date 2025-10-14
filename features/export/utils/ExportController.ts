// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/controller.ts (Line 12-102)

import { Effect } from '@/types/effects'
import { FFmpegHelper } from '../ffmpeg/FFmpegHelper'
import { Encoder } from '../workers/Encoder'
import {
  ExportOptions,
  ExportProgress,
  ExportResult,
  EXPORT_PRESETS,
  ExportStatus,
} from '../types'

export type ProgressCallback = (progress: ExportProgress) => void

/**
 * ExportController - Orchestrates the video export process
 * Ported from omniclip VideoExport class
 */
export class ExportController {
  private ffmpeg: FFmpegHelper
  private encoder: Encoder
  private timestamp = 0
  private timestampEnd = 0
  private exporting = false
  private progressCallback?: ProgressCallback
  private canvas: HTMLCanvasElement | null = null

  constructor() {
    this.ffmpeg = new FFmpegHelper()
    this.encoder = new Encoder(this.ffmpeg)
  }

  // Ported from omniclip Line 52-62
  async startExport(
    options: ExportOptions,
    effects: Effect[],
    getMediaFile: (fileHash: string) => Promise<File>,
    renderFrame: (timestamp: number) => Promise<HTMLCanvasElement>
  ): Promise<ExportResult> {
    try {
      // Load FFmpeg
      this.updateProgress({ status: 'preparing', progress: 0, currentFrame: 0, totalFrames: 0 })
      await this.ffmpeg.load()

      // Get quality preset
      const preset = EXPORT_PRESETS[options.quality]

      // Configure encoder
      this.encoder.configure({
        width: preset.width,
        height: preset.height,
        bitrate: preset.bitrate,
        timebase: preset.framerate,
        bitrateMode: 'constant',
      })

      // Sort effects by track (bottom to top)
      const sortedEffects = this.sortEffectsByTrack(effects)

      // Calculate total duration
      this.timestampEnd = Math.max(
        ...sortedEffects.map(
          (effect) => effect.start_at_position + (effect.end - effect.start)
        )
      )

      const totalFrames = Math.ceil((this.timestampEnd / 1000) * preset.framerate)

      // Start export process
      this.exporting = true
      this.timestamp = 0
      let currentFrame = 0

      // Ported from omniclip Line 64-86
      // Export loop
      while (this.timestamp < this.timestampEnd && this.exporting) {
        // Update progress
        this.updateProgress({
          status: 'composing',
          progress: (this.timestamp / this.timestampEnd) * 100,
          currentFrame,
          totalFrames,
        })

        // Render frame
        this.canvas = await renderFrame(this.timestamp)

        // Encode frame
        this.encoder.encodeComposedFrame(this.canvas, this.timestamp)

        // Advance timestamp
        this.timestamp += 1000 / preset.framerate
        currentFrame++

        // Yield to avoid blocking main thread
        if (currentFrame % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      // Flush encoder and merge audio
      this.updateProgress({ status: 'flushing', progress: 95, currentFrame, totalFrames })

      const file = await this.encoder.exportProcessEnd(
        sortedEffects,
        preset.framerate,
        getMediaFile
      )

      // Complete
      this.updateProgress({ status: 'complete', progress: 100, currentFrame, totalFrames })

      const filename = options.filename || `export_${options.quality}_${Date.now()}.mp4`

      return {
        file,
        filename,
        duration: this.timestampEnd,
        size: file.byteLength,
      }
    } catch (error) {
      this.updateProgress({ status: 'error', progress: 0, currentFrame: 0, totalFrames: 0 })
      throw error
    } finally {
      this.reset()
    }
  }

  // Cancel export
  cancelExport(): void {
    this.exporting = false
    this.reset()
  }

  // Ported from omniclip Line 35-50
  reset(): void {
    this.exporting = false
    this.timestamp = 0
    this.timestampEnd = 0
    this.encoder.reset()
  }

  // Ported from omniclip Line 93-99
  private sortEffectsByTrack(effects: Effect[]): Effect[] {
    return [...effects].sort((a, b) => {
      if (a.track < b.track) return 1
      else return -1
    })
  }

  // Progress callback
  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback
  }

  private updateProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress)
    }
  }

  // Cleanup
  async terminate(): Promise<void> {
    this.encoder.terminate()
    await this.ffmpeg.terminate()
  }
}
