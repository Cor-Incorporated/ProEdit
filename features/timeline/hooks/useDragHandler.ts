/**
 * React hook for DragHandler
 * Provides drag and drop functionality for timeline effects
 */

'use client'

import { useRef, useCallback, useEffect } from 'react'
import { DragHandler } from '../handlers/DragHandler'
import { useTimelineStore } from '@/stores/timeline'
import { updateEffect } from '@/app/actions/effects'
import { Effect } from '@/types/effects'

const TRACK_HEIGHT = 48 // pixels - matches timeline track height

export function useDragHandler() {
  const {
    zoom,
    trackCount,
    effects,
    updateEffect: updateStoreEffect
  } = useTimelineStore()

  const handlerRef = useRef<DragHandler | null>(null)
  const isPendingRef = useRef(false)

  // Initialize or update handler when dependencies change
  useEffect(() => {
    if (!handlerRef.current) {
      handlerRef.current = new DragHandler(
        zoom,
        TRACK_HEIGHT,
        trackCount,
        effects,
        async (effectId: string, updates: Partial<Effect>) => {
          // Optimistic update to store (immediate UI feedback)
          updateStoreEffect(effectId, updates)
        }
      )
    } else {
      // Update existing handler
      handlerRef.current.updateZoom(zoom)
      handlerRef.current.updateExistingEffects(effects)
    }
  }, [zoom, trackCount, effects, updateStoreEffect])

  /**
   * Start dragging an effect
   */
  const startDrag = useCallback((
    effect: Effect,
    mouseX: number,
    mouseY: number
  ) => {
    if (!handlerRef.current) return
    handlerRef.current.startDrag(effect, mouseX, mouseY)
    isPendingRef.current = false
  }, [])

  /**
   * Handle mouse move during drag
   */
  const onDragMove = useCallback((mouseX: number, mouseY: number) => {
    if (!handlerRef.current) return null

    const updates = handlerRef.current.onDragMove(mouseX, mouseY)
    if (updates && Object.keys(updates).length > 0) {
      return updates
    }
    return null
  }, [])

  /**
   * End dragging and persist to database
   */
  const endDrag = useCallback(async (effect: Effect, finalUpdates: Partial<Effect>) => {
    if (!handlerRef.current || isPendingRef.current) return

    isPendingRef.current = true

    try {
      // Persist final state to database
      await updateEffect(effect.id, finalUpdates)
      await handlerRef.current.endDrag()
    } catch (error) {
      console.error('Failed to persist drag:', error)
      // TODO: Show error toast
    } finally {
      isPendingRef.current = false
    }
  }, [])

  /**
   * Cancel drag operation
   */
  const cancelDrag = useCallback(() => {
    if (!handlerRef.current) return
    handlerRef.current.cancelDrag()
  }, [])

  /**
   * Check if currently dragging
   */
  const isDragging = useCallback(() => {
    return handlerRef.current?.isDragging() ?? false
  }, [])

  return {
    startDrag,
    onDragMove,
    endDrag,
    cancelDrag,
    isDragging,
  }
}
