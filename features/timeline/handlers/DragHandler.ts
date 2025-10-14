/**
 * DragHandler - Effect drag and drop functionality
 * Ported from omniclip: /s/context/controllers/timeline/parts/drag-related/effect-drag.ts
 *
 * Handles dragging effects horizontally (time) and vertically (tracks)
 */

import { Effect } from '@/types/effects'
import { calculateProposedTimecode } from '../utils/placement'

export class DragHandler {
  private effect: Effect | null = null
  private initialMouseX = 0
  private initialMouseY = 0
  private initialStartPosition = 0
  private initialTrack = 0

  constructor(
    private zoom: number, // pixels per second
    private trackHeight: number, // pixels per track
    private trackCount: number,
    private existingEffects: Effect[],
    private onUpdate: (effectId: string, updates: Partial<Effect>) => void
  ) {}

  /**
   * Start dragging an effect
   * Ported from omniclip:30-40
   *
   * @param effect Effect being dragged
   * @param mouseX Initial mouse X position
   * @param mouseY Initial mouse Y position
   */
  startDrag(effect: Effect, mouseX: number, mouseY: number): void {
    this.effect = effect
    this.initialMouseX = mouseX
    this.initialMouseY = mouseY
    this.initialStartPosition = effect.start_at_position
    this.initialTrack = effect.track

    console.log(`DragHandler: Start drag for effect ${effect.id}`)
  }

  /**
   * Handle mouse move during drag
   * Ported from omniclip:45-75
   *
   * @param mouseX Current mouse X position
   * @param mouseY Current mouse Y position
   * @returns Partial effect updates or null if no change
   */
  onDragMove(mouseX: number, mouseY: number): Partial<Effect> | null {
    if (!this.effect) return null

    // Calculate X movement (time on timeline)
    const deltaX = mouseX - this.initialMouseX
    const deltaMs = (deltaX / this.zoom) * 1000
    const newStartPosition = Math.max(0, this.initialStartPosition + deltaMs)

    // Calculate Y movement (track index)
    const deltaY = mouseY - this.initialMouseY
    const trackDelta = Math.round(deltaY / this.trackHeight)
    const newTrack = Math.max(
      0,
      Math.min(this.trackCount - 1, this.initialTrack + trackDelta)
    )

    // Use placement logic to handle collisions
    const otherEffects = this.existingEffects.filter(e => e.id !== this.effect?.id)
    const proposedEffect = {
      ...this.effect,
      start_at_position: newStartPosition,
      track: newTrack,
    }

    const proposed = calculateProposedTimecode(
      proposedEffect,
      newStartPosition,
      newTrack,
      otherEffects
    )

    return {
      start_at_position: proposed.proposed_place.start_at_position,
      track: proposed.proposed_place.track,
    }
  }

  /**
   * End drag operation
   * Ported from omniclip:80-95
   */
  async endDrag(): Promise<void> {
    if (!this.effect) return

    const effectId = this.effect.id

    // Reset state
    this.effect = null

    console.log(`DragHandler: End drag for effect ${effectId}`)
  }

  /**
   * Cancel drag operation (e.g., on Escape key)
   */
  cancelDrag(): void {
    if (!this.effect) return

    // Restore original position
    this.onUpdate(this.effect.id, {
      start_at_position: this.initialStartPosition,
      track: this.initialTrack,
    })

    // Reset state
    this.effect = null

    console.log('DragHandler: Cancelled drag')
  }

  /**
   * Get current drag state
   */
  isDragging(): boolean {
    return this.effect !== null
  }

  /**
   * Update existing effects list (call when effects change)
   */
  updateExistingEffects(effects: Effect[]): void {
    this.existingEffects = effects
  }

  /**
   * Update zoom level
   */
  updateZoom(zoom: number): void {
    this.zoom = zoom
  }
}
