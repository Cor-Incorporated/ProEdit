import { useState, useCallback } from 'react'
import { uploadMedia } from '@/app/actions/media'
import { calculateFileHash } from '../utils/hash'
import { extractMetadata } from '../utils/metadata'
import { useMediaStore } from '@/stores/media'
import { MediaFile } from '@/types/media'

/**
 * Custom hook for media file uploads
 * Handles file hashing, metadata extraction, and upload to server
 * @param projectId Project ID for storage organization
 * @returns Upload utilities and state
 */
export function useMediaUpload(projectId: string) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { addMediaFile, setUploadProgress } = useMediaStore()

  /**
   * Upload multiple files with deduplication
   * @param files Array of files to upload
   * @returns Promise<MediaFile[]> Uploaded or existing files
   */
  const uploadFiles = useCallback(
    async (files: File[]): Promise<MediaFile[]> => {
      setIsUploading(true)
      setProgress(0)

      try {
        const uploadedFiles: MediaFile[] = []
        const totalFiles = files.length

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Calculate progress
          const fileProgress = (i / totalFiles) * 100
          setProgress(fileProgress)
          setUploadProgress(fileProgress)

          // Step 1: Calculate file hash (for deduplication)
          const fileHash = await calculateFileHash(file)

          // Step 2: Extract metadata
          const metadata = await extractMetadata(file)

          // Step 3: Upload to server (or get existing file)
          const uploadedFile = await uploadMedia(
            projectId,
            file,
            fileHash,
            metadata as unknown as Record<string, unknown>
          )

          // Step 4: Add to store
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
