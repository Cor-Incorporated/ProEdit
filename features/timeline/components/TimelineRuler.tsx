'use client'

import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'
import { useEffect, useRef } from 'react'

interface TimelineRulerProps {
  projectId: string
}

export function TimelineRuler({ projectId }: TimelineRulerProps) {
  const { zoom, markers, addMarker } = useTimelineStore()
  const { seek } = useCompositorStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate ruler ticks with adaptive intervals based on zoom
  const generateTicks = () => {
    const ticks: { position: number; label: string; major: boolean }[] = []
    const pixelsPerSecond = zoom

    // Adaptive interval based on zoom level
    let secondInterval: number
    let majorInterval: number

    if (pixelsPerSecond < 25) {
      // Very zoomed out - show every 30 seconds
      secondInterval = 30
      majorInterval = 60 // Every minute
    } else if (pixelsPerSecond < 50) {
      // Zoomed out - show every 10 seconds
      secondInterval = 10
      majorInterval = 30
    } else if (pixelsPerSecond < 100) {
      // Medium - show every 5 seconds
      secondInterval = 5
      majorInterval = 15
    } else {
      // Zoomed in - show every 1 second
      secondInterval = 1
      majorInterval = 5
    }

    // Generate ticks up to 1 hour (3600 seconds)
    for (let second = 0; second < 3600; second += secondInterval) {
      const position = second * pixelsPerSecond
      const isMajor = second % majorInterval === 0

      ticks.push({
        position,
        label: isMajor ? formatTime(second * 1000) : '',
        major: isMajor,
      })
    }

    return ticks
  }

  // Enhanced time formatting with intelligent units
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    // Show hours only if >= 1 hour
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    // Show minutes:seconds format
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTimecode = (x / zoom) * 1000
    seek(clickedTimecode)
  }

  // Keyboard: M to add marker at current playhead
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        const time = useCompositorStore.getState().timecode
        addMarker(time)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [addMarker])

  const ticks = generateTicks()

  return (
    <div
      ref={containerRef}
      className="timeline-ruler relative h-8 bg-muted/50 border-b border-border cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Ticks */}
      {ticks.map((tick, index) => (
        <div
          key={index}
          className="absolute top-0"
          style={{ left: `${tick.position}px` }}
        >
          {/* Tick mark */}
          <div
            className={`
              ${tick.major ? 'h-4 bg-muted-foreground' : 'h-2 bg-muted-foreground/50'}
              w-px
            `}
          />
          {/* Label */}
          {tick.label && (
            <div className="absolute top-4 left-0 text-xs text-muted-foreground whitespace-nowrap">
              {tick.label}
            </div>
          )}
        </div>
      ))}

      {/* Markers */}
      {markers.map((m) => (
        <div
          key={m.id}
          className="absolute top-0 h-full w-px bg-amber-500"
          title={m.label || 'Marker'}
          style={{ left: `${(m.time / 1000) * zoom}px` }}
          onClick={(e) => {
            e.stopPropagation()
            seek(m.time)
          }}
        />
      ))}
    </div>
  )
}
