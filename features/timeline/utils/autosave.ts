/**
 * Auto-save Manager
 * Constitutional Requirement: FR-009 "System MUST auto-save every 5 seconds"
 * P0-FIX: Using centralized logger for production-safe logging
 */

import { saveProject } from "@/app/actions/projects";
import { logger } from "@/lib/utils/logger";
import { useMediaStore } from "@/stores/media";
import { useTimelineStore } from "@/stores/timeline";

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
  // Metrics: Track save conflicts for monitoring
  private saveConflictCount = 0;
  private rateLimitHitCount = 0;

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

    logger.info("[AutoSave] Started with 5s interval (FR-009 compliant)");
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      logger.info("[AutoSave] Stopped");
    }
  }

  /**
   * Trigger debounced save
   * Used for immediate changes (e.g., user edits)
   * P0-FIX: Added mutex check to prevent race conditions
   */
  triggerSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // P0-FIX: Check mutex before scheduling save
    if (this.isSaving) {
      logger.debug('[AutoSave] Debounced save skipped - save already in progress');
      return;
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
      this.saveConflictCount++;
      logger.warn(`[AutoSave] Save conflict #${this.saveConflictCount} - Save already in progress, skipping`);
      return;
    }

    // Security: Rate limiting check
    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;
    if (timeSinceLastSave < this.MIN_SAVE_INTERVAL) {
      this.rateLimitHitCount++;
      logger.debug(`[AutoSave] Rate limit hit #${this.rateLimitHitCount}: ${timeSinceLastSave}ms since last save, minimum ${this.MIN_SAVE_INTERVAL}ms required`);
      return;
    }

    if (!this.isOnline) {
      logger.info("[AutoSave] Offline - queueing save operation");
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
      logger.debug("[AutoSave] Save successful");
    } catch (error) {
      logger.error("[AutoSave] Save failed:", error);
      this.onStatusChange?.("error");
    } finally {
      // P0-2 FIX: Always release mutex
      this.isSaving = false;
    }
  }

  /**
   * Perform the actual save operation
   * FIXED: Filter out effects with invalid media_file_id references
   */
  private async performSave(): Promise<void> {
    const timelineState = useTimelineStore.getState();
    const mediaState = useMediaStore.getState();

    // Get valid media file IDs
    const validMediaIds = new Set(mediaState.mediaFiles.map(m => m.id));

    // CRITICAL: Filter out effects that reference deleted media files
    // This prevents foreign key constraint violations
    const validEffects = timelineState.effects.filter(effect => {
      // Text effects don't have media_file_id
      if (effect.kind === 'text') {
        return true;
      }
      
      // Check if media_file_id exists and is valid
      if (!effect.media_file_id) {
        logger.warn(`[AutoSave] Effect ${effect.id} has no media_file_id, skipping`);
        return false;
      }
      
      const isValid = validMediaIds.has(effect.media_file_id);
      if (!isValid) {
        logger.warn(`[AutoSave] Effect ${effect.id} references deleted media ${effect.media_file_id}, removing from store`);
        // Remove from store to prevent future errors
        useTimelineStore.getState().removeEffect(effect.id);
      }
      
      return isValid;
    });

    if (validEffects.length < timelineState.effects.length) {
      logger.info(`[AutoSave] Filtered out ${timelineState.effects.length - validEffects.length} invalid effect(s)`);
    }

    // Gather all data to save
    const projectData = {
      effects: validEffects,
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

    logger.info(
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
      logger.info("[AutoSave] Offline queue processed successfully");
    } catch (error) {
      logger.error("[AutoSave] Failed to process offline queue:", error);
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
      logger.info("[AutoSave] Connection restored");
      this.isOnline = true;
      void this.handleOfflineQueue();
    });

    window.addEventListener("offline", () => {
      logger.info("[AutoSave] Connection lost");
      this.isOnline = false;
      this.onStatusChange?.("offline");
    });
  }

  /**
   * Get save metrics for monitoring/debugging
   */
  getMetrics() {
    return {
      saveConflicts: this.saveConflictCount,
      rateLimitHits: this.rateLimitHitCount,
      offlineQueueSize: this.offlineQueue.length,
      isOnline: this.isOnline,
      isSaving: this.isSaving,
    };
  }

  /**
   * Cleanup when component unmounts
   */
  cleanup(): void {
    this.stopAutoSave();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Log metrics on cleanup for debugging
    const metrics = this.getMetrics();
    if (metrics.saveConflicts > 0 || metrics.rateLimitHits > 0) {
      logger.info("[AutoSave] Session metrics:", metrics);
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
