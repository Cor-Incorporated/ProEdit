import { Effect } from '@/types/effects'

/**
 * Proposed placement result from omniclip
 * Contains the calculated position and any adjustments needed
 */
export interface ProposedTimecode {
  proposed_place: {
    start_at_position: number
    track: number
  }
  duration?: number // Shrunk duration if collision detected
  effects_to_push?: Effect[] // Effects that need to be pushed forward
}

/**
 * Effect placement utilities
 * Ported from omniclip: /s/context/controllers/timeline/parts/effect-placement-utilities.ts
 */
class EffectPlacementUtilities {
  /**
   * Get all effects before a timeline position on a specific track
   * @param effects All effects
   * @param timelineStart Position in ms
   * @returns Effects before position, sorted by position (descending)
   */
  getEffectsBefore(effects: Effect[], timelineStart: number): Effect[] {
    return effects
      .filter(effect => effect.start_at_position < timelineStart)
      .sort((a, b) => b.start_at_position - a.start_at_position)
  }

  /**
   * Get all effects after a timeline position on a specific track
   * @param effects All effects
   * @param timelineStart Position in ms
   * @returns Effects after position, sorted by position (ascending)
   */
  getEffectsAfter(effects: Effect[], timelineStart: number): Effect[] {
    return effects
      .filter(effect => effect.start_at_position > timelineStart)
      .sort((a, b) => a.start_at_position - b.start_at_position)
  }

  /**
   * Calculate space between two effects
   * @param effectBefore Effect before
   * @param effectAfter Effect after
   * @returns Space in milliseconds
   */
  calculateSpaceBetween(effectBefore: Effect, effectAfter: Effect): number {
    const effectBeforeEnd = effectBefore.start_at_position + effectBefore.duration
    return effectAfter.start_at_position - effectBeforeEnd
  }

  /**
   * Round position to nearest frame
   * @param position Position in ms
   * @param fps Frames per second
   * @returns Rounded position in ms
   */
  roundToNearestFrame(position: number, fps: number): number {
    const frameTime = 1000 / fps
    return Math.round(position / frameTime) * frameTime
  }
}

/**
 * Calculate proposed position for effect placement
 * Ported from omniclip: /s/context/controllers/timeline/parts/effect-placement-proposal.ts
 *
 * This logic handles:
 * - Collision detection with existing effects
 * - Auto-shrinking to fit in available space
 * - Auto-pushing effects forward when no space
 * - Snapping to effect boundaries
 *
 * @param effect Effect to place
 * @param targetPosition Target position in ms
 * @param targetTrack Target track index
 * @param existingEffects All existing effects
 * @returns ProposedTimecode with placement info
 */
export function calculateProposedTimecode(
  effect: Effect,
  targetPosition: number,
  targetTrack: number,
  existingEffects: Effect[]
): ProposedTimecode {
  const utilities = new EffectPlacementUtilities()

  // Filter effects on the same track (exclude the effect being placed)
  const trackEffects = existingEffects.filter(
    e => e.track === targetTrack && e.id !== effect.id
  )

  const effectBefore = utilities.getEffectsBefore(trackEffects, targetPosition)[0]
  const effectAfter = utilities.getEffectsAfter(trackEffects, targetPosition)[0]

  let proposedStartPosition = targetPosition
  let shrinkedDuration: number | undefined
  let effectsToPush: Effect[] | undefined

  // Case 1: Effect between two existing effects
  if (effectBefore && effectAfter) {
    const spaceBetween = utilities.calculateSpaceBetween(effectBefore, effectAfter)

    if (spaceBetween < effect.duration && spaceBetween > 0) {
      // Shrink effect to fit in available space
      shrinkedDuration = spaceBetween
      proposedStartPosition = effectBefore.start_at_position + effectBefore.duration
    } else if (spaceBetween === 0) {
      // No space - push effects forward
      effectsToPush = utilities.getEffectsAfter(trackEffects, targetPosition)
      proposedStartPosition = effectBefore.start_at_position + effectBefore.duration
    }
  }
  // Case 2: Effect after existing effect
  else if (effectBefore) {
    const effectBeforeEnd = effectBefore.start_at_position + effectBefore.duration
    if (targetPosition < effectBeforeEnd) {
      // Snap to end of previous effect
      proposedStartPosition = effectBeforeEnd
    }
  }
  // Case 3: Effect before existing effect
  else if (effectAfter) {
    const proposedEnd = targetPosition + effect.duration
    if (proposedEnd > effectAfter.start_at_position) {
      // Shrink to fit before next effect
      shrinkedDuration = effectAfter.start_at_position - targetPosition
    }
  }

  return {
    proposed_place: {
      start_at_position: proposedStartPosition,
      track: targetTrack,
    },
    duration: shrinkedDuration,
    effects_to_push: effectsToPush,
  }
}

/**
 * Find optimal position for new effect
 * Places after last effect on the track with most available space
 *
 * @param effects All existing effects
 * @param trackCount Number of tracks
 * @returns Position and track for new effect
 */
export function findPlaceForNewEffect(
  effects: Effect[],
  trackCount: number
): { position: number; track: number } {
  let closestPosition = 0
  let track = 0

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
    const trackEffects = effects.filter(e => e.track === trackIndex)

    if (trackEffects.length === 0) {
      // Empty track found - use it
      return { position: 0, track: trackIndex }
    }

    // Find last effect on this track
    const lastEffect = trackEffects.reduce((latest, current) => {
      const latestEnd = latest.start_at_position + latest.duration
      const currentEnd = current.start_at_position + current.duration
      return currentEnd > latestEnd ? current : latest
    })

    const newPosition = lastEffect.start_at_position + lastEffect.duration

    // Use track with earliest available position
    if (closestPosition === 0 || newPosition < closestPosition) {
      closestPosition = newPosition
      track = trackIndex
    }
  }

  return { position: closestPosition, track }
}

/**
 * Check if effect collides with any existing effects
 * @param effect Effect to check
 * @param existingEffects All existing effects
 * @returns True if collision detected
 */
export function hasCollision(
  effect: Effect,
  existingEffects: Effect[]
): boolean {
  const trackEffects = existingEffects.filter(
    e => e.track === effect.track && e.id !== effect.id
  )

  const effectEnd = effect.start_at_position + effect.duration

  return trackEffects.some(existing => {
    const existingEnd = existing.start_at_position + existing.duration

    // Check for overlap
    return (
      (effect.start_at_position >= existing.start_at_position && effect.start_at_position < existingEnd) ||
      (effectEnd > existing.start_at_position && effectEnd <= existingEnd) ||
      (effect.start_at_position <= existing.start_at_position && effectEnd >= existingEnd)
    )
  })
}
