/**
 * History store for Undo/Redo functionality
 * Manages timeline state snapshots for time-travel debugging
 */

'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Effect } from '@/types/effects'

export interface TimelineSnapshot {
  effects: Effect[]
  timestamp: number
  description?: string // Optional description for debugging
}

interface HistoryState {
  past: TimelineSnapshot[]
  future: TimelineSnapshot[]
  maxHistory: number

  // Actions
  recordSnapshot: (effects: Effect[], description?: string) => void
  undo: () => TimelineSnapshot | null
  redo: () => TimelineSnapshot | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export const useHistoryStore = create<HistoryState>()(
  devtools(
    (set, get) => ({
      past: [],
      future: [],
      maxHistory: 50, // Keep last 50 operations

      recordSnapshot: (effects: Effect[], description?: string) => {
        const snapshot: TimelineSnapshot = {
          effects: JSON.parse(JSON.stringify(effects)), // Deep copy
          timestamp: Date.now(),
          description,
        }

        set((state) => {
          const newPast = [...state.past, snapshot]

          // Limit history size
          if (newPast.length > state.maxHistory) {
            newPast.shift() // Remove oldest
          }

          return {
            past: newPast,
            future: [], // Clear future when new action is performed
          }
        })

        console.log(`History: Recorded snapshot (${description || 'unnamed'})`)
      },

      undo: () => {
        const { past } = get()
        if (past.length === 0) {
          console.log('History: Cannot undo, no history')
          return null
        }

        const currentSnapshot = past[past.length - 1]
        const newPast = past.slice(0, -1)

        set((state) => ({
          past: newPast,
          future: [currentSnapshot, ...state.future],
        }))

        console.log(`History: Undo to snapshot at ${new Date(currentSnapshot.timestamp).toLocaleTimeString()}`)
        return currentSnapshot
      },

      redo: () => {
        const { future } = get()
        if (future.length === 0) {
          console.log('History: Cannot redo, no future')
          return null
        }

        const nextSnapshot = future[0]
        const newFuture = future.slice(1)

        set((state) => ({
          past: [...state.past, nextSnapshot],
          future: newFuture,
        }))

        console.log(`History: Redo to snapshot at ${new Date(nextSnapshot.timestamp).toLocaleTimeString()}`)
        return nextSnapshot
      },

      canUndo: () => {
        return get().past.length > 0
      },

      canRedo: () => {
        return get().future.length > 0
      },

      clear: () => {
        set({ past: [], future: [] })
        console.log('History: Cleared all history')
      },
    }),
    { name: 'history-store' }
  )
)
