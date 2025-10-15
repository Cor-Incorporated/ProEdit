'use client'

import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'
import { useCallback, useRef } from 'react'

export function PlayheadIndicator() {
  const { timecode, seek } = useCompositorStore()
  const { zoom } = useTimelineStore()
  const draggingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Calculate position based on timecode and zoom
  const position = (timecode / 1000) * zoom

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    draggingRef.current = true
    const container = containerRef.current?.parentElement as HTMLDivElement | null
    const onMove = (ev: MouseEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const t = Math.max(0, (x / zoom) * 1000)
      seek(t)
    }
    const onUp = () => {
      draggingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [seek, zoom])

  return (
    <div ref={containerRef} className="absolute inset-y-0" style={{ left: `${position}px` }}>
      {/* Playhead line */}
      <div className="absolute inset-y-0 w-0.5 bg-red-500 z-50" />
      {/* Handle */}
      <div
        className="absolute -top-1 w-3 h-3 bg-red-500 rounded-full z-50 transform -translate-x-1/2 cursor-ew-resize"
        onMouseDown={onMouseDown}
      />
    </div>
  )
}
