'use client'

// T086: Export Progress Component

import { ExportProgress as ExportProgressType } from '../types'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

export interface ExportProgressProps {
  progress: ExportProgressType
}

function getStatusLabel(status: ExportProgressType['status']): string {
  const labels: Record<typeof status, string> = {
    idle: 'Ready',
    preparing: 'Preparing export...',
    composing: 'Rendering frames...',
    encoding: 'Encoding video...',
    flushing: 'Finalizing...',
    complete: 'Export complete!',
    error: 'Export failed',
  }
  return labels[status]
}

export function ExportProgress({ progress }: ExportProgressProps) {
  const { status, progress: percentage, currentFrame, totalFrames } = progress

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status !== 'complete' && status !== 'error' && status !== 'idle' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span className="font-medium">{getStatusLabel(status)}</span>
        </div>
        <span className="text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      {totalFrames > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Frame {currentFrame} / {totalFrames}
          {progress.estimatedTimeRemaining && (
            <span className="ml-2">
              (~{Math.ceil(progress.estimatedTimeRemaining)}s remaining)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
