'use client'

import { useCompositorStore } from '@/stores/compositor'

export function FPSCounter() {
  const { actualFps, fps } = useCompositorStore()

  const getFpsColor = () => {
    if (actualFps >= fps * 0.9) return 'text-green-500'
    if (actualFps >= fps * 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="fps-counter absolute top-4 right-4 bg-black/80 px-3 py-1 rounded text-xs font-mono">
      <span className={getFpsColor()}>{actualFps.toFixed(1)} fps</span>
      <span className="text-muted-foreground ml-2">/ {fps} fps target</span>
    </div>
  )
}
