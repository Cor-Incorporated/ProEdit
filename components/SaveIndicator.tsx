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

export function SaveIndicator({
  status,
  lastSaved,
  className,
}: SaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case "saved":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          text: "Saved",
          subtext: lastSaved
            ? `Last saved ${formatRelativeTime(lastSaved)}`
            : undefined,
          className: "text-green-500",
        };

      case "saving":
        return {
          icon: (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          ),
          text: "Saving...",
          className: "text-blue-500",
        };

      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          text: "Save failed",
          subtext: "Click to retry",
          className: "text-red-500",
        };

      case "offline":
        return {
          icon: <WifiOff className="h-4 w-4 text-amber-500" />,
          text: "Offline",
          subtext: "Changes will sync when online",
          className: "text-amber-500",
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-opacity",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {display.icon}
        <span className={cn("font-medium", display.className)}>
          {display.text}
        </span>
      </div>

      {display.subtext && (
        <span className="text-xs text-muted-foreground">{display.subtext}</span>
      )}
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

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24)
    return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
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
      return "All changes saved";
    case "saving":
      return "Saving changes...";
    case "error":
      return "Save failed - click to retry";
    case "offline":
      return "Offline - changes will sync when connection is restored";
  }
}
