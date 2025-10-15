'use client'

import { Button } from '@/components/ui/button'
import { useCompositorStore } from '@/stores/compositor'
import { Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react'

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
  const { isPlaying, timecode, duration, togglePlayPause, stop, seek } = useCompositorStore()

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
    seek(Math.max(0, timecode - 1000))
    onSeekBackward?.()
  }

  const handleSeekForward = () => {
    seek(Math.min(duration, timecode + 1000))
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
          title="1秒戻る (←)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          title={isPlaying ? '一時停止 (Space)' : '再生 (Space)'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => { stop(); seek(0) }}
          title="停止 / 先頭へ"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSeekForward}
          disabled={timecode >= duration}
          title="1秒進む (→)"
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
