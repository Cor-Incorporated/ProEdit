'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadMediaFile, deleteMediaFile } from '@/lib/supabase/utils'
import { revalidatePath } from 'next/cache'
import { MediaFile } from '@/types/media'

// Security: Maximum file size (2GB - aligned with Supabase storage limit)
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

/**
 * Save media file metadata to database with hash-based deduplication
 * Client-side upload to Supabase Storage should be done before calling this
 * Returns existing file if hash matches (FR-012 compliance)
 * @param params Media file metadata
 * @returns Promise<MediaFile> The created or existing media file record
 */
export async function uploadMediaMetadata(params: {
  fileHash: string
  filename: string
  fileSize: number
  mimeType: string
  storagePath: string
  metadata: Record<string, unknown>
}): Promise<MediaFile> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Security: Validate file size
  if (params.fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`)
  }

  // Security: Validate file size is positive
  if (params.fileSize <= 0) {
    throw new Error('Invalid file size')
  }

  // CRITICAL: Hash-based deduplication check (FR-012)
  // If file with same hash exists for this user, reuse it
  const { data: existing } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user.id)
    .eq('file_hash', params.fileHash)
    .single()

  if (existing) {
    console.log('File already exists (hash match), reusing:', existing.id)
    return existing as MediaFile
  }

  // New file - insert metadata into database
  const { data, error } = await supabase
    .from('media_files')
    .insert({
      user_id: user.id,
      file_hash: params.fileHash,
      filename: params.filename,
      file_size: params.fileSize,
      mime_type: params.mimeType,
      storage_path: params.storagePath,
      metadata: params.metadata as unknown as Record<string, unknown>,
    })
    .select()
    .single()

  if (error) {
    console.error('Insert media error:', error)
    throw new Error(error.message)
  }

  return data as MediaFile
}

/**
 * @deprecated Use uploadMediaMetadata instead. This function is kept for backward compatibility.
 * Upload media file with hash-based deduplication
 * Returns existing file if hash matches (FR-012 compliance)
 * @param projectId Project ID (for storage organization)
 * @param file File to upload
 * @param fileHash SHA-256 hash of the file
 * @param metadata Extracted metadata (duration, dimensions, etc.)
 * @returns Promise<MediaFile> The uploaded or existing media file
 */
export async function uploadMedia(
  projectId: string,
  file: File,
  fileHash: string,
  metadata: Record<string, unknown>
): Promise<MediaFile> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Security: Validate file size before upload
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`)
  }

  // Security: Validate file size is positive
  if (file.size <= 0) {
    throw new Error('Invalid file size')
  }

  // CRITICAL: Hash-based deduplication check (FR-012)
  // If file with same hash exists for this user, reuse it
  const { data: existing } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user.id)
    .eq('file_hash', fileHash)
    .single()

  if (existing) {
    console.log('File already exists (hash match), reusing:', existing.id)
    return existing as MediaFile
  }

  // New file - upload to storage
  const storagePath = await uploadMediaFile(file, user.id, projectId)

  // Insert into database
  const { data, error } = await supabase
    .from('media_files')
    .insert({
      user_id: user.id,
      file_hash: fileHash,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      metadata: metadata as unknown as Record<string, unknown>,
    })
    .select()
    .single()

  if (error) {
    console.error('Insert media error:', error)
    throw new Error(error.message)
  }

  revalidatePath(`/editor/${projectId}`)
  return data as MediaFile
}

/**
 * Get all media files for the current user
 * Note: media_files table doesn't have project_id column
 * Files are shared across all user's projects
 * @returns Promise<MediaFile[]> Array of media files
 */
export async function getMediaFiles(): Promise<MediaFile[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get media files error:', error)
    throw new Error(error.message)
  }

  return data as MediaFile[]
}

/**
 * Get a single media file by ID
 * @param mediaId Media file ID
 * @returns Promise<MediaFile> The media file
 */
export async function getMediaFile(mediaId: string): Promise<MediaFile> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Get media file error:', error)
    throw new Error(error.message)
  }

  return data as MediaFile
}

/**
 * Delete a media file
 * Removes from both storage and database
 * Also deletes all effects that reference this media file
 * @param mediaId Media file ID
 * @returns Promise<void>
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get media file info
  const { data: media } = await supabase
    .from('media_files')
    .select('storage_path')
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (!media) throw new Error('Media not found')

  // CRITICAL: Delete all effects that reference this media file first
  // This prevents foreign key constraint violations
  const { error: effectsError } = await supabase
    .from('effects')
    .delete()
    .eq('media_file_id', mediaId)

  if (effectsError) {
    console.error('Failed to delete associated effects:', effectsError)
    throw new Error(`Failed to delete associated effects: ${effectsError.message}`)
  }

  // Delete from storage
  await deleteMediaFile(media.storage_path)

  // Delete from database
  const { error } = await supabase
    .from('media_files')
    .delete()
    .eq('id', mediaId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete media error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/editor')
}

/**
 * Get signed URL for media file
 * Used for secure access to private media files
 * @param storagePath Storage path of the media file
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Promise<string> Signed URL
 */
export async function getMediaSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.storage
    .from('media-files')
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    console.error('Get signed URL error:', error)
    throw new Error(error.message)
  }

  if (!data.signedUrl) {
    throw new Error('Failed to generate signed URL')
  }

  return data.signedUrl
}

/**
 * Get signed URL for media file by media file ID
 * Used by compositor to access media files securely
 * @param mediaFileId Media file ID
 * @returns Promise<string> Signed URL
 */
export async function getSignedUrl(mediaFileId: string): Promise<string> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get media file info
  const { data: media } = await supabase
    .from('media_files')
    .select('storage_path')
    .eq('id', mediaFileId)
    .eq('user_id', user.id)
    .single()

  if (!media) throw new Error('Media not found')

  // Get signed URL for the storage path
  return getMediaSignedUrl(media.storage_path)
}

/**
 * Get File object from media file hash
 * Used by ExportController to fetch source media files for export
 * Ported from omniclip export workflow
 * @param fileHash SHA-256 hash of the media file
 * @returns Promise<File> File object containing the media data
 * @throws Error if file not found or fetch fails
 */
export async function getMediaFileByHash(fileHash: string): Promise<File> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get media file by hash
  const { data: media, error } = await supabase
    .from('media_files')
    .select('id, filename, mime_type, storage_path')
    .eq('user_id', user.id)
    .eq('file_hash', fileHash)
    .single()

  if (error || !media) {
    throw new Error(`Media file not found for hash: ${fileHash}`)
  }

  // 2. Get signed URL for secure access
  const signedUrl = await getSignedUrl(media.id)

  // 3. Fetch file as Blob
  const response = await fetch(signedUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch media file: ${response.statusText}`)
  }

  const blob = await response.blob()

  // 4. Convert Blob to File object
  const file = new File([blob], media.filename, {
    type: media.mime_type,
  })

  return file
}
