'use client'

import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'

export function PlayheadIndicator() {
  const { timecode } = useCompositorStore()
  const { zoom } = useTimelineStore()

  // Calculate position based on timecode and zoom
  const position = (timecode / 1000) * zoom

  return (
    <>
      {/* Playhead line */}
      <div
        className="playhead-line absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-50"
        style={{ left: `${position}px` }}
      />

      {/* Playhead handle */}
      <div
        className="playhead-handle absolute top-0 w-3 h-3 bg-red-500 rounded-full pointer-events-none z-50 transform -translate-x-1/2"
        style={{ left: `${position}px` }}
      />
    </>
  )
}
