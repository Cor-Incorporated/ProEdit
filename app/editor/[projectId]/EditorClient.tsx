'use client'

import { useState, useEffect, useRef } from 'react'
import { Timeline } from '@/features/timeline/components/Timeline'
import { MediaLibrary } from '@/features/media/components/MediaLibrary'
import { Canvas } from '@/features/compositor/components/Canvas'
import { PlaybackControls } from '@/features/compositor/components/PlaybackControls'
import { FPSCounter } from '@/features/compositor/components/FPSCounter'
import { ExportDialog } from '@/features/export/components/ExportDialog'
import { Button } from '@/components/ui/button'
import { PanelRightOpen, Download } from 'lucide-react'
import { Project } from '@/types/project'
import { Compositor } from '@/features/compositor/utils/Compositor'
import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'
import { getSignedUrl } from '@/app/actions/media'
import { useKeyboardShortcuts } from '@/features/timeline/hooks/useKeyboardShortcuts'
import { ExportController } from '@/features/export/utils/ExportController'
import { ExportQuality } from '@/features/export/types'
import { getMediaFileByHash } from '@/app/actions/media'
import { downloadFile } from '@/features/export/utils/download'
import { toast } from 'sonner'
import * as PIXI from 'pixi.js'
// Phase 9: Auto-save imports
import { AutoSaveManager, SaveStatus } from '@/features/timeline/utils/autosave'
import { RealtimeSyncManager, ConflictData } from '@/lib/supabase/sync'
import { SaveIndicatorCompact } from '@/components/SaveIndicator'
import { ConflictResolutionDialog } from '@/components/ConflictResolutionDialog'
import { RecoveryModal } from '@/components/RecoveryModal'

interface EditorClientProps {
  project: Project
}

export function EditorClient({ project }: EditorClientProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const compositorRef = useRef<Compositor | null>(null)
  const exportControllerRef = useRef<ExportController | null>(null)
  // Phase 9: Auto-save state
  const autoSaveManagerRef = useRef<AutoSaveManager | null>(null)
  const syncManagerRef = useRef<RealtimeSyncManager | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [conflict, setConflict] = useState<ConflictData | null>(null)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)

  // Phase 6: Enable keyboard shortcuts
  useKeyboardShortcuts()

  const {
    timecode,
    setTimecode,
    setFps,
    setDuration,
    setActualFps,
  } = useCompositorStore()

  const { effects } = useTimelineStore()

  // Initialize FPS from project settings
  useEffect(() => {
    setFps(project.settings.fps)
  }, [project.settings.fps, setFps])

  // Phase 9: Initialize auto-save and realtime sync
  useEffect(() => {
    // Check for recovery on mount
    const hasUnsavedChanges = localStorage.getItem(`proedit_recovery_${project.id}`)
    if (hasUnsavedChanges) {
      setShowRecoveryModal(true)
    }

    // Initialize auto-save manager
    autoSaveManagerRef.current = new AutoSaveManager(project.id, setSaveStatus)
    autoSaveManagerRef.current.startAutoSave()

    // Initialize realtime sync
    syncManagerRef.current = new RealtimeSyncManager(project.id, {
      onRemoteChange: (data) => {
        console.log('[Editor] Remote changes detected:', data)
        // Reload effects from server
        // This would trigger a re-fetch in a real implementation
      },
      onConflict: (conflictData) => {
        setConflict(conflictData)
        setShowConflictDialog(true)
      },
    })
    syncManagerRef.current.setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.cleanup()
      }
      if (syncManagerRef.current) {
        syncManagerRef.current.cleanup()
      }
    }
  }, [project.id])

  // Calculate timeline duration
  useEffect(() => {
    if (effects.length > 0) {
      const maxDuration = Math.max(
        ...effects.map((e) => e.start_at_position + e.duration)
      )
      setDuration(maxDuration)
    }
  }, [effects, setDuration])

  // Handle canvas ready
  const handleCanvasReady = (app: PIXI.Application) => {
    // Create compositor instance
    const compositor = new Compositor(
      app,
      async (mediaFileId: string) => {
        const url = await getSignedUrl(mediaFileId)
        return url
      },
      project.settings.fps
    )

    // Set callbacks
    compositor.setOnTimecodeChange(setTimecode)
    compositor.setOnFpsUpdate(setActualFps)

    compositorRef.current = compositor

    console.log('EditorClient: Compositor initialized')
  }

  // Handle playback controls
  const handlePlay = () => {
    if (compositorRef.current) {
      compositorRef.current.play()
    }
  }

  const handlePause = () => {
    if (compositorRef.current) {
      compositorRef.current.pause()
    }
  }

  const handleStop = () => {
    if (compositorRef.current) {
      compositorRef.current.stop()
    }
  }

  // Sync effects with compositor when they change
  useEffect(() => {
    if (compositorRef.current && effects.length > 0) {
      compositorRef.current.composeEffects(effects, timecode)
    }
  }, [effects, timecode])

  // Handle export with progress callback
  const handleExport = async (
    quality: ExportQuality,
    onProgress: (progress: {
      status: 'idle' | 'preparing' | 'composing' | 'encoding' | 'flushing' | 'complete' | 'error'
      progress: number
      currentFrame: number
      totalFrames: number
    }) => void
  ) => {
    if (!compositorRef.current) {
      toast.error('Compositor not initialized')
      throw new Error('Compositor not initialized')
    }

    if (effects.length === 0) {
      toast.error('No effects to export')
      throw new Error('No effects to export')
    }

    try {
      // Initialize export controller
      if (!exportControllerRef.current) {
        exportControllerRef.current = new ExportController()
      }

      const controller = exportControllerRef.current

      // Connect progress callback from ExportController to ExportDialog
      controller.onProgress(onProgress)

      // Define renderFrame callback using Compositor.renderFrameForExport
      const renderFrame = async (timestamp: number) => {
        return await compositorRef.current!.renderFrameForExport(timestamp, effects)
      }

      // Start export
      const result = await controller.startExport(
        {
          projectId: project.id,
          quality,
          includeAudio: true, // Default to include audio
        },
        effects,
        getMediaFileByHash,
        renderFrame
      )

      // Download exported file
      downloadFile(result.file, result.filename)

      toast.success('Export completed successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (compositorRef.current) {
        compositorRef.current.destroy()
      }
      if (exportControllerRef.current) {
        exportControllerRef.current.terminate()
      }
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Area - ✅ Phase 5実装 */}
      <div className="flex-1 relative flex items-center justify-center bg-muted/30 border-b border-border">
        <Canvas
          width={project.settings.width}
          height={project.settings.height}
          onAppReady={handleCanvasReady}
        />

        <FPSCounter />

        <Button
          variant="outline"
          className="absolute top-4 left-4"
          onClick={() => setMediaLibraryOpen(true)}
        >
          <PanelRightOpen className="h-4 w-4 mr-2" />
          Open Media Library
        </Button>

        <Button
          variant="default"
          className="absolute top-4 right-4"
          onClick={() => setExportDialogOpen(true)}
          disabled={effects.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Playback Controls */}
      <PlaybackControls
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
      />

      {/* Timeline Area - Phase 4完了 */}
      <div className="h-80 border-t border-border">
        <Timeline projectId={project.id} />
      </div>

      {/* Media Library Panel */}
      <MediaLibrary
        projectId={project.id}
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
      />

      {/* Export Dialog */}
      <ExportDialog
        projectId={project.id}
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
      />

      {/* Phase 9: Auto-save UI */}
      <div className="fixed bottom-4 left-4 z-50">
        <SaveIndicatorCompact status={saveStatus} />
      </div>

      {/* Phase 9: Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        conflict={conflict}
        isOpen={showConflictDialog}
        onResolve={(strategy) => {
          if (syncManagerRef.current) {
            void syncManagerRef.current.handleConflictResolution(strategy)
          }
          setShowConflictDialog(false)
          setConflict(null)
        }}
        onClose={() => {
          setShowConflictDialog(false)
          setConflict(null)
        }}
      />

      {/* Phase 9: Recovery Modal */}
      <RecoveryModal
        isOpen={showRecoveryModal}
        onRecover={() => {
          console.log('[Editor] Recovering unsaved changes')
          localStorage.removeItem(`proedit_recovery_${project.id}`)
          setShowRecoveryModal(false)
          toast.success('Changes recovered successfully')
        }}
        onDiscard={() => {
          console.log('[Editor] Discarding unsaved changes')
          localStorage.removeItem(`proedit_recovery_${project.id}`)
          setShowRecoveryModal(false)
        }}
      />
    </div>
  )
}
