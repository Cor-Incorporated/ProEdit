"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MediaUpload } from "./MediaUpload";
import { MediaCard } from "./MediaCard";
import { useMediaStore } from "@/stores/media";
import { useEffect } from "react";
import { getMediaFiles } from "@/app/actions/media";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaLibraryProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaLibrary({ projectId, open, onOpenChange }: MediaLibraryProps) {
  const { mediaFiles, isLoading, setMediaFiles, setLoading } = useMediaStore();

  // Load media files when opened
  useEffect(() => {
    if (open && mediaFiles.length === 0) {
      loadMediaFiles();
    }
  }, [open]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      const files = await getMediaFiles();
      setMediaFiles(files);
    } catch (error) {
      console.error("Failed to load media files:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>メディアライブラリ</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Upload zone */}
          <MediaUpload projectId={projectId} />

          {/* Media list */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>メディアファイルがありません</p>
              <p className="text-sm mt-2">ファイルをドラッグ＆ドロップしてアップロード</p>
            </div>
          ) : (
            <div className="media-browser">
              {mediaFiles.map((media) => (
                <MediaCard key={media.id} media={media} projectId={projectId} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
