// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/parts/decoder.ts (Line 11-118)

export interface DecodedFrame {
  frame: VideoFrame
  effect_id: string
  timestamp: number
  frame_id: string
}

/**
 * Decoder - Manages video decoding with Web Worker
 * Simplified version for ProEdit export functionality
 */
export class Decoder {
  private decodedFrames: Map<string, DecodedFrame> = new Map()
  private decodedEffects: Map<string, string> = new Map()
  private workers: Worker[] = []

  // Ported from omniclip Line 25-31
  reset(): void {
    this.decodedFrames.forEach((decoded) => decoded.frame.close())
    this.decodedFrames.clear()
    this.decodedEffects.clear()
    this.workers.forEach((worker) => worker.terminate())
    this.workers = []
  }

  // Create a decode worker for video decoding
  createDecodeWorker(): Worker {
    const worker = new Worker(new URL('./decoder.worker.ts', import.meta.url), {
      type: 'module',
    })
    this.workers.push(worker)
    return worker
  }

  // Store decoded frame
  storeFrame(frameId: string, frame: DecodedFrame): void {
    this.decodedFrames.set(frameId, frame)
  }

  // Get decoded frame by ID
  getFrame(frameId: string): DecodedFrame | undefined {
    return this.decodedFrames.get(frameId)
  }

  // Delete decoded frame
  deleteFrame(frameId: string): void {
    const frame = this.decodedFrames.get(frameId)
    if (frame) {
      frame.frame.close()
      this.decodedFrames.delete(frameId)
    }
  }

  // Mark effect as decoded
  markEffectDecoded(effectId: string): void {
    this.decodedEffects.set(effectId, effectId)
  }

  // Check if effect is decoded
  isEffectDecoded(effectId: string): boolean {
    return this.decodedEffects.has(effectId)
  }

  // Get all decoded frames for an effect
  getEffectFrames(effectId: string): DecodedFrame[] {
    return Array.from(this.decodedFrames.values()).filter(
      (frame) => frame.effect_id === effectId
    )
  }

  // Find closest frame to timestamp for an effect
  findClosestFrame(effectId: string): DecodedFrame | undefined {
    const frames = this.getEffectFrames(effectId)
    if (frames.length === 0) return undefined

    return frames.sort((a, b) => a.timestamp - b.timestamp)[0]
  }

  // Cleanup
  terminate(): void {
    this.reset()
  }
}
