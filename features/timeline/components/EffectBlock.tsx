'use client'

import { Effect, isVideoEffect, isAudioEffect, isImageEffect, isTextEffect } from '@/types/effects'
import { useTimelineStore } from '@/stores/timeline'
import { FileVideo, FileAudio, FileImage, Type } from 'lucide-react'
import { TrimHandles } from './TrimHandles'

interface EffectBlockProps {
  effect: Effect
}

export function EffectBlock({ effect }: EffectBlockProps) {
  const { zoom, selectedEffectIds, toggleEffectSelection } = useTimelineStore()
  const isSelected = selectedEffectIds.includes(effect.id)

  // Calculate visual width based on duration and zoom
  // zoom = pixels per second, duration in ms
  const width = (effect.duration / 1000) * zoom

  // Calculate left position based on start_at_position and zoom
  const left = (effect.start_at_position / 1000) * zoom

  // Get color based on effect type
  const getColor = () => {
    if (isVideoEffect(effect)) return 'bg-blue-500'
    if (isAudioEffect(effect)) return 'bg-green-500'
    if (isImageEffect(effect)) return 'bg-purple-500'
    if (isTextEffect(effect)) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  // Get icon based on effect type
  const getIcon = () => {
    if (isVideoEffect(effect)) return <FileVideo className="h-4 w-4" />
    if (isAudioEffect(effect)) return <FileAudio className="h-4 w-4" />
    if (isImageEffect(effect)) return <FileImage className="h-4 w-4" />
    if (isTextEffect(effect)) return <Type className="h-4 w-4" />
    return null
  }

  // Get label
  const getLabel = (): string => {
    if (isVideoEffect(effect) || isImageEffect(effect) || isAudioEffect(effect)) {
      return effect.name || effect.media_file_id || 'Untitled'
    }
    if (isTextEffect(effect)) {
      return effect.properties.text.substring(0, 20)
    }
    return 'Unknown'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleEffectSelection(effect.id)
  }

  return (
    <div
      className={`
        effect-block absolute h-10 rounded cursor-pointer
        flex items-center px-2 space-x-2
        transition-all hover:opacity-80
        ${getColor()}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}
      `}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`, // Minimum 20px width
      }}
      onClick={handleClick}
      title={`${effect.kind}: ${getLabel()}`}
    >
      {getIcon()}
      <span className="text-white text-xs truncate">
        {getLabel()}
      </span>

      {/* Phase 6: Trim handles */}
      <TrimHandles effect={effect} isSelected={isSelected} />
    </div>
  )
}
