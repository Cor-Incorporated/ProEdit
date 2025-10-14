'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Progress } from '@/components/ui/progress'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload'
import {
  SUPPORTED_VIDEO_TYPES,
  SUPPORTED_AUDIO_TYPES,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE
} from '@/types/media'

interface MediaUploadProps {
  projectId: string
}

export function MediaUpload({ projectId }: MediaUploadProps) {
  const { uploadFiles, isUploading, progress } = useMediaUpload(projectId)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // File size check
    const oversized = acceptedFiles.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      toast.error('File too large', {
        description: `Maximum file size is 500MB. ${oversized.length} file(s) rejected.`
      })
      return
    }

    if (acceptedFiles.length === 0) {
      return
    }

    try {
      await uploadFiles(acceptedFiles)
      toast.success('Upload complete', {
        description: `${acceptedFiles.length} file(s) uploaded successfully`
      })
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }, [uploadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': SUPPORTED_VIDEO_TYPES,
      'audio/*': SUPPORTED_AUDIO_TYPES,
      'image/*': SUPPORTED_IMAGE_TYPES,
    },
    disabled: isUploading,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
      `}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Uploading...</p>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop files here' : 'Drag and drop files'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to select files
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports video, audio, and images up to 500MB
          </p>
        </div>
      )}
    </div>
  )
}
