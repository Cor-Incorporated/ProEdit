/**
 * Media file type definitions
 */

export type MediaType = "video" | "audio" | "image";

export interface VideoMetadata {
  duration: number;
  fps: number;
  frames: number;
  width: number;
  height: number;
  codec: string;
  thumbnail?: string; // Base64 or URL
}

export interface AudioMetadata {
  duration: number;
  bitrate: number;
  channels: number;
  sampleRate: number;
  codec: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

export type MediaMetadata = VideoMetadata | AudioMetadata | ImageMetadata;

export interface MediaFile {
  id: string;
  user_id: string;
  file_hash: string;
  filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  metadata: MediaMetadata;
  created_at: string;
}

// Upload payload
export interface MediaUploadPayload {
  file: File;
  onProgress?: (progress: number) => void;
}

// Helper functions
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

export function isVideoMetadata(metadata: MediaMetadata): metadata is VideoMetadata {
  return "fps" in metadata && "frames" in metadata;
}

export function isAudioMetadata(metadata: MediaMetadata): metadata is AudioMetadata {
  return "bitrate" in metadata && "channels" in metadata;
}

export function isImageMetadata(metadata: MediaMetadata): metadata is ImageMetadata {
  return "format" in metadata && !("fps" in metadata) && !("bitrate" in metadata);
}

// File size limits
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_STORAGE_PER_USER = 10 * 1024 * 1024 * 1024; // 10GB

// Supported MIME types
export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

export const SUPPORTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES,
  ...SUPPORTED_IMAGE_TYPES,
];
