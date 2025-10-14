'use client'

import { MediaFile, isVideoMetadata, isAudioMetadata, isImageMetadata } from '@/types/media'
import { Card } from '@/components/ui/card'
import { FileVideo, FileAudio, FileImage, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { deleteMedia } from '@/app/actions/media'
import { createEffectFromMediaFile } from '@/app/actions/effects'
import { useMediaStore } from '@/stores/media'
import { useTimelineStore } from '@/stores/timeline'
import { toast } from 'sonner'

interface MediaCardProps {
  media: MediaFile
  projectId: string
}

export function MediaCard({ media, projectId }: MediaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const { removeMediaFile, toggleMediaSelection, selectedMediaIds } = useMediaStore()
  const { addEffect } = useTimelineStore()
  const isSelected = selectedMediaIds.includes(media.id)

  // Get icon based on media type
  const getIcon = () => {
    if (isVideoMetadata(media.metadata)) {
      return <FileVideo className="h-12 w-12 text-muted-foreground" />
    } else if (isAudioMetadata(media.metadata)) {
      return <FileAudio className="h-12 w-12 text-muted-foreground" />
    } else if (isImageMetadata(media.metadata)) {
      return <FileImage className="h-12 w-12 text-muted-foreground" />
    }
    return <FileVideo className="h-12 w-12 text-muted-foreground" />
  }

  // Get duration string
  const getDuration = () => {
    if (isVideoMetadata(media.metadata) || isAudioMetadata(media.metadata)) {
      const duration = media.metadata.duration
      const minutes = Math.floor(duration / 60)
      const seconds = Math.floor(duration % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return null
  }

  // Get dimensions string
  const getDimensions = () => {
    if (isVideoMetadata(media.metadata) || isImageMetadata(media.metadata)) {
      return `${media.metadata.width}x${media.metadata.height}`
    }
    return null
  }

  // Handle add to timeline
  const handleAddToTimeline = async (e: React.MouseEvent) => {
    e.stopPropagation()

    setIsAdding(true)
    try {
      // createEffectFromMediaFile automatically calculates optimal position and track
      const effect = await createEffectFromMediaFile(
        projectId,
        media.id,
        undefined, // Auto-calculate position
        undefined  // Auto-calculate track
      )

      addEffect(effect)
      toast.success('Added to timeline', {
        description: media.filename
      })
    } catch (error) {
      toast.error('Failed to add to timeline', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsAdding(false)
    }
  }

  // Handle delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this media file?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteMedia(media.id)
      removeMediaFile(media.id)
      toast.success('Media deleted')
    } catch (error) {
      toast.error('Failed to delete media', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle click to select
  const handleClick = () => {
    toggleMediaSelection(media.id)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card
      className={`
        media-card p-4 cursor-pointer hover:bg-accent transition-colors
        ${isSelected ? 'ring-2 ring-primary' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex flex-col space-y-2">
        {/* Thumbnail or Icon */}
        <div className="flex items-center justify-center h-24 bg-muted rounded">
          {isVideoMetadata(media.metadata) && media.metadata.thumbnail ? (
            <img
              src={media.metadata.thumbnail}
              alt={media.filename}
              className="h-full w-full object-cover rounded"
            />
          ) : (
            getIcon()
          )}
        </div>

        {/* File info */}
        <div className="space-y-1">
          <p className="text-sm font-medium truncate" title={media.filename}>
            {media.filename}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(media.file_size)}</span>
            {getDuration() && <span>{getDuration()}</span>}
          </div>
          {getDimensions() && (
            <p className="text-xs text-muted-foreground">{getDimensions()}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleAddToTimeline}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isAdding ? 'Adding...' : 'Add'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
