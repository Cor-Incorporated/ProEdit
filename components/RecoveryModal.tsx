"use client";

/**
 * Recovery Modal
 * Helps users recover from crashes or accidental closures (T097)
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
import { FileWarning, RefreshCw } from "lucide-react";

interface RecoveryModalProps {
  isOpen: boolean;
  lastSavedDate?: Date;
  onRecover: () => void;
  onDiscard: () => void;
}

export function RecoveryModal({
  isOpen,
  lastSavedDate,
  onRecover,
  onDiscard,
}: RecoveryModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
              <FileWarning className="h-5 w-5 text-amber-500" />
            </div>
            <AlertDialogTitle>Unsaved Changes Detected</AlertDialogTitle>
          </div>

          <AlertDialogDescription className="space-y-4 pt-4">
            <p>
              We found unsaved changes from your previous editing session. Would
              you like to recover them?
            </p>

            {lastSavedDate && (
              <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
                <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-medium">Last auto-save</div>
                  <div className="text-muted-foreground">
                    {formatDate(lastSavedDate)}
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              This might happen if your browser crashed or you accidentally
              closed the tab. Your work is protected by auto-save every 5
              seconds.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onDiscard}
            className="sm:flex-1"
          >
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onRecover}
            className="sm:flex-1 bg-primary"
          >
            Recover Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
