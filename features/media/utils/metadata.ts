import { VideoMetadata, AudioMetadata, ImageMetadata, MediaType, getMediaType } from '@/types/media'

/**
 * Extract metadata from video file
 * Uses HTML5 video element for basic metadata extraction
 * @param file Video file
 * @returns Promise<VideoMetadata>
 */
async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        fps: 30, // Default FPS (accurate detection requires MediaInfo.js)
        frames: Math.floor(video.duration * 30),
        width: video.videoWidth,
        height: video.videoHeight,
        codec: 'unknown', // Requires MediaInfo.js for accurate detection
        thumbnail: '', // Generated separately
      }

      URL.revokeObjectURL(video.src)
      resolve(metadata)
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from audio file
 * Uses HTML5 audio element for basic metadata extraction
 * @param file Audio file
 * @returns Promise<AudioMetadata>
 */
async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'

    audio.onloadedmetadata = () => {
      const metadata: AudioMetadata = {
        duration: audio.duration,
        bitrate: 128000, // Default bitrate (requires MediaInfo.js)
        channels: 2, // Default stereo (requires MediaInfo.js)
        sampleRate: 48000, // Default sample rate (requires MediaInfo.js)
        codec: 'unknown',
      }

      URL.revokeObjectURL(audio.src)
      resolve(metadata)
    }

    audio.onerror = () => {
      URL.revokeObjectURL(audio.src)
      reject(new Error('Failed to load audio metadata'))
    }

    audio.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from image file
 * Uses HTML5 Image for metadata extraction
 * @param file Image file
 * @returns Promise<ImageMetadata>
 */
async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        format: file.type.split('/')[1] || 'unknown',
      }

      URL.revokeObjectURL(img.src)
      resolve(metadata)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image metadata'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Extract metadata from any supported media file
 * Automatically detects media type and extracts appropriate metadata
 * @param file Media file
 * @returns Promise<VideoMetadata | AudioMetadata | ImageMetadata>
 */
export async function extractMetadata(file: File): Promise<VideoMetadata | AudioMetadata | ImageMetadata> {
  const mediaType = getMediaType(file.type)

  switch (mediaType) {
    case 'video':
      return extractVideoMetadata(file)
    case 'audio':
      return extractAudioMetadata(file)
    case 'image':
      return extractImageMetadata(file)
    default:
      throw new Error(`Unsupported media type: ${file.type}`)
  }
}

/**
 * Extract metadata from multiple files in parallel
 * @param files Array of media files
 * @returns Promise<Map<File, VideoMetadata | AudioMetadata | ImageMetadata>>
 */
export async function extractMetadataFromFiles(
  files: File[]
): Promise<Map<File, VideoMetadata | AudioMetadata | ImageMetadata>> {
  const metadataMap = new Map<File, VideoMetadata | AudioMetadata | ImageMetadata>()

  const metadataPromises = files.map(async (file) => {
    const metadata = await extractMetadata(file)
    return { file, metadata }
  })

  const results = await Promise.all(metadataPromises)
  results.forEach(({ file, metadata }) => {
    metadataMap.set(file, metadata)
  })

  return metadataMap
}
