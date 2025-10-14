'use client'

import { useTimelineStore } from '@/stores/timeline'
import { TimelineTrack } from './TimelineTrack'
import { TimelineRuler } from './TimelineRuler' // ✅ Phase 5追加
import { PlayheadIndicator } from './PlayheadIndicator' // ✅ Phase 5追加
import { SplitButton } from './SplitButton' // ✅ Phase 6追加
import { SelectionBox } from './SelectionBox' // ✅ Phase 6追加 (T069)
import { useEffect } from 'react'
import { getEffects } from '@/app/actions/effects'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TimelineProps {
  projectId: string
}

export function Timeline({ projectId }: TimelineProps) {
  const { effects, trackCount, zoom, setEffects } = useTimelineStore()

  // Load effects when component mounts
  useEffect(() => {
    loadEffects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadEffects = async () => {
    try {
      const loadedEffects = await getEffects(projectId)
      setEffects(loadedEffects)
    } catch (error) {
      console.error('Failed to load effects:', error)
    }
  }

  // Calculate timeline width based on longest effect
  const timelineWidth = Math.max(
    ...effects.map((e) => ((e.start_at_position + e.duration) / 1000) * zoom),
    5000 // Minimum 5000px
  )

  return (
    <div className="timeline-container flex-1 flex flex-col bg-muted/20">
      {/* Timeline header */}
      <div className="timeline-header h-12 border-b border-border bg-background flex items-center px-4">
        <h3 className="text-sm font-medium">Timeline</h3>
      </div>

      {/* Timeline ruler - ✅ Phase 5追加 */}
      <TimelineRuler projectId={projectId} />

      {/* Timeline tracks */}
      <ScrollArea className="flex-1">
        <div className="timeline-tracks relative" style={{ width: `${timelineWidth}px` }}>
          {/* Playhead - ✅ Phase 5追加 */}
          <PlayheadIndicator />

          {/* Selection Box - ✅ Phase 6追加 (T069) */}
          <SelectionBox />

          {Array.from({ length: trackCount }).map((_, index) => (
            <TimelineTrack key={index} trackIndex={index} effects={effects} />
          ))}
        </div>
      </ScrollArea>

      {/* Timeline footer - Phase 6: Added controls */}
      <div className="timeline-footer h-12 border-t border-border bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">{effects.length} effect(s)</div>
          <SplitButton />
        </div>
        <div className="text-xs text-muted-foreground">Zoom: {zoom}px/s</div>
      </div>
    </div>
  )
}
