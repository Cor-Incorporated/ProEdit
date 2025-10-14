/**
 * React hook for TrimHandler
 * Provides trim functionality for timeline effects
 */

'use client'

import { useRef, useCallback } from 'react'
import { TrimHandler } from '../handlers/TrimHandler'
import { useTimelineStore } from '@/stores/timeline'
import { updateEffect } from '@/app/actions/effects'
import { Effect } from '@/types/effects'

export function useTrimHandler() {
  const { zoom, updateEffect: updateStoreEffect } = useTimelineStore()
  const handlerRef = useRef<TrimHandler | null>(null)
  const isPendingRef = useRef(false)

  // Initialize handler
  if (!handlerRef.current) {
    handlerRef.current = new TrimHandler(
      zoom,
      async (effectId: string, updates: Partial<Effect>) => {
        // Optimistic update to store (immediate UI feedback)
        updateStoreEffect(effectId, updates)
      }
    )
  }

  /**
   * Start trimming an effect
   */
  const startTrim = useCallback((
    effect: Effect,
    side: 'start' | 'end',
    mouseX: number
  ) => {
    if (!handlerRef.current) return
    handlerRef.current.startTrim(effect, side, mouseX)
    isPendingRef.current = false
  }, [])

  /**
   * Handle mouse move during trim
   */
  const onTrimMove = useCallback((mouseX: number) => {
    if (!handlerRef.current) return null

    const updates = handlerRef.current.onTrimMove(mouseX)
    if (updates && Object.keys(updates).length > 0) {
      // Apply updates optimistically (handled by TrimHandler's onUpdate callback)
      // This provides immediate visual feedback
      return updates
    }
    return null
  }, [])

  /**
   * End trimming and persist to database
   */
  const endTrim = useCallback(async (effect: Effect, finalUpdates: Partial<Effect>) => {
    if (!handlerRef.current || isPendingRef.current) return

    isPendingRef.current = true

    try {
      // Persist final state to database
      await updateEffect(effect.id, finalUpdates)
      await handlerRef.current.endTrim()
    } catch (error) {
      console.error('Failed to persist trim:', error)
      // TODO: Show error toast
    } finally {
      isPendingRef.current = false
    }
  }, [])

  /**
   * Cancel trim operation
   */
  const cancelTrim = useCallback(() => {
    if (!handlerRef.current) return
    handlerRef.current.cancelTrim()
  }, [])

  /**
   * Check if currently trimming
   */
  const isTrimming = useCallback(() => {
    return handlerRef.current?.isTrimming() ?? false
  }, [])

  return {
    startTrim,
    onTrimMove,
    endTrim,
    cancelTrim,
    isTrimming,
  }
}
