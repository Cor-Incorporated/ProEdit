'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CompositorState {
  // Playback state
  isPlaying: boolean
  timecode: number // Current position in ms
  duration: number // Total timeline duration in ms
  fps: number // Frames per second (from project settings)

  // Performance
  actualFps: number // Measured FPS for monitoring

  // Canvas state
  canvasReady: boolean

  // Actions
  setPlaying: (playing: boolean) => void
  setTimecode: (timecode: number) => void
  setDuration: (duration: number) => void
  setFps: (fps: number) => void
  setActualFps: (fps: number) => void
  setCanvasReady: (ready: boolean) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (timecode: number) => void
  togglePlayPause: () => void
}

export const useCompositorStore = create<CompositorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      timecode: 0,
      duration: 0,
      fps: 30,
      actualFps: 0,
      canvasReady: false,

      // Actions
      setPlaying: (playing) => set({ isPlaying: playing }),
      setTimecode: (timecode) => set({ timecode }),
      setDuration: (duration) => set({ duration }),
      setFps: (fps) => set({ fps }),
      setActualFps: (fps) => set({ actualFps: fps }),
      setCanvasReady: (ready) => set({ canvasReady: ready }),

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      stop: () => set({ isPlaying: false, timecode: 0 }),

      seek: (timecode) => {
        const { duration } = get()
        const clampedTimecode = Math.max(0, Math.min(timecode, duration))
        set({ timecode: clampedTimecode })
      },

      togglePlayPause: () => {
        const { isPlaying } = get()
        set({ isPlaying: !isPlaying })
      },
    }),
    { name: 'compositor-store' }
  )
)
