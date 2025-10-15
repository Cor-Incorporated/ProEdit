import { useState, useCallback } from 'react'
import { uploadMediaMetadata } from '@/app/actions/media'
import { calculateFileHash } from '../utils/hash'
import { extractMetadata } from '../utils/metadata'
import { useMediaStore } from '@/stores/media'
import { MediaFile } from '@/types/media'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom hook for media file uploads
 * Handles client-side upload to Supabase Storage, file hashing, and metadata extraction
 * @param projectId Project ID for storage organization
 * @returns Upload utilities and state
 */
export function useMediaUpload(projectId: string) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { addMediaFile, setUploadProgress } = useMediaStore()

  // Soft rate limiting: total size gate
  const MAX_TOTAL_UPLOAD_BYTES = 512 * 1024 * 1024 // 512MB/リクエストの目安
  const MAX_SINGLE_FILE_BYTES = 2 * 1024 * 1024 * 1024 // サーバー側と整合(2GB)

  /**
   * Upload multiple files with deduplication
   * Client-side direct upload to Supabase Storage
   * @param files Array of files to upload
   * @returns Promise<MediaFile[]> Uploaded or existing files
   */
  const uploadFiles = useCallback(
    async (files: File[]): Promise<MediaFile[]> => {
      setIsUploading(true)
      setProgress(0)

      // Basic rate limiting: block too large batches
      const totalBytes = files.reduce((a, f) => a + f.size, 0)
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        setIsUploading(false)
        throw new Error('アップロードサイズが大きすぎます。ファイルを分割してアップロードしてください。')
      }

      try {
        const supabase = createClient()
        const uploadedFiles: MediaFile[] = []
        const totalFiles = files.length

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          if (file.size > MAX_SINGLE_FILE_BYTES) {
            throw new Error('このファイルはサイズ上限(2GB)を超えています')
          }

          // Calculate progress for hash and metadata extraction
          const fileProgress = (i / totalFiles) * 100
          setProgress(fileProgress)
          setUploadProgress(fileProgress)

          // Step 1: Calculate file hash (for deduplication)
          const fileHash = await calculateFileHash(file)

          // Step 2: Extract metadata
          const metadata = await extractMetadata(file)

          // Step 3: Upload directly to Supabase Storage (client-side)
          // Generate unique filename to avoid collisions
          const timestamp = Date.now()
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const fileName = `${timestamp}-${sanitizedName}`
          const filePath = `${user.id}/${projectId}/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error(`Failed to upload file: ${uploadError.message}`)
          }

          // Step 4: Save metadata to database via Server Action
          const uploadedFile = await uploadMediaMetadata({
            fileHash,
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            storagePath: uploadData.path,
            metadata: metadata as unknown as Record<string, unknown>,
          })

          // Step 5: Add to store
          addMediaFile(uploadedFile)
          uploadedFiles.push(uploadedFile)
        }

        // Complete
        setProgress(100)
        setUploadProgress(100)

        // Reset after a short delay
        setTimeout(() => {
          setIsUploading(false)
          setProgress(0)
          setUploadProgress(0)
        }, 500)

        return uploadedFiles
      } catch (error) {
        setIsUploading(false)
        setProgress(0)
        setUploadProgress(0)
        throw error
      }
    },
    [projectId, addMediaFile, setUploadProgress]
  )

  /**
   * Upload a single file
   * @param file File to upload
   * @returns Promise<MediaFile> Uploaded or existing file
   */
  const uploadFile = useCallback(
    async (file: File): Promise<MediaFile> => {
      const files = await uploadFiles([file])
      return files[0]
    },
    [uploadFiles]
  )

  return {
    uploadFiles,
    uploadFile,
    isUploading,
    progress,
  }
}
