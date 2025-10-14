// WebCodecs feature detection and configuration

export interface CodecSupport {
  webCodecs: boolean
  videoEncoder: boolean
  videoDecoder: boolean
  h264: boolean
  vp9: boolean
  av1: boolean
}

/**
 * Check if WebCodecs API is supported
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'VideoEncoder' in window &&
    'VideoDecoder' in window
  )
}

/**
 * Check specific codec support
 */
export async function checkCodecSupport(codec: string): Promise<boolean> {
  if (!isWebCodecsSupported()) {
    return false
  }

  try {
    const config: VideoEncoderConfig = {
      codec,
      width: 1920,
      height: 1080,
      bitrate: 6_000_000,
      framerate: 30,
    }

    const support = await VideoEncoder.isConfigSupported(config)
    return support.supported || false
  } catch (error) {
    console.error(`Codec ${codec} check failed:`, error)
    return false
  }
}

/**
 * Get comprehensive codec support information
 */
export async function getCodecSupport(): Promise<CodecSupport> {
  const webCodecs = isWebCodecsSupported()

  if (!webCodecs) {
    return {
      webCodecs: false,
      videoEncoder: false,
      videoDecoder: false,
      h264: false,
      vp9: false,
      av1: false,
    }
  }

  const [h264, vp9, av1] = await Promise.all([
    checkCodecSupport('avc1.640034'), // H.264 High Profile
    checkCodecSupport('vp09.02.60.10.01.09.09.1'), // VP9
    checkCodecSupport('av01.0.08M.08'), // AV1
  ])

  return {
    webCodecs: true,
    videoEncoder: 'VideoEncoder' in window,
    videoDecoder: 'VideoDecoder' in window,
    h264,
    vp9,
    av1,
  }
}

/**
 * Get encoder configuration for specified quality
 * From omniclip reference
 */
export function getEncoderConfig(
  width: number,
  height: number,
  bitrate: number,
  framerate: number
): VideoEncoderConfig {
  return {
    codec: 'avc1.640034', // H.264 High Profile (best compatibility)
    avc: { format: 'annexb' }, // Annex B format for FFmpeg
    width,
    height,
    bitrate: bitrate * 1000, // Convert kbps to bps
    framerate,
    bitrateMode: 'constant', // Constant bitrate for predictable file sizes
  }
}

/**
 * Get decoder configuration
 */
export function getDecoderConfig(): VideoDecoderConfig {
  return {
    codec: 'avc1.640034', // H.264 High Profile
  }
}

/**
 * Available codecs for reference
 */
export const AVAILABLE_CODECS = {
  h264_baseline: 'avc1.42001E',
  h264_main: 'avc1.4d002a',
  h264_high: 'avc1.640034', // Default - best compatibility
  vp9: 'vp09.02.60.10.01.09.09.1',
  av1: 'av01.0.08M.08',
} as const
