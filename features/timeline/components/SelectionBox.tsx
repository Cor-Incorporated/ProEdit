'use client'

// T069: Selection Box Component for multi-selection on timeline

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTimelineStore } from '@/stores/timeline'
import { Effect } from '@/types/effects'

/**
 * SelectionBox - Multi-selection box for timeline effects
 *
 * Features:
 * - Drag to create selection rectangle
 * - Detects overlapping effect blocks
 * - Shift+click for additive selection
 * - Esc to clear selection
 */
export function SelectionBox() {
  const { effects, selectedEffectIds, clearSelection, zoom } = useTimelineStore()
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle mouse down to start selection
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore if clicking on an effect block (check if target is timeline-tracks)
    if (!(e.target as HTMLElement).classList.contains('timeline-tracks-overlay')) {
      return
    }

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top

    setIsSelecting(true)
    setSelectionBox({ startX, startY, endX: startX, endY: startY })
  }

  // Handle mouse move while selecting
  // FIXED: Use useCallback to prevent infinite loop in useEffect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top

    setSelectionBox((prev) => ({ ...prev, endX, endY }))
  }, [])

  // Handle mouse up to finish selection
  // FIXED: Use useCallback to prevent infinite loop in useEffect
  const handleMouseUp = useCallback(() => {
    // Calculate which effects are within selection box
    const currentBox = selectionBox
    const selectedIds = getEffectsInBox(currentBox, effects, zoom)

    // Update selected effects (replace existing selection unless Shift key is held)
    // For simplicity, always replace for now - Shift+click on individual blocks handled separately
    if (selectedIds.length > 0) {
      useTimelineStore.setState({ selectedEffectIds: selectedIds })
    }

    setIsSelecting(false)
    setSelectionBox({ startX: 0, startY: 0, endX: 0, endY: 0 })
  }, [selectionBox, effects, zoom])

  // Handle Esc key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection])

  // Add mouse move/up listeners when selecting
  // FIXED: Removed selectionBox from deps to prevent infinite loop
  // The selectionBox state change should NOT trigger re-adding listeners
  useEffect(() => {
    if (!isSelecting) return

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isSelecting, handleMouseMove, handleMouseUp])

  // Calculate selection box styles
  const boxStyles = isSelecting
    ? {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY),
      }
    : null

  return (
    <div
      ref={containerRef}
      className="timeline-tracks-overlay absolute inset-0 pointer-events-auto"
      onMouseDown={handleMouseDown}
      style={{ zIndex: 10 }}
    >
      {isSelecting && boxStyles && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 rounded pointer-events-none"
          style={{
            left: `${boxStyles.left}px`,
            top: `${boxStyles.top}px`,
            width: `${boxStyles.width}px`,
            height: `${boxStyles.height}px`,
          }}
        />
      )}
    </div>
  )
}

/**
 * Calculate which effects are within the selection box
 */
function getEffectsInBox(
  box: { startX: number; startY: number; endX: number; endY: number },
  effects: Effect[],
  zoom: number
): string[] {
  const TRACK_HEIGHT = 80 // From CSS timeline-track
  const TRACK_HEADER_WIDTH = 0 // No header in overlay calculation

  const boxLeft = Math.min(box.startX, box.endX)
  const boxRight = Math.max(box.startX, box.endX)
  const boxTop = Math.min(box.startY, box.endY)
  const boxBottom = Math.max(box.startY, box.endY)

  return effects
    .filter((effect) => {
      // Calculate effect block position
      const effectLeft = (effect.start_at_position / 1000) * zoom
      const effectRight = ((effect.start_at_position + effect.duration) / 1000) * zoom
      const effectTop = effect.track * TRACK_HEIGHT
      const effectBottom = effectTop + TRACK_HEIGHT

      // Check if effect overlaps with selection box
      const overlapsX = effectLeft < boxRight && effectRight > boxLeft
      const overlapsY = effectTop < boxBottom && effectBottom > boxTop

      return overlapsX && overlapsY
    })
    .map((effect) => effect.id)
}
