"use client";

// T086: Export Progress Component

import { ExportProgress as ExportProgressType } from "../types";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export interface ExportProgressProps {
  progress: ExportProgressType;
}

function getStatusLabel(status: ExportProgressType["status"]): string {
  const labels: Record<typeof status, string> = {
    idle: "準備完了",
    preparing: "エクスポートを準備中...",
    composing: "フレームをレンダリング中...",
    encoding: "動画をエンコード中...",
    flushing: "最終処理中...",
    complete: "エクスポート完了！",
    error: "エクスポート失敗",
  };
  return labels[status];
}

export function ExportProgress({ progress }: ExportProgressProps) {
  const { status, progress: percentage, currentFrame, totalFrames } = progress;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status !== "complete" && status !== "error" && status !== "idle" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span className="font-medium">{getStatusLabel(status)}</span>
        </div>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>

      <Progress value={percentage} className="h-2" />

      {totalFrames > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          フレーム {currentFrame} / {totalFrames}
          {progress.estimatedTimeRemaining && (
            <span className="ml-2">(残り約{Math.ceil(progress.estimatedTimeRemaining)}秒)</span>
          )}
        </div>
      )}
    </div>
  );
}
