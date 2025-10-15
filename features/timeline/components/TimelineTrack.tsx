'use client'

import { useTimelineStore } from '@/stores/timeline'
import { Effect } from '@/types/effects'
import { Lock, LockOpen } from 'lucide-react'
import { EffectBlock } from './EffectBlock'

interface TimelineTrackProps {
  trackIndex: number
  effects: Effect[]
}

export function TimelineTrack({ trackIndex, effects }: TimelineTrackProps) {
  // Filter effects for this track
  const trackEffects = effects.filter(e => e.track === trackIndex)
  const { lockedTracks, toggleTrackLock } = useTimelineStore()
  const isLocked = lockedTracks.includes(trackIndex)

  return (
    <div className="timeline-track relative h-12 border-b border-border bg-background">
      {/* Track label */}
      <div className="absolute left-0 top-0 h-full w-16 flex items-center justify-center bg-muted border-r border-border gap-1">
        <button
          type="button"
          className="p-1 rounded hover:bg-white/10"
          title={isLocked ? 'トラックのロック解除' : 'トラックをロック'}
          onClick={() => toggleTrackLock(trackIndex)}
        >
          {isLocked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        <span className="text-xs text-muted-foreground">{trackIndex + 1}</span>
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
