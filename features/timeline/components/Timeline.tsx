'use client'

import { getEffects } from '@/app/actions/effects'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTimelineStore } from '@/stores/timeline'
import { Clock, Magnet, Minus, Plus, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PlayheadIndicator } from './PlayheadIndicator'; // ✅ Phase 5追加
import { SelectionBox } from './SelectionBox'; // ✅ Phase 6追加 (T069)
import { SplitButton } from './SplitButton'; // ✅ Phase 6追加
import { TimelineRuler } from './TimelineRuler'; // ✅ Phase 5追加
import { TimelineTrack } from './TimelineTrack'

interface TimelineProps {
  projectId: string
}

// Zoom presets (pixels per second)
const ZOOM_LEVELS = [
  { label: '10%', value: 10 },
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
  { label: '150%', value: 150 },
  { label: '200%', value: 200 },
  { label: '300%', value: 300 },
]

// Track constraints
const MIN_TRACKS = 1
const MAX_TRACKS = 10

export function Timeline({ projectId }: TimelineProps) {
  const { effects, trackCount, zoom, setEffects, setZoom, setTrackCount, snapEnabled, toggleSnap } = useTimelineStore()

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

  // Zoom controls
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z.value >= zoom)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1].value)
    }
  }

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z.value >= zoom)
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1].value)
    }
  }

  const getCurrentZoomLabel = () => {
    const level = ZOOM_LEVELS.find(z => z.value === zoom)
    return level ? level.label : `${zoom}px/s`
  }

  // Track management
  const handleAddTrack = () => {
    if (trackCount >= MAX_TRACKS) {
      toast.error(`Maximum ${MAX_TRACKS} tracks allowed`)
      return
    }
    setTrackCount(trackCount + 1)
    toast.success(`Track ${trackCount + 1} added`)
  }

  const handleRemoveTrack = () => {
    if (trackCount <= MIN_TRACKS) {
      toast.error(`Minimum ${MIN_TRACKS} track required`)
      return
    }

    // Check if the last track has any effects
    const lastTrackEffects = effects.filter(e => e.track === trackCount - 1)
    if (lastTrackEffects.length > 0) {
      toast.error(`Cannot remove track ${trackCount} - it contains ${lastTrackEffects.length} effect(s)`)
      return
    }

    setTrackCount(trackCount - 1)
    toast.success(`Track ${trackCount} removed`)
  }

  // Calculate timeline width based on longest effect
  const timelineWidth = Math.max(
    ...effects.map((e) => ((e.start_at_position + e.duration) / 1000) * zoom),
    5000 // Minimum 5000px
  )

  return (
    <div className="timeline-container flex-1 flex flex-col bg-muted/20">
      {/* Timeline header with all controls */}
      <div className="timeline-header h-12 border-b border-border bg-background flex items-center justify-between px-4 gap-4">
        {/* Left: Title and effect count */}
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">タイムライン</h3>
          <span className="text-xs text-muted-foreground">{effects.length} エフェクト</span>
        </div>
        
        {/* Right: All controls */}
        <div className="flex items-center gap-4">
          {/* Track controls */}
          <div className="flex items-center gap-2 border-r pr-4">
            <span className="text-xs text-muted-foreground">{trackCount} トラック</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveTrack}
              disabled={trackCount <= MIN_TRACKS}
              title="トラックを削除"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTrack}
              disabled={trackCount >= MAX_TRACKS}
              title="トラックを追加"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Split button */}
          <div className="border-r pr-4">
            <SplitButton />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            {/* Snap toggle */}
            <Button
              variant={snapEnabled ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleSnap}
              title={snapEnabled ? 'スナップ: ON' : 'スナップ: OFF'}
            >
              <Magnet className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= ZOOM_LEVELS[0].value}
              title="ズームアウト"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="min-w-[80px]">
                  <Clock className="h-4 w-4 mr-1" />
                  {getCurrentZoomLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ZOOM_LEVELS.map((level) => (
                  <DropdownMenuItem
                    key={level.value}
                    onClick={() => setZoom(level.value)}
                    className={zoom === level.value ? 'bg-accent' : ''}
                  >
                    {level.label} ({level.value}px/s)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1].value}
              title="ズームイン"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline ruler - ✅ Phase 5追加 */}
      <TimelineRuler projectId={projectId} />

      {/* Timeline tracks */}
      <ScrollArea className="flex-1" onWheel={(e) => {
        if (e.altKey) {
          e.preventDefault()
          if (e.deltaY > 0) handleZoomOut(); else handleZoomIn()
        }
      }}>
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

      {/* Timeline footer - Minimal info display */}
      <div className="timeline-footer h-8 border-t border-border bg-background flex items-center justify-center px-4">
        <div className="text-xs text-muted-foreground">
          ヒント: エフェクトをドラッグして移動、選択して削除
        </div>
      </div>
    </div>
  )
}
