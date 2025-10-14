import { describe, it, expect } from 'vitest'
import {
  calculateProposedTimecode,
  findPlaceForNewEffect,
  hasCollision
} from '@/features/timeline/utils/placement'
import { Effect, VideoEffect } from '@/types/effects'

// Helper to create mock effect
const createMockEffect = (
  id: string,
  track: number,
  startPosition: number,
  duration: number
): VideoEffect => ({
  id,
  project_id: 'test-project',
  kind: 'video',
  track,
  start_at_position: startPosition,
  duration,
  start_time: 0,
  end_time: duration,
  media_file_id: 'test-media',
  file_hash: 'test-hash',
  name: 'test.mp4',
  thumbnail: '',
  properties: {
    rect: {
      width: 1920,
      height: 1080,
      scaleX: 1,
      scaleY: 1,
      position_on_canvas: { x: 0, y: 0 },
      rotation: 0,
      pivot: { x: 0, y: 0 }
    },
    raw_duration: duration,
    frames: Math.floor(duration / 1000 * 30)
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

describe('Timeline Placement Logic', () => {
  describe('calculateProposedTimecode', () => {
    it('should place effect at target position when no collision', () => {
      const effect = createMockEffect('1', 0, 0, 1000)
      const result = calculateProposedTimecode(effect, 2000, 0, [])

      expect(result.proposed_place.start_at_position).toBe(2000)
      expect(result.proposed_place.track).toBe(0)
      expect(result.duration).toBeUndefined()
      expect(result.effects_to_push).toBeUndefined()
    })

    it('should snap to end of previous effect when overlapping', () => {
      const existingEffect = createMockEffect('2', 0, 0, 1000)
      const newEffect = createMockEffect('1', 0, 0, 1000)

      const result = calculateProposedTimecode(
        newEffect,
        500, // Try to place in middle of existing effect
        0,
        [existingEffect]
      )

      expect(result.proposed_place.start_at_position).toBe(1000) // Snap to end
    })

    it('should shrink effect when space is limited', () => {
      const effectBefore = createMockEffect('2', 0, 0, 1000)
      const effectAfter = createMockEffect('3', 0, 1500, 1000)
      const newEffect = createMockEffect('1', 0, 0, 1000)

      const result = calculateProposedTimecode(
        newEffect,
        1000,
        0,
        [effectBefore, effectAfter]
      )

      expect(result.duration).toBe(500) // Shrunk to fit
      expect(result.proposed_place.start_at_position).toBe(1000)
    })

    it('should handle placement on different tracks independently', () => {
      const track0Effect = createMockEffect('2', 0, 0, 1000)
      const newEffect = createMockEffect('1', 1, 0, 1000)

      const result = calculateProposedTimecode(
        newEffect,
        0,
        1, // Different track
        [track0Effect]
      )

      expect(result.proposed_place.start_at_position).toBe(0) // No collision
      expect(result.proposed_place.track).toBe(1)
    })
  })

  describe('findPlaceForNewEffect', () => {
    it('should place on first empty track', () => {
      const effects: Effect[] = []

      const result = findPlaceForNewEffect(effects, 3)

      expect(result.track).toBe(0)
      expect(result.position).toBe(0)
    })

    it('should place after last effect when no empty tracks', () => {
      const effects = [
        createMockEffect('1', 0, 0, 1000),
        createMockEffect('2', 1, 0, 1500),
        createMockEffect('3', 2, 0, 2000)
      ]

      const result = findPlaceForNewEffect(effects, 3)

      expect(result.track).toBe(0) // Track 0 has earliest end
      expect(result.position).toBe(1000)
    })

    it('should find track with most available space', () => {
      const effects = [
        createMockEffect('1', 0, 0, 2000),
        createMockEffect('2', 1, 0, 1000)
      ]

      const result = findPlaceForNewEffect(effects, 2)

      expect(result.track).toBe(1) // Track 1 ends earlier
      expect(result.position).toBe(1000)
    })
  })

  describe('hasCollision', () => {
    it('should detect collision when effects overlap', () => {
      const effect1 = createMockEffect('1', 0, 0, 1000)
      const effect2 = createMockEffect('2', 0, 500, 1000)

      const collision = hasCollision(effect2, [effect1])

      expect(collision).toBe(true)
    })

    it('should not detect collision when effects are adjacent', () => {
      const effect1 = createMockEffect('1', 0, 0, 1000)
      const effect2 = createMockEffect('2', 0, 1000, 1000)

      const collision = hasCollision(effect2, [effect1])

      expect(collision).toBe(false)
    })

    it('should not detect collision on different tracks', () => {
      const effect1 = createMockEffect('1', 0, 0, 1000)
      const effect2 = createMockEffect('2', 1, 0, 1000)

      const collision = hasCollision(effect2, [effect1])

      expect(collision).toBe(false)
    })

    it('should detect collision when new effect contains existing effect', () => {
      const effect1 = createMockEffect('1', 0, 500, 500)
      const effect2 = createMockEffect('2', 0, 0, 2000) // Covers effect1

      const collision = hasCollision(effect2, [effect1])

      expect(collision).toBe(true)
    })
  })
})
