'use client'

import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useCompositorStore } from '@/stores/compositor'
import { toast } from 'sonner'

interface CanvasProps {
  width: number
  height: number
  onAppReady?: (app: PIXI.Application) => void
}

export function Canvas({ width, height, onAppReady }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const [isReady, setIsReady] = useState(false)
  const { setCanvasReady } = useCompositorStore()

  useEffect(() => {
    if (!containerRef.current || appRef.current) return

    // Initialize PIXI Application (from omniclip:37) - v7 API
    try {
      const app = new PIXI.Application({
        width,
        height,
        backgroundColor: 0x000000, // Black background
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (!containerRef.current) return

      // Append canvas to container (v7 uses app.view instead of app.canvas)
      containerRef.current.appendChild(app.view as HTMLCanvasElement)

      // Configure stage (from omniclip:49-50)
      app.stage.sortableChildren = true
      // PIXI v7.2+: Use eventMode instead of deprecated interactive property
      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      // Store app reference
      appRef.current = app
      setIsReady(true)
      setCanvasReady(true)

      // Notify parent
      if (onAppReady) {
        onAppReady(app)
      }

      toast.success('Canvas initialized', {
        description: `${width}x${height} @ 60fps`,
      })
    } catch (error: any) {
      console.error('Failed to initialize PIXI:', error)
      toast.error('Failed to initialize canvas', {
        description: error.message,
      })
    }

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
        setCanvasReady(false)
      }
    }
  }, [width, height, onAppReady, setCanvasReady])

  return (
    <div
      ref={containerRef}
      className="canvas-container relative bg-black rounded-lg overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60">Initializing canvas...</div>
        </div>
      )}
    </div>
  )
}
