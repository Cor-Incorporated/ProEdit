import { Skeleton } from "@/components/ui/skeleton";

/**
 * Editor loading state
 * Mimics the editor layout structure with preview and timeline areas
 */
export default function EditorLoading() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Preview Area Skeleton */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 border-b border-border p-8">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="aspect-video w-full" />
        </div>
      </div>

      {/* Timeline Area Skeleton */}
      <div className="h-80 bg-background border-t border-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 flex-1" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
