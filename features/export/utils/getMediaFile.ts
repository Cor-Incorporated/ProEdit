/**
 * Get media file as File object by file hash
 * Used by ExportController to fetch source media files for export
 * Ported from omniclip export workflow
 */

import { getSignedUrl } from '@/app/actions/media'
import { createClient } from '@/lib/supabase/server'

/**
 * Get File object from media file hash
 * Required by ExportController.startExport() third argument
 *
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
