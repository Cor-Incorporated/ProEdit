/**
 * Snap-to-grid utilities
 * Ported from omniclip: /s/context/controllers/timeline/parts/snap.ts
 *
 * Handles snapping effects to grid points, other effects, and frames
 */

import { Effect } from '@/types/effects'

const SNAP_THRESHOLD_MS = 200 // Snap within 200ms (customizable)

/**
 * Get nearest snap position for an effect
 * Ported from omniclip:15-40
 *
 * @param position Target position in ms
 * @param track Target track index
 * @param effects All existing effects
 * @param snapEnabled Whether snapping is enabled
 * @returns Snapped position or original if no snap point nearby
 */
export function getSnapPosition(
  position: number,
  track: number,
  effects: Effect[],
  snapEnabled: boolean
): number {
  if (!snapEnabled) return position

  // Collect snap points
  const snapPoints: number[] = [
    0, // Timeline start
  ]

  // Add effect boundaries on same track (priority)
  const sameTrackEffects = effects.filter(e => e.track === track)
  for (const effect of sameTrackEffects) {
    snapPoints.push(effect.start_at_position)
    snapPoints.push(effect.start_at_position + effect.duration)
  }

  // Add effect boundaries on other tracks
  const otherTrackEffects = effects.filter(e => e.track !== track)
  for (const effect of otherTrackEffects) {
    snapPoints.push(effect.start_at_position)
    snapPoints.push(effect.start_at_position + effect.duration)
  }

  // Find closest snap point within threshold
  let closestPoint = position
  let closestDistance = SNAP_THRESHOLD_MS

  for (const point of snapPoints) {
    const distance = Math.abs(position - point)
    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = point
    }
  }

  return closestPoint
}

/**
 * Snap position to grid intervals
 *
 * @param position Position in ms
 * @param gridSize Grid interval in ms (e.g., 1000 for 1 second)
 * @returns Snapped position
 */
export function snapToGrid(
  position: number,
  gridSize: number = 1000
): number {
  return Math.round(position / gridSize) * gridSize
}

/**
 * Snap position to frame boundaries
 *
 * @param position Position in ms
 * @param fps Frame rate (frames per second)
 * @returns Snapped position
 */
export function snapToFrame(
  position: number,
  fps: number = 30
): number {
  const frameTime = 1000 / fps
  return Math.round(position / frameTime) * frameTime
}

/**
 * Get all snap points for visual guides
 * Used to render alignment guides on timeline
 *
 * @param effects All effects
 * @param excludeEffectId Effect ID to exclude (currently dragging)
 * @returns Array of snap point positions in ms
 */
export function getAllSnapPoints(
  effects: Effect[],
  excludeEffectId?: string
): number[] {
  const snapPoints: number[] = [0] // Timeline start

  for (const effect of effects) {
    if (effect.id === excludeEffectId) continue

    snapPoints.push(effect.start_at_position)
    snapPoints.push(effect.start_at_position + effect.duration)
  }

  // Remove duplicates and sort
  return [...new Set(snapPoints)].sort((a, b) => a - b)
}

/**
 * Check if position is near a snap point
 *
 * @param position Position in ms
 * @param snapPoints Array of snap point positions
 * @param threshold Snap threshold in ms
 * @returns Snap point position if near, null otherwise
 */
export function getNearestSnapPoint(
  position: number,
  snapPoints: number[],
  threshold: number = SNAP_THRESHOLD_MS
): number | null {
  let closestPoint: number | null = null
  let closestDistance = threshold

  for (const point of snapPoints) {
    const distance = Math.abs(position - point)
    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = point
    }
  }

  return closestPoint
}
