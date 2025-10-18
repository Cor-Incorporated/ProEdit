'use client'

import { createTextEffect, updateTextEffectStyle } from '@/app/actions/effects'
import { getSignedUrl } from '@/app/actions/media'
import { Button } from '@/components/ui/button'
import { Canvas } from '@/features/compositor/components/Canvas'
import { FPSCounter } from '@/features/compositor/components/FPSCounter'
import { PlaybackControls } from '@/features/compositor/components/PlaybackControls'
import { Compositor } from '@/features/compositor/utils/Compositor'
import { TextEditor } from '@/features/effects/components/TextEditor'
import { ExportDialog } from '@/features/export/components/ExportDialog'
import { ExportQuality } from '@/features/export/types'
import { downloadFile } from '@/features/export/utils/download'
import { MediaLibrary } from '@/features/media/components/MediaLibrary'
import { Timeline } from '@/features/timeline/components/Timeline'
import { useKeyboardShortcuts } from '@/features/timeline/hooks/useKeyboardShortcuts'
import { useCompositorStore } from '@/stores/compositor'
import { useTimelineStore } from '@/stores/timeline'
import { TextEffect } from '@/types/effects'
import { Project } from '@/types/project'
import { Download, PanelRightOpen, Type } from 'lucide-react'
import * as PIXI from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
// Phase 9: Auto-save imports (AutoSaveManager managed by Zustand)
import { ServiceWorkerDebug } from '@/app/sw-debug'
import { ConflictResolutionDialog } from '@/components/ConflictResolutionDialog'
import { RecoveryModal } from '@/components/RecoveryModal'
import { SaveIndicatorCompact } from '@/components/SaveIndicator'
import { SaveStatus } from '@/features/timeline/utils/autosave'
import { ConflictData, RealtimeSyncManager } from '@/lib/supabase/sync'

interface EditorClientProps {
  project: Project
}

export function EditorClient({ project }: EditorClientProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  // Phase 7: Text Editor state
  const [textEditorOpen, setTextEditorOpen] = useState(false)
  const [selectedTextEffect, setSelectedTextEffect] = useState<TextEffect | null>(null)

  const compositorRef = useRef<Compositor | null>(null)
  // Phase 9: Realtime sync state (AutoSave managed by Zustand)
  const syncManagerRef = useRef<RealtimeSyncManager | null>(null)
  const exportPollRef = useRef<NodeJS.Timeout | null>(null)
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
    bindCompositor,
  } = useCompositorStore()

  const { effects, updateEffect } = useTimelineStore()

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

    // Initialize auto-save through Zustand store - Phase 9 FR-009
    const { initAutoSave, cleanup } = useTimelineStore.getState()
    initAutoSave(project.id, setSaveStatus)

    // Initialize realtime sync
    syncManagerRef.current = new RealtimeSyncManager(project.id, {
      onRemoteChange: (data) => {
        console.log('[エディタ] リモート変更を検出:', data)
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
      cleanup() // AutoSave cleanup through Zustand
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
  // CRITICAL FIX: Use useCallback to prevent Canvas re-mounting on every render
  // Without this, Canvas useEffect runs infinitely because onAppReady changes
  const handleCanvasReady = useCallback((app: PIXI.Application) => {
    // Create compositor instance with TextManager support
    const compositor = new Compositor(
      app,
      async (mediaFileId: string) => {
        const url = await getSignedUrl(mediaFileId, { preferProxy: true })
        return url
      },
      project.settings.fps,
      // Text effect update callback - Phase 7 T079
      async (effectId: string, updates: Partial<TextEffect>) => {
        await updateTextEffectStyle(effectId, updates.properties!)
        updateEffect(effectId, updates)
      }
    )

    // Set callbacks
    compositor.setOnTimecodeChange(setTimecode)
    compositor.setOnFpsUpdate(setActualFps)

    compositorRef.current = compositor

    // Bind Compositor control APIs to store so UI/keyboard seek actually controls engine
    bindCompositor({
      play: () => compositor.play(),
      pause: () => compositor.pause(),
      stop: () => compositor.stop(),
      seek: (ms: number) => { void compositor.seek(ms) },
    })

    // 上記は開発用ログ
  }, [project.settings.fps, setTimecode, setActualFps, updateEffect])

  // Phase 7 T077: Handle text effect creation/update
  const handleTextSave = async (textEffect: TextEffect) => {
    try {
      if (selectedTextEffect) {
        // Update existing text effect
        const updated = await updateTextEffectStyle(textEffect.id, textEffect.properties)
        updateEffect(textEffect.id, updated)
        toast.success('テキストを更新しました')
      } else {
        // Create new text effect
        const created = await createTextEffect(project.id, textEffect.properties.text)
        // Add to timeline store
        useTimelineStore.getState().addEffect(created)
        toast.success('テキストをタイムラインに追加しました')
      }
      setTextEditorOpen(false)
      setSelectedTextEffect(null)
    } catch (error) {
      console.error('Text save error:', error)
      toast.error('テキストの保存に失敗しました')
    }
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

  // Memoize effects IDs to detect actual changes
  // This prevents unnecessary updates when effects array reference changes without content changes
  const effectIds = useMemo(() => 
    effects.map(e => e.id).sort().join(','),
    [effects]
  )

  // Sync effects with compositor when they actually change
  // FIXED: Let Compositor handle playback loop, React only updates on effects changes
  // OPTIMIZED: Only update when effect IDs actually change (not just array reference)
  useEffect(() => {
    if (!compositorRef.current) return
    
    const compositor = compositorRef.current
    
    // Store effects in Compositor so playback loop can access them
    compositor.setEffects(effects)
    
    // If paused, explicitly recompose at current timecode
    // (playing compositor will recompose automatically on next frame)
    if (!compositor.getIsPlaying()) {
      void compositor.composeEffects(effects, compositor.getTimecode())
    }
  }, [effectIds, effects]) // Only trigger when effectIds change

  const mapJobStatusToProgress = (status: string): 'preparing' | 'encoding' | 'flushing' | 'complete' | 'error' => {
    switch (status) {
      case 'pending':
        return 'preparing'
      case 'processing':
        return 'encoding'
      case 'completed':
        return 'complete'
      case 'failed':
        return 'error'
      default:
        return 'preparing'
    }
  }

  const clearExportPoll = () => {
    if (exportPollRef.current) {
      clearInterval(exportPollRef.current)
      exportPollRef.current = null
    }
  }

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
      toast.error('コンポジタが初期化されていません')
      throw new Error('Compositor not initialized')
    }

    if (effects.length === 0) {
      toast.error('エクスポートするエフェクトがありません')
      throw new Error('No effects to export')
    }

    clearExportPoll()

    onProgress({
      status: 'preparing',
      progress: 5,
      currentFrame: 0,
      totalFrames: 0,
    })

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          quality,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : `サーバーエクスポートに失敗しました (HTTP ${response.status})`
        throw new Error(message)
      }

      const jobId = payload?.jobId as string | undefined
      if (!jobId) {
        throw new Error('エクスポートジョブIDの取得に失敗しました')
      }

      await new Promise<void>((resolve, reject) => {
        const pollJobStatus = async () => {
          try {
            const statusResponse = await fetch(`/api/render/${jobId}`)
            const jobPayload = await statusResponse.json().catch(() => ({}))

            if (!statusResponse.ok) {
              const message =
                typeof jobPayload?.error === 'string'
                  ? jobPayload.error
                  : `ジョブステータスの取得に失敗しました (HTTP ${statusResponse.status})`
              throw new Error(message)
            }

            const jobStatus = String(jobPayload.status ?? 'pending')
            const mappedStatus = mapJobStatusToProgress(jobStatus)
            const jobProgress = typeof jobPayload.progress === 'number' ? jobPayload.progress : 0

            onProgress({
              status: mappedStatus,
              progress: jobProgress,
              currentFrame: 0,
              totalFrames: 0,
            })

            if (jobStatus === 'completed' && jobPayload.downloadUrl) {
              clearExportPoll()

              const downloadResponse = await fetch(jobPayload.downloadUrl)
              if (!downloadResponse.ok) {
                throw new Error('エクスポート済みファイルの取得に失敗しました')
              }

              const arrayBuffer = await downloadResponse.arrayBuffer()
              const data = new Uint8Array(arrayBuffer)
              const filename =
                typeof jobPayload.filename === 'string'
                  ? jobPayload.filename
                  : `export_${quality}_${Date.now()}.mp4`

              downloadFile(data, filename)

              onProgress({
                status: 'complete',
                progress: 100,
                currentFrame: 0,
                totalFrames: 0,
              })

              toast.success('エクスポートが完了しました！')
              resolve()
              return
            }

            if (jobStatus === 'failed') {
              clearExportPoll()
              const errorMessage =
                typeof jobPayload.error_message === 'string' && jobPayload.error_message.length > 0
                  ? jobPayload.error_message
                  : 'サーバーエクスポートに失敗しました'
              throw new Error(errorMessage)
            }
          } catch (error) {
            clearExportPoll()
            reject(error)
          }
        }

        // Initial poll
        void pollJobStatus()
        exportPollRef.current = setInterval(() => {
          void pollJobStatus()
        }, 2000)
      })
    } catch (error) {
      console.error('Export error:', error)
      clearExportPoll()
      onProgress({
        status: 'error',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
      })
      toast.error(`エクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
      throw error
    }
  }

  // Cleanup on unmount
  // CRITICAL: Compositor must be destroyed BEFORE Canvas cleanup
  // This ensures proper cleanup order: Compositor managers → PIXI app
  useEffect(() => {
    return () => {
      // Destroy Compositor first (cleans up managers and removes sprites)
      if (compositorRef.current) {
        compositorRef.current.destroy()
        compositorRef.current = null
      }

      if (exportPollRef.current) {
        clearInterval(exportPollRef.current)
        exportPollRef.current = null
      }

      // Canvas cleanup (app.destroy) will happen automatically in Canvas component
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Service Worker Debug (FFmpeg.wasm requirement) */}
      <ServiceWorkerDebug />

      {/* Preview Area - Fixed max height to ensure timeline visibility */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center bg-muted/30 border-b border-border overflow-hidden">
        <Canvas
          width={project.settings.width}
          height={project.settings.height}
          onAppReady={handleCanvasReady}
        />

        <FPSCounter />

        {/* Control buttons - top left with proper spacing */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => setMediaLibraryOpen(true)}
          >
            <PanelRightOpen className="h-4 w-4 mr-2" />
            メディアライブラリ
          </Button>

          {/* Phase 7 T077: Add Text Button */}
          <Button
            variant="outline"
            size="default"
            onClick={() => {
              setSelectedTextEffect(null)
              setTextEditorOpen(true)
            }}
          >
            <Type className="h-4 w-4 mr-2" />
            テキストを追加
          </Button>
        </div>

        {/* Export button - top right */}
        <Button
          variant="default"
          className="absolute top-4 right-4"
          onClick={() => setExportDialogOpen(true)}
          disabled={effects.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          エクスポート
        </Button>
      </div>

      {/* Playback Controls - Fixed height */}
      <div className="flex-shrink-0">
        <PlaybackControls
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
        />
      </div>

      {/* Timeline Area - Fixed height, always visible */}
      <div className="flex-shrink-0 h-80 border-t border-border overflow-hidden">
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

      {/* Phase 7 T077: Text Editor */}
      <TextEditor
        effect={selectedTextEffect ?? undefined}
        open={textEditorOpen}
        onSave={handleTextSave}
        onClose={() => {
          setTextEditorOpen(false)
          setSelectedTextEffect(null)
        }}
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
          console.log('[エディタ] 未保存の変更を復元')
          localStorage.removeItem(`proedit_recovery_${project.id}`)
          setShowRecoveryModal(false)
          toast.success('変更を復元しました')
        }}
        onDiscard={() => {
          console.log('[エディタ] 未保存の変更を破棄')
          localStorage.removeItem(`proedit_recovery_${project.id}`)
          setShowRecoveryModal(false)
        }}
      />
    </div>
  )
}
