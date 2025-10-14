'use client'

import { Effect } from '@/types/effects'
import { EffectBlock } from './EffectBlock'

interface TimelineTrackProps {
  trackIndex: number
  effects: Effect[]
}

export function TimelineTrack({ trackIndex, effects }: TimelineTrackProps) {
  // Filter effects for this track
  const trackEffects = effects.filter(e => e.track === trackIndex)

  return (
    <div className="timeline-track relative h-12 border-b border-border bg-background">
      {/* Track label */}
      <div className="absolute left-0 top-0 h-full w-16 flex items-center justify-center bg-muted border-r border-border">
        <span className="text-xs text-muted-foreground">Track {trackIndex + 1}</span>
      </div>

      {/* Track content area */}
      <div className="absolute left-16 top-0 right-0 h-full">
        {trackEffects.map(effect => (
          <EffectBlock key={effect.id} effect={effect} />
        ))}
      </div>
    </div>
  )
}
