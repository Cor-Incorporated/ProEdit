import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Effect } from '@/types/effects'
import { AutoSaveManager, SaveStatus } from '@/features/timeline/utils/autosave'

// Global AutoSaveManager instance
let autoSaveManagerInstance: AutoSaveManager | null = null

export interface TimelineStore {
  // State
  effects: Effect[]
  currentTime: number // milliseconds
  duration: number // milliseconds
  isPlaying: boolean
  zoom: number // pixels per second
  trackCount: number
  selectedEffectIds: string[]

  // Phase 6: Editing state
  isDragging: boolean
  draggedEffectId: string | null
  isTrimming: boolean
  trimmedEffectId: string | null
  trimSide: 'start' | 'end' | null
  snapEnabled: boolean

  // Actions
  setEffects: (effects: Effect[]) => void
  addEffect: (effect: Effect) => void
  updateEffect: (id: string, updates: Partial<Effect>) => void
  removeEffect: (id: string) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setZoom: (zoom: number) => void
  setTrackCount: (count: number) => void
  toggleEffectSelection: (id: string) => void
  clearSelection: () => void

  // Phase 6: Editing actions
  setDragging: (isDragging: boolean, effectId?: string) => void
  setTrimming: (isTrimming: boolean, effectId?: string, side?: 'start' | 'end') => void
  toggleSnap: () => void
  restoreSnapshot: (effects: Effect[]) => void

  // Phase 9: Auto-save management
  initAutoSave: (projectId: string, onStatusChange?: (status: SaveStatus) => void) => void
  cleanup: () => void
}

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    (set) => ({
      // Initial state
      effects: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      zoom: 100, // 100px = 1 second
      trackCount: 3,
      selectedEffectIds: [],

      // Phase 6: Editing state
      isDragging: false,
      draggedEffectId: null,
      isTrimming: false,
      trimmedEffectId: null,
      trimSide: null,
      snapEnabled: true,

      // Actions
      setEffects: (effects) => set({ effects }),

      addEffect: (effect) => {
        set((state) => ({
          effects: [...state.effects, effect],
          duration: Math.max(
            state.duration,
            effect.start_at_position + effect.duration
          )
        }))
        // Phase 9: Trigger auto-save after state change
        autoSaveManagerInstance?.triggerSave()
      },

      updateEffect: (id, updates) => {
        set((state) => ({
          effects: state.effects.map(e =>
            e.id === id ? { ...e, ...updates } as Effect : e
          )
        }))
        // Phase 9: Trigger auto-save after state change
        autoSaveManagerInstance?.triggerSave()
      },

      removeEffect: (id) => {
        set((state) => ({
          effects: state.effects.filter(e => e.id !== id),
          selectedEffectIds: state.selectedEffectIds.filter(sid => sid !== id)
        }))
        // Phase 9: Trigger auto-save after state change
        autoSaveManagerInstance?.triggerSave()
      },

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setZoom: (zoom) => set({ zoom }),
      setTrackCount: (count) => set({ trackCount: count }),

      toggleEffectSelection: (id) => set((state) => ({
        selectedEffectIds: state.selectedEffectIds.includes(id)
          ? state.selectedEffectIds.filter(sid => sid !== id)
          : [...state.selectedEffectIds, id]
      })),

      clearSelection: () => set({ selectedEffectIds: [] }),

      // Phase 6: Editing actions
      setDragging: (isDragging, effectId) => set({
        isDragging,
        draggedEffectId: isDragging ? effectId ?? null : null
      }),

      setTrimming: (isTrimming, effectId, side) => set({
        isTrimming,
        trimmedEffectId: isTrimming ? effectId ?? null : null,
        trimSide: isTrimming ? side ?? null : null
      }),

      toggleSnap: () => set((state) => ({
        snapEnabled: !state.snapEnabled
      })),

      restoreSnapshot: (effects) => set({ effects }),

      // Phase 9: Auto-save initialization
      initAutoSave: (projectId, onStatusChange) => {
        if (!autoSaveManagerInstance) {
          autoSaveManagerInstance = new AutoSaveManager(projectId, onStatusChange)
          autoSaveManagerInstance.startAutoSave()
          console.log('[TimelineStore] AutoSave initialized')
        }
      },

      // Phase 9: Cleanup
      cleanup: () => {
        if (autoSaveManagerInstance) {
          autoSaveManagerInstance.cleanup()
          autoSaveManagerInstance = null
          console.log('[TimelineStore] AutoSave cleaned up')
        }
      },
    }),
    { name: 'timeline-store' }
  )
)
