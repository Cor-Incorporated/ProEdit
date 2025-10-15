"use client";

/**
 * Save Indicator Component
 * Displays auto-save status to users
 */

import { SaveStatus } from "@/features/timeline/utils/autosave";
import { CheckCircle2, Loader2, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  className?: string;
}

export function SaveIndicator({ status, lastSaved, className }: SaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case "saved":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          text: "保存済み",
          subtext: lastSaved ? `最終保存: ${formatRelativeTime(lastSaved)}` : undefined,
          className: "text-green-500",
        };

      case "saving":
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
          text: "保存中...",
          className: "text-blue-500",
        };

      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          text: "保存失敗",
          subtext: "クリックして再試行",
          className: "text-red-500",
        };

      case "offline":
        return {
          icon: <WifiOff className="h-4 w-4 text-amber-500" />,
          text: "オフライン",
          subtext: "オンライン時に同期されます",
          className: "text-amber-500",
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={cn("flex items-center gap-2 text-sm transition-opacity", className)}>
      <div className="flex items-center gap-1.5">
        {display.icon}
        <span className={cn("font-medium", display.className)}>{display.text}</span>
      </div>

      {display.subtext && <span className="text-xs text-muted-foreground">{display.subtext}</span>}
    </div>
  );
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "たった今";
  if (diffSec < 60) return `${diffSec}秒前`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}日前`;
}

/**
 * Compact version for toolbar
 */
export function SaveIndicatorCompact({
  status,
  className,
}: {
  status: SaveStatus;
  className?: string;
}) {
  const getIcon = () => {
    switch (status) {
      case "saved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "saving":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center p-1.5 rounded-md",
        "transition-colors",
        {
          "bg-green-500/10": status === "saved",
          "bg-blue-500/10": status === "saving",
          "bg-red-500/10": status === "error",
          "bg-amber-500/10": status === "offline",
        },
        className
      )}
      title={getStatusTitle(status)}
    >
      {getIcon()}
    </div>
  );
}

function getStatusTitle(status: SaveStatus): string {
  switch (status) {
    case "saved":
      return "すべての変更を保存しました";
    case "saving":
      return "変更を保存中...";
    case "error":
      return "保存失敗 - クリックして再試行";
    case "offline":
      return "オフライン - 接続が復元されたら同期されます";
  }
}
