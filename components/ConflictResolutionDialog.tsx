"use client";

/**
 * Conflict Resolution Dialog
 * Handles multi-tab editing conflicts (T096)
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConflictData } from "@/lib/supabase/sync";
import { Clock } from "lucide-react";

interface ConflictResolutionDialogProps {
  conflict: ConflictData | null;
  isOpen: boolean;
  onResolve: (strategy: "local" | "remote") => void;
  onClose: () => void;
}

export function ConflictResolutionDialog({
  conflict,
  isOpen,
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  if (!conflict) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>編集の競合を検出しました</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p>
              このプロジェクトは別のタブまたはデバイスで変更されました。保持するバージョンを選択してください：
            </p>

            <div className="grid gap-3">
              {/* Local changes */}
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">あなたの変更</div>
                  <div className="text-sm text-muted-foreground">
                    変更時刻: {formatTime(conflict.localTimestamp)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">このタブで行われた変更</div>
                </div>
              </div>

              {/* Remote changes */}
              <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-md border border-purple-500/20">
                <Clock className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">他の変更</div>
                  <div className="text-sm text-muted-foreground">
                    変更時刻: {formatTime(conflict.remoteTimestamp)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    別のタブまたはデバイスからの変更
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-500">警告: 選択しなかったバージョンは失われます。</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onResolve("remote")} className="sm:flex-1">
            他の変更を使用
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onResolve("local")} className="sm:flex-1">
            あなたの変更を保持
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
