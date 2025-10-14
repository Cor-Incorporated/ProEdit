// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/parts/encode_worker.ts (Line 1-74)

import { BinaryAccumulator } from '../utils/BinaryAccumulator'

const binaryAccumulator = new BinaryAccumulator()
let getChunks = false

// Ported from omniclip Line 6-19
async function handleChunk(chunk: EncodedVideoChunk) {
  let chunkData = new Uint8Array(chunk.byteLength)
  chunk.copyTo(chunkData)
  binaryAccumulator.addChunk(chunkData)

  if (getChunks) {
    self.postMessage({
      action: 'chunk',
      chunk: chunkData,
    })
  }

  // Release memory
  chunkData = null as any
}

// Ported from omniclip Line 22-30
// Default encoder configuration (H.264 High Profile)
const config: VideoEncoderConfig = {
  codec: 'avc1.640034', // H.264 High Profile
  avc: { format: 'annexb' },
  width: 1280,
  height: 720,
  bitrate: 9_000_000, // 9 Mbps
  framerate: 60,
  bitrateMode: 'quantizer', // variable bitrate for better quality
}

// Ported from omniclip Line 32-41
const encoder = new VideoEncoder({
  output: handleChunk,
  error: (e: Error) => {
    console.error('Encoder error:', e.message)
    self.postMessage({ action: 'error', error: e.message })
  },
})

encoder.addEventListener('dequeue', () => {
  self.postMessage({ action: 'dequeue', size: encoder.encodeQueueSize })
})

// Ported from omniclip Line 43-67
self.addEventListener('message', async (message) => {
  const { data } = message

  // Configure encoder
  if (data.action === 'configure') {
    config.bitrate = data.bitrate * 1000 // Convert kbps to bps
    config.width = data.width
    config.height = data.height
    config.framerate = data.timebase
    config.bitrateMode = data.bitrateMode ?? 'constant'
    getChunks = data.getChunks
    encoder.configure(config)
    self.postMessage({ action: 'configured' })
  }

  // Encode a frame
  if (data.action === 'encode') {
    const frame = data.frame as VideoFrame
    try {
      if (config.bitrateMode === 'quantizer') {
        // Use constant quantizer for variable bitrate
        // @ts-ignore - quantizer option is not in types
        encoder.encode(frame, { avc: { quantizer: 35 } })
      } else {
        encoder.encode(frame)
      }
      frame.close()
    } catch (error) {
      console.error('Frame encode error:', error)
      self.postMessage({ action: 'error', error: String(error) })
    }
  }

  // Flush encoder and return binary
  if (data.action === 'get-binary') {
    try {
      await encoder.flush()
      self.postMessage({ action: 'binary', binary: binaryAccumulator.binary })
    } catch (error) {
      console.error('Flush error:', error)
      self.postMessage({ action: 'error', error: String(error) })
    }
  }

  // Reset encoder
  if (data.action === 'reset') {
    binaryAccumulator.clearBinary()
    self.postMessage({ action: 'reset-complete' })
  }
})

// Supported codecs for reference:
// - avc1.42001E (H.264 Baseline)
// - avc1.4d002a (H.264 Main)
// - avc1.640034 (H.264 High) ← Using this
// - vp09.02.60.10.01.09.09.1 (VP9)
// - av01.0.08M.08 (AV1)
