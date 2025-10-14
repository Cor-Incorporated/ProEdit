// Export-related type definitions

export type ExportQuality = '720p' | '1080p' | '4k'

export interface ExportQualityPreset {
  width: number
  height: number
  bitrate: number // in kbps
  framerate: number
}

export const EXPORT_PRESETS: Record<ExportQuality, ExportQualityPreset> = {
  '720p': {
    width: 1280,
    height: 720,
    bitrate: 3000,
    framerate: 30,
  },
  '1080p': {
    width: 1920,
    height: 1080,
    bitrate: 6000,
    framerate: 30,
  },
  '4k': {
    width: 3840,
    height: 2160,
    bitrate: 9000,
    framerate: 30,
  },
}

export type ExportStatus =
  | 'idle'
  | 'preparing'
  | 'composing'
  | 'encoding'
  | 'flushing'
  | 'complete'
  | 'error'

export interface ExportProgress {
  status: ExportStatus
  progress: number // 0-100
  currentFrame: number
  totalFrames: number
  estimatedTimeRemaining?: number // in seconds
}

export interface ExportOptions {
  projectId: string
  quality: ExportQuality
  includeAudio: boolean
  filename?: string
}

export interface ExportResult {
  file: Uint8Array
  filename: string
  duration: number // in ms
  size: number // in bytes
}
