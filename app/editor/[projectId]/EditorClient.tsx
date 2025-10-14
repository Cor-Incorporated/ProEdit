'use client'

import { useState } from 'react'
import { Timeline } from '@/features/timeline/components/Timeline'
import { MediaLibrary } from '@/features/media/components/MediaLibrary'
import { Button } from '@/components/ui/button'
import { PanelRightOpen } from 'lucide-react'
import { Project } from '@/types/project'

interface EditorClientProps {
  project: Project
}

export function EditorClient({ project }: EditorClientProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Area - Phase 5で実装 */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 border-b border-border">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {project.settings.width}x{project.settings.height} • {project.settings.fps}fps
            </p>
          </div>
          <p className="text-muted-foreground max-w-md">
            Real-time preview will be available in Phase 5
          </p>
          <Button variant="outline" onClick={() => setMediaLibraryOpen(true)}>
            <PanelRightOpen className="h-4 w-4 mr-2" />
            Open Media Library
          </Button>
        </div>
      </div>

      {/* Timeline Area - Phase 4統合 */}
      <div className="h-80 border-t border-border">
        <Timeline projectId={project.id} />
      </div>

      {/* Media Library Panel - Phase 4統合 */}
      <MediaLibrary
        projectId={project.id}
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
      />
    </div>
  )
}
