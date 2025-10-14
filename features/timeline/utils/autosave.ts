/**
 * Auto-save Manager
 * Constitutional Requirement: FR-009 "System MUST auto-save every 5 seconds"
 */

import { saveProject } from "@/app/actions/projects";
import { useTimelineStore } from "@/stores/timeline";
import { useMediaStore } from "@/stores/media";

export class AutoSaveManager {
  private debounceTimer: NodeJS.Timeout | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTOSAVE_INTERVAL = 5000; // 5 seconds - FR-009
  private readonly DEBOUNCE_TIME = 1000; // 1 second debounce
  private offlineQueue: Array<() => Promise<void>> = [];
  private isOnline = true;
  private projectId: string;
  private onStatusChange?: (status: SaveStatus) => void;
  // P0-2 FIX: Add mutex to prevent race conditions
  private isSaving = false;
  // Security: Rate limiting to prevent database spam
  private lastSaveTime = 0;
  private readonly MIN_SAVE_INTERVAL = 1000; // Minimum 1 second between saves

  constructor(
    projectId: string,
    onStatusChange?: (status: SaveStatus) => void
  ) {
    this.projectId = projectId;
    this.onStatusChange = onStatusChange;
    this.setupOnlineDetection();
  }

  /**
   * Start auto-save interval
   * Saves every 5 seconds as per FR-009
   */
  startAutoSave(): void {
    if (this.autoSaveInterval) return;

    this.autoSaveInterval = setInterval(() => {
      void this.saveNow();
    }, this.AUTOSAVE_INTERVAL);

    console.log("[AutoSave] Started with 5s interval (FR-009 compliant)");
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log("[AutoSave] Stopped");
    }
  }

  /**
   * Trigger debounced save
   * Used for immediate changes (e.g., user edits)
   */
  triggerSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.saveNow();
    }, this.DEBOUNCE_TIME);
  }

  /**
   * Save immediately
   * Handles both online and offline scenarios
   * P0-2 FIX: Prevent concurrent saves with mutex
   * Security: Rate limiting to prevent database spam
   */
  async saveNow(): Promise<void> {
    // P0-2 FIX: Check if already saving
    if (this.isSaving) {
      console.log("[AutoSave] Save already in progress, skipping");
      return;
    }

    // Security: Rate limiting check
    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;
    if (timeSinceLastSave < this.MIN_SAVE_INTERVAL) {
      console.log(`[AutoSave] Rate limit: ${timeSinceLastSave}ms since last save, minimum ${this.MIN_SAVE_INTERVAL}ms required`);
      return;
    }

    if (!this.isOnline) {
      console.log("[AutoSave] Offline - queueing save operation");
      this.offlineQueue.push(() => this.performSave());
      this.onStatusChange?.("offline");
      return;
    }

    // P0-2 FIX: Set mutex before starting
    this.isSaving = true;
    this.lastSaveTime = now; // Update last save time

    try {
      this.onStatusChange?.("saving");
      await this.performSave();
      this.onStatusChange?.("saved");
      console.log("[AutoSave] Save successful");
    } catch (error) {
      console.error("[AutoSave] Save failed:", error);
      this.onStatusChange?.("error");
    } finally {
      // P0-2 FIX: Always release mutex
      this.isSaving = false;
    }
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(): Promise<void> {
    const timelineState = useTimelineStore.getState();
    const mediaState = useMediaStore.getState();

    // Gather all data to save
    const projectData = {
      effects: timelineState.effects,
      mediaFiles: mediaState.mediaFiles,
      lastModified: new Date().toISOString(),
    };

    // Save to Supabase via Server Action
    const result = await saveProject(this.projectId, projectData);

    if (!result.success) {
      throw new Error(result.error || "Failed to save project");
    }
  }

  /**
   * Handle offline queue when coming back online
   */
  private async handleOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(
      `[AutoSave] Processing ${this.offlineQueue.length} offline saves`
    );

    this.onStatusChange?.("saving");

    try {
      // Execute all queued saves
      for (const saveFn of this.offlineQueue) {
        await saveFn();
      }

      this.offlineQueue = [];
      this.onStatusChange?.("saved");
      console.log("[AutoSave] Offline queue processed successfully");
    } catch (error) {
      console.error("[AutoSave] Failed to process offline queue:", error);
      this.onStatusChange?.("error");
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    if (typeof window === "undefined") return;

    this.isOnline = window.navigator.onLine;

    window.addEventListener("online", () => {
      console.log("[AutoSave] Connection restored");
      this.isOnline = true;
      void this.handleOfflineQueue();
    });

    window.addEventListener("offline", () => {
      console.log("[AutoSave] Connection lost");
      this.isOnline = false;
      this.onStatusChange?.("offline");
    });
  }

  /**
   * Cleanup when component unmounts
   */
  cleanup(): void {
    this.stopAutoSave();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Save any pending changes before cleanup
    if (this.isOnline && this.offlineQueue.length === 0) {
      void this.saveNow();
    }
  }
}

export type SaveStatus = "saved" | "saving" | "error" | "offline";

/**
 * React hook for auto-save
 */
export function useAutoSave(
  projectId: string,
  onStatusChange?: (status: SaveStatus) => void
) {
  const manager = new AutoSaveManager(projectId, onStatusChange);

  return {
    startAutoSave: () => manager.startAutoSave(),
    stopAutoSave: () => manager.stopAutoSave(),
    triggerSave: () => manager.triggerSave(),
    saveNow: () => manager.saveNow(),
    cleanup: () => manager.cleanup(),
  };
}
