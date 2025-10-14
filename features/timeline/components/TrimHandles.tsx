/**
 * TrimHandles component
 * Provides visual handles for trimming effect start/end points
 */

'use client'

import { useState, useRef } from 'react'
import { Effect } from '@/types/effects'
import { useTrimHandler } from '../hooks/useTrimHandler'
import { useTimelineStore } from '@/stores/timeline'
import { useHistoryStore } from '@/stores/history'

interface TrimHandlesProps {
  effect: Effect
  isSelected: boolean
}

export function TrimHandles({ effect, isSelected }: TrimHandlesProps) {
  const { startTrim, onTrimMove, endTrim, cancelTrim } = useTrimHandler()
  const { effects, updateEffect: updateStoreEffect } = useTimelineStore()
  const { recordSnapshot } = useHistoryStore()
  const [isDragging, setIsDragging] = useState(false)
  const [trimSide, setTrimSide] = useState<'start' | 'end' | null>(null)
  const finalUpdatesRef = useRef<Partial<Effect>>({})

  if (!isSelected) return null

  const handleMouseDown = (
    e: React.MouseEvent,
    side: 'start' | 'end'
  ) => {
    e.stopPropagation()
    e.preventDefault()

    // Record snapshot before trim
    recordSnapshot(effects, `Trim ${side} of ${effect.kind}`)

    setIsDragging(true)
    setTrimSide(side)

    startTrim(effect, side, e.clientX)

    const handleMouseMove = (moveE: MouseEvent) => {
      const updates = onTrimMove(moveE.clientX)
      if (updates) {
        finalUpdatesRef.current = updates
        // Optimistically update store for immediate feedback
        updateStoreEffect(effect.id, updates)
      }
    }

    const handleMouseUp = async () => {
      setIsDragging(false)
      setTrimSide(null)

      // Persist final updates
      if (Object.keys(finalUpdatesRef.current).length > 0) {
        await endTrim(effect, finalUpdatesRef.current)
        finalUpdatesRef.current = {}
      }

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    const handleEscape = (keyE: KeyboardEvent) => {
      if (keyE.key === 'Escape') {
        cancelTrim()
        setIsDragging(false)
        setTrimSide(null)
        finalUpdatesRef.current = {}
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('keydown', handleEscape)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleEscape)
  }

  return (
    <>
      {/* Left trim handle (start) */}
      <div
        className={`
          absolute left-0 top-0 bottom-0 w-1
          bg-white/30 hover:bg-white cursor-ew-resize group z-10
          ${trimSide === 'start' && isDragging ? 'bg-white' : ''}
        `}
        onMouseDown={(e) => handleMouseDown(e, 'start')}
        title="Trim start point"
      >
        <div className={`
          absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8
          bg-white rounded-r group-hover:bg-blue-500 transition-colors
          ${trimSide === 'start' && isDragging ? 'bg-blue-500' : ''}
        `} />
      </div>

      {/* Right trim handle (end) */}
      <div
        className={`
          absolute right-0 top-0 bottom-0 w-1
          bg-white/30 hover:bg-white cursor-ew-resize group z-10
          ${trimSide === 'end' && isDragging ? 'bg-white' : ''}
        `}
        onMouseDown={(e) => handleMouseDown(e, 'end')}
        title="Trim end point"
      >
        <div className={`
          absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8
          bg-white rounded-l group-hover:bg-blue-500 transition-colors
          ${trimSide === 'end' && isDragging ? 'bg-blue-500' : ''}
        `} />
      </div>

      {/* Visual feedback during trim */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 pointer-events-none z-5" />
      )}
    </>
  )
}
