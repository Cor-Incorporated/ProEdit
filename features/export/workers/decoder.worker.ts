// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/parts/decode_worker.ts (Line 1-108)

let timestamp = 0
let start = 0
let end = 0
let effectId = ''

let timebase = 0
let timestampEnd = 0
let lastProcessedTimestamp = 0
let timebaseInMicroseconds = (1000 / 25) * 1000

// Ported from omniclip Line 13-24
const decoder = new VideoDecoder({
  output(frame: VideoFrame) {
    const frameTimestamp = frame.timestamp / 1000
    if (frameTimestamp < start) {
      frame.close()
      return
    }

    processFrame(frame, timebaseInMicroseconds)
  },
  error: (e: Error) => {
    console.error('Decoder error:', e)
    self.postMessage({ action: 'error', error: e.message })
  },
})

// Ported from omniclip Line 26-31
const interval = setInterval(() => {
  if (timestamp >= timestampEnd) {
    self.postMessage({ action: 'end' })
  }
}, 100)

// Ported from omniclip Line 33-35
decoder.addEventListener('dequeue', () => {
  self.postMessage({ action: 'dequeue', size: decoder.decodeQueueSize })
})

// Ported from omniclip Line 37-54
self.addEventListener('message', async (message) => {
  const { data } = message

  if (data.action === 'demux') {
    timestamp = data.starting_timestamp
    timebase = data.timebase
    timebaseInMicroseconds = (1000 / timebase) * 1000
    start = data.props.start
    end = data.props.end
    effectId = data.props.id
    timestampEnd = data.starting_timestamp + (data.props.end - data.props.start)
  }

  if (data.action === 'configure') {
    decoder.configure(data.config)
    await decoder.flush()
  }

  if (data.action === 'chunk') {
    decoder.decode(data.chunk)
  }

  if (data.action === 'terminate') {
    clearInterval(interval)
    self.close()
  }
})

// Ported from omniclip Line 62-107
/**
 * processFrame - Maintains video framerate to desired timebase
 * Handles frame duplication and skipping to match target framerate
 */
function processFrame(currentFrame: VideoFrame, targetFrameInterval: number) {
  if (lastProcessedTimestamp === 0) {
    self.postMessage({
      action: 'new-frame',
      frame: {
        timestamp,
        frame: currentFrame,
        effect_id: effectId,
      },
    })
    timestamp += 1000 / timebase
    lastProcessedTimestamp += currentFrame.timestamp
  }

  // If met frame is duplicated (slow source)
  while (currentFrame.timestamp >= lastProcessedTimestamp + targetFrameInterval) {
    self.postMessage({
      action: 'new-frame',
      frame: {
        timestamp,
        frame: currentFrame,
        effect_id: effectId,
      },
    })

    timestamp += 1000 / timebase
    lastProcessedTimestamp += targetFrameInterval
  }

  // If not met frame is skipped (fast source)
  if (currentFrame.timestamp >= lastProcessedTimestamp) {
    self.postMessage({
      action: 'new-frame',
      frame: {
        timestamp,
        frame: currentFrame,
        effect_id: effectId,
      },
    })

    timestamp += 1000 / timebase
    lastProcessedTimestamp += targetFrameInterval
  }

  currentFrame.close()
}
