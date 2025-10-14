import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Effect } from '@/types/effects'

export interface TimelineStore {
  // State
  effects: Effect[]
  currentTime: number // milliseconds
  duration: number // milliseconds
  isPlaying: boolean
  zoom: number // pixels per second
  trackCount: number
  selectedEffectIds: string[]

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

      // Actions
      setEffects: (effects) => set({ effects }),

      addEffect: (effect) => set((state) => ({
        effects: [...state.effects, effect],
        duration: Math.max(
          state.duration,
          effect.start_at_position + effect.duration
        )
      })),

      updateEffect: (id, updates) => set((state) => ({
        effects: state.effects.map(e =>
          e.id === id ? { ...e, ...updates } as Effect : e
        )
      })),

      removeEffect: (id) => set((state) => ({
        effects: state.effects.filter(e => e.id !== id),
        selectedEffectIds: state.selectedEffectIds.filter(sid => sid !== id)
      })),

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
    }),
    { name: 'timeline-store' }
  )
)
