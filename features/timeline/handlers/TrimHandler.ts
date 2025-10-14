/**
 * TrimHandler - Effect trim functionality
 * Ported from omniclip: /s/context/controllers/timeline/parts/drag-related/effect-trim.ts
 *
 * Handles trimming effect start and end points while maintaining media sync
 */

import { Effect } from '@/types/effects'

export class TrimHandler {
  private effect: Effect | null = null
  private trimSide: 'start' | 'end' | null = null
  private initialMouseX = 0
  private initialStartPosition = 0
  private initialDuration = 0
  private initialStart = 0
  private initialEnd = 0

  constructor(
    private zoom: number, // pixels per second
    private onUpdate: (effectId: string, updates: Partial<Effect>) => void
  ) {}

  /**
   * Start trimming an effect
   * Ported from omniclip:25-35
   *
   * @param effect Effect being trimmed
   * @param side Which side to trim ('start' or 'end')
   * @param mouseX Initial mouse X position
   */
  startTrim(
    effect: Effect,
    side: 'start' | 'end',
    mouseX: number
  ): void {
    this.effect = effect
    this.trimSide = side
    this.initialMouseX = mouseX
    this.initialStartPosition = effect.start_at_position
    this.initialDuration = effect.duration
    this.initialStart = effect.start
    this.initialEnd = effect.end

    console.log(`TrimHandler: Start trim ${side} for effect ${effect.id}`)
  }

  /**
   * Handle mouse move during trim
   * Ported from omniclip:40-65
   *
   * @param mouseX Current mouse X position
   * @returns Partial effect updates or null if no change
   */
  onTrimMove(mouseX: number): Partial<Effect> | null {
    if (!this.effect || !this.trimSide) return null

    // Convert pixel movement to milliseconds
    // deltaX in pixels / zoom (px/s) * 1000 (ms/s) = deltaMs
    const deltaX = mouseX - this.initialMouseX
    const deltaMs = (deltaX / this.zoom) * 1000

    if (this.trimSide === 'start') {
      return this.trimStart(deltaMs)
    } else {
      return this.trimEnd(deltaMs)
    }
  }

  /**
   * Trim start point (left edge)
   * Ported from omniclip:45-55
   *
   * Moving start point right: increases start_at_position, increases start, decreases duration
   * Moving start point left: decreases start_at_position, decreases start, increases duration
   *
   * @param deltaMs Change in milliseconds
   * @returns Partial effect updates
   */
  private trimStart(deltaMs: number): Partial<Effect> {
    if (!this.effect) return {}

    // Calculate new values
    const newStartPosition = Math.max(0, this.initialStartPosition + deltaMs)
    const newStart = Math.max(0, this.initialStart + deltaMs)
    const newDuration = this.initialDuration - deltaMs

    // Enforce minimum duration (100ms per omniclip)
    if (newDuration < 100) {
      return {}
    }

    // Get raw duration for validation
    const rawDuration = this.getRawDuration(this.effect)
    if (newStart >= rawDuration) {
      return {}
    }

    return {
      start_at_position: newStartPosition,
      start: newStart,
      duration: newDuration,
    }
  }

  /**
   * Trim end point (right edge)
   * Ported from omniclip:60-70
   *
   * Moving end point right: increases end, increases duration
   * Moving end point left: decreases end, decreases duration
   *
   * @param deltaMs Change in milliseconds
   * @returns Partial effect updates
   */
  private trimEnd(deltaMs: number): Partial<Effect> {
    if (!this.effect) return {}

    // Get maximum duration from media
    const rawDuration = this.getRawDuration(this.effect)

    // Calculate new values
    const newEnd = Math.min(
      rawDuration,
      Math.max(this.initialStart + 100, this.initialEnd + deltaMs) // Minimum 100ms duration
    )
    const newDuration = newEnd - this.effect.start

    // Enforce minimum duration
    if (newDuration < 100) {
      return {}
    }

    return {
      end: newEnd,
      duration: newDuration,
    }
  }

  /**
   * Get raw duration of effect media
   * @param effect Effect to get duration from
   * @returns Raw duration in milliseconds
   */
  private getRawDuration(effect: Effect): number {
    if (effect.kind === 'video' || effect.kind === 'image') {
      return effect.properties.raw_duration || effect.duration
    } else if (effect.kind === 'audio') {
      return effect.properties.raw_duration || effect.duration
    }
    return effect.duration
  }

  /**
   * End trim operation
   * Ported from omniclip:75-85
   */
  async endTrim(): Promise<void> {
    if (!this.effect) return

    const effectId = this.effect.id

    // Reset state
    this.effect = null
    this.trimSide = null

    console.log(`TrimHandler: End trim for effect ${effectId}`)
  }

  /**
   * Cancel trim operation (e.g., on Escape key)
   */
  cancelTrim(): void {
    if (!this.effect) return

    // Restore original values
    this.onUpdate(this.effect.id, {
      start_at_position: this.initialStartPosition,
      start: this.initialStart,
      end: this.initialEnd,
      duration: this.initialDuration,
    })

    // Reset state
    this.effect = null
    this.trimSide = null

    console.log('TrimHandler: Cancelled trim')
  }

  /**
   * Get current trim state
   */
  isTrimming(): boolean {
    return this.effect !== null
  }

  /**
   * Get which side is being trimmed
   */
  getTrimSide(): 'start' | 'end' | null {
    return this.trimSide
  }
}
