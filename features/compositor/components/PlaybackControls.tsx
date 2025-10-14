'use client'

import { Button } from '@/components/ui/button'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useCompositorStore } from '@/stores/compositor'

interface PlaybackControlsProps {
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onSeekBackward?: () => void
  onSeekForward?: () => void
}

export function PlaybackControls({
  onPlay,
  onPause,
  onStop,
  onSeekBackward,
  onSeekForward,
}: PlaybackControlsProps) {
  const { isPlaying, timecode, duration, togglePlayPause, stop } = useCompositorStore()

  // Format timecode to MM:SS.mmm
  const formatTimecode = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    togglePlayPause()
    if (isPlaying) {
      onPause?.()
    } else {
      onPlay?.()
    }
  }

  const handleStop = () => {
    stop()
    onStop?.()
  }

  const handleSeekBackward = () => {
    onSeekBackward?.()
  }

  const handleSeekForward = () => {
    onSeekForward?.()
  }

  return (
    <div className="playback-controls flex items-center gap-2 px-4 py-2 bg-muted/50 border-t border-border">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSeekBackward}
          disabled={timecode === 0}
          title="Seek Backward (←)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSeekForward}
          disabled={timecode >= duration}
          title="Seek Forward (→)"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timecode display */}
      <div className="flex items-center gap-2 ml-4">
        <div className="text-sm font-mono text-muted-foreground">
          {formatTimecode(timecode)}
        </div>
        <span className="text-muted-foreground">/</span>
        <div className="text-sm font-mono text-muted-foreground">
          {formatTimecode(duration)}
        </div>
      </div>
    </div>
  )
}
