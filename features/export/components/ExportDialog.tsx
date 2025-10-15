"use client";

// T080: Export Dialog Component

import { useState } from "react";
import { ExportQuality } from "../types";
import { QualitySelector } from "./QualitySelector";
import { ExportProgress } from "./ExportProgress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onExport: (
    quality: ExportQuality,
    onProgress: (progress: {
      status: "idle" | "preparing" | "composing" | "encoding" | "flushing" | "complete" | "error";
      progress: number;
      currentFrame: number;
      totalFrames: number;
    }) => void
  ) => Promise<void>;
}

export function ExportDialog({ open, onOpenChange, projectId, onExport }: ExportDialogProps) {
  const [quality, setQuality] = useState<ExportQuality>("1080p");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<{
    status: "idle" | "preparing" | "composing" | "encoding" | "flushing" | "complete" | "error";
    progress: number;
    currentFrame: number;
    totalFrames: number;
  }>({
    status: "idle",
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      setProgress({
        status: "preparing",
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
      });

      // Pass progress callback to parent
      await onExport(quality, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      // Close dialog after successful export
      setTimeout(() => {
        onOpenChange(false);
        setExporting(false);
        setProgress({
          status: "idle",
          progress: 0,
          currentFrame: 0,
          totalFrames: 0,
        });
      }, 2000);
    } catch (error) {
      console.error("Export failed:", error);
      setProgress({
        status: "error",
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
      });
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>動画をエクスポート</DialogTitle>
          <DialogDescription>エクスポートの品質と設定を選択してください</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <QualitySelector value={quality} onValueChange={setQuality} disabled={exporting} />

          {exporting && <ExportProgress progress={progress} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            キャンセル
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              "エクスポート中..."
            ) : (
              <>
                <Download className="h-4 w-4" />
                エクスポート
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
