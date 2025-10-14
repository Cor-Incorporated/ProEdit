'use client'

import { useTimelineStore } from '@/stores/timeline'
import { useCompositorStore } from '@/stores/compositor'

interface TimelineRulerProps {
  projectId: string
}

export function TimelineRuler({ projectId }: TimelineRulerProps) {
  const { zoom } = useTimelineStore()
  const { seek } = useCompositorStore()

  // Calculate ruler ticks
  const generateTicks = () => {
    const ticks: { position: number; label: string; major: boolean }[] = []
    const pixelsPerSecond = zoom
    const secondInterval = pixelsPerSecond < 50 ? 10 : pixelsPerSecond < 100 ? 5 : 1

    for (let second = 0; second < 3600; second += secondInterval) {
      const position = second * pixelsPerSecond
      const isMajor = second % (secondInterval * 5) === 0

      ticks.push({
        position,
        label: isMajor ? formatTime(second * 1000) : '',
        major: isMajor,
      })
    }

    return ticks
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedTimecode = (x / zoom) * 1000
    seek(clickedTimecode)
  }

  const ticks = generateTicks()

  return (
    <div
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
    </div>
  )
}
