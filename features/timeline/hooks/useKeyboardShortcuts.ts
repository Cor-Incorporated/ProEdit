/**
 * Keyboard shortcuts hook for timeline editing
 * Provides keyboard control for all major timeline operations
 */

'use client'

import { useEffect } from 'react'
import { useTimelineStore } from '@/stores/timeline'
import { useHistoryStore } from '@/stores/history'
import { useCompositorStore } from '@/stores/compositor'

export function useKeyboardShortcuts() {
  const { effects, restoreSnapshot, currentTime } = useTimelineStore()
  const { undo, redo, canUndo, canRedo } = useHistoryStore()
  const { timecode, setTimecode, togglePlayPause } = useCompositorStore()

  // Seek function
  const seek = (time: number) => setTimecode(time)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const isMeta = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey

      // Undo: Cmd/Ctrl + Z
      if (isMeta && e.key === 'z' && !isShift) {
        e.preventDefault()
        if (canUndo()) {
          const snapshot = undo()
          if (snapshot) {
            restoreSnapshot(snapshot.effects)
            console.log('Keyboard: Undo')
          }
        }
        return
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((isMeta && e.key === 'z' && isShift) || (isMeta && e.key === 'y')) {
        e.preventDefault()
        if (canRedo()) {
          const snapshot = redo()
          if (snapshot) {
            restoreSnapshot(snapshot.effects)
            console.log('Keyboard: Redo')
          }
        }
        return
      }

      // Play/Pause: Space
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlayPause()
        console.log('Keyboard: Toggle play/pause')
        return
      }

      // Seek backward: Arrow Left
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        const delta = isShift ? 5000 : 1000 // Shift: 5 seconds, Normal: 1 second
        const newTime = Math.max(0, (timecode || currentTime) - delta)
        seek(newTime)
        console.log(`Keyboard: Seek backward to ${newTime}ms`)
        return
      }

      // Seek forward: Arrow Right
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        const delta = isShift ? 5000 : 1000
        const newTime = (timecode || currentTime) + delta
        seek(newTime)
        console.log(`Keyboard: Seek forward to ${newTime}ms`)
        return
      }

      // Split: S key
      if (e.key === 's' && !isMeta) {
        e.preventDefault()
        // Trigger split action via button click
        const splitButton = document.querySelector<HTMLButtonElement>('[data-action="split"]')
        if (splitButton) {
          splitButton.click()
          console.log('Keyboard: Split at playhead')
        }
        return
      }

      // Delete selected effects: Backspace or Delete
      if (e.code === 'Backspace' || e.code === 'Delete') {
        e.preventDefault()
        // Trigger delete action via button click
        const deleteButton = document.querySelector<HTMLButtonElement>('[data-action="delete"]')
        if (deleteButton) {
          deleteButton.click()
          console.log('Keyboard: Delete selected effects')
        }
        return
      }

      // Select all: Cmd/Ctrl + A
      if (isMeta && e.key === 'a') {
        e.preventDefault()
        // Trigger select all
        console.log('Keyboard: Select all effects')
        // This will be implemented when SelectionBox is created
        return
      }

      // Deselect all: Escape
      if (e.code === 'Escape') {
        e.preventDefault()
        useTimelineStore.getState().clearSelection()
        console.log('Keyboard: Clear selection')
        return
      }

      // Jump to start: Home
      if (e.code === 'Home') {
        e.preventDefault()
        seek(0)
        console.log('Keyboard: Jump to start')
        return
      }

      // Jump to end: End
      if (e.code === 'End') {
        e.preventDefault()
        const duration = useTimelineStore.getState().duration
        seek(duration)
        console.log('Keyboard: Jump to end')
        return
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [effects, timecode, currentTime, undo, redo, canUndo, canRedo, restoreSnapshot, togglePlayPause, seek])

  // Return nothing - this is a pure side-effect hook
  return null
}
