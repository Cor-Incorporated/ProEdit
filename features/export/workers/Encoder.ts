// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/parts/encoder.ts (Line 7-58)

import { Effect } from '@/types/effects'
import { FFmpegHelper } from '../ffmpeg/FFmpegHelper'

export type ExportStatus =
  | 'idle'
  | 'encoding'
  | 'flushing'
  | 'complete'
  | 'error'

export interface EncoderConfig {
  width: number
  height: number
  bitrate: number
  timebase: number
  bitrateMode?: 'constant' | 'quantizer'
}

/**
 * Encoder - Manages video encoding with Web Worker
 * Ported from omniclip Encoder class
 */
export class Encoder {
  private worker: Worker | null = null
  private ffmpeg: FFmpegHelper
  public file: Uint8Array | null = null
  private status: ExportStatus = 'idle'
  private onStatusChange?: (status: ExportStatus) => void

  constructor(ffmpeg: FFmpegHelper) {
    this.ffmpeg = ffmpeg
    this.initializeWorker()
  }

  // Ported from omniclip Line 8-9, 17-19
  private initializeWorker(): void {
    // Create worker from the encoder worker file
    this.worker = new Worker(
      new URL('./encoder.worker.ts', import.meta.url),
      { type: 'module' }
    )
  }

  // Ported from omniclip Line 16-20
  reset(): void {
    if (this.worker) {
      this.worker.terminate()
    }
    this.initializeWorker()
    this.file = null
    this.status = 'idle'
  }

  // Ported from omniclip Line 53-55
  configure(config: EncoderConfig): void {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }
    this.worker.postMessage({
      action: 'configure',
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      timebase: config.timebase,
      bitrateMode: config.bitrateMode ?? 'constant',
    })
  }

  // Ported from omniclip Line 38-42
  encodeComposedFrame(canvas: HTMLCanvasElement, timestamp: number): void {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const timebase = 30 // Default 30fps
    const frame = new VideoFrame(canvas, this.getFrameConfig(canvas, timestamp, timebase))
    this.worker.postMessage({ frame, action: 'encode' }, [frame as any])
    frame.close()
  }

  // Ported from omniclip Line 44-51
  private getFrameConfig(
    canvas: HTMLCanvasElement,
    timestamp: number,
    timebase: number
  ): VideoFrameInit {
    return {
      displayWidth: canvas.width,
      displayHeight: canvas.height,
      duration: 1000 / timebase, // Frame duration in microseconds
      timestamp: timestamp * 1000, // Timestamp in microseconds
    }
  }

  // Ported from omniclip Line 22-36
  async exportProcessEnd(
    effects: Effect[],
    timebase: number,
    getMediaFile: (fileHash: string) => Promise<File>
  ): Promise<Uint8Array> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    this.setStatus('flushing')

    return new Promise((resolve, reject) => {
      this.worker!.postMessage({ action: 'get-binary' })
      this.worker!.onmessage = async (msg) => {
        try {
          if (msg.data.action === 'binary') {
            const outputName = 'output.mp4'
            await this.ffmpeg.writeFile('composed.h264', msg.data.binary)
            await this.ffmpeg.mergeAudioWithVideoAndMux(
              effects,
              'composed.h264',
              outputName,
              getMediaFile,
              timebase
            )
            const muxedFile = await this.ffmpeg.readFile(outputName)
            this.file = muxedFile
            this.setStatus('complete')
            resolve(muxedFile)
          } else if (msg.data.action === 'error') {
            this.setStatus('error')
            reject(new Error(msg.data.error))
          }
        } catch (error) {
          this.setStatus('error')
          reject(error)
        }
      }
    })
  }

  // Status management
  private setStatus(status: ExportStatus): void {
    this.status = status
    if (this.onStatusChange) {
      this.onStatusChange(status)
    }
  }

  getStatus(): ExportStatus {
    return this.status
  }

  onStatus(callback: (status: ExportStatus) => void): void {
    this.onStatusChange = callback
  }

  // Cleanup
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}
