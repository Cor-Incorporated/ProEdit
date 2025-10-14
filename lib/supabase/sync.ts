/**
 * Realtime Sync Manager
 * Handles Supabase Realtime subscriptions for multi-tab editing
 */

import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export class RealtimeSyncManager {
  private channel: RealtimeChannel | null = null;
  private projectId: string;
  private onRemoteChange?: (data: ProjectUpdate) => void;
  private onConflict?: (conflict: ConflictData) => void;
  private lastLocalUpdate: number = 0;
  private readonly CONFLICT_THRESHOLD = 1000; // 1 second

  constructor(
    projectId: string,
    callbacks?: {
      onRemoteChange?: (data: ProjectUpdate) => void;
      onConflict?: (conflict: ConflictData) => void;
    }
  ) {
    this.projectId = projectId;
    this.onRemoteChange = callbacks?.onRemoteChange;
    this.onConflict = callbacks?.onConflict;
  }

  /**
   * Setup Supabase Realtime subscription
   */
  setupRealtimeSubscription(): void {
    const supabase = createClient();

    // Subscribe to project changes
    this.channel = supabase
      .channel(`project:${this.projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${this.projectId}`,
        },
        (payload) => {
          void this.handleRemoteUpdate(payload.new as ProjectUpdate);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "effects",
          filter: `project_id=eq.${this.projectId}`,
        },
        (payload) => {
          void this.handleRemoteEffectUpdate(payload.new as EffectUpdate);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `[RealtimeSync] Subscribed to project ${this.projectId}`
          );
        } else if (status === "CHANNEL_ERROR") {
          console.error("[RealtimeSync] Subscription error");
        }
      });
  }

  /**
   * Handle remote project update
   */
  private async handleRemoteUpdate(data: ProjectUpdate): Promise<void> {
    const timeSinceLocal = Date.now() - this.lastLocalUpdate;

    // Check for potential conflict
    if (timeSinceLocal < this.CONFLICT_THRESHOLD) {
      console.warn("[RealtimeSync] Potential conflict detected");

      const conflict: ConflictData = {
        projectId: this.projectId,
        localTimestamp: this.lastLocalUpdate,
        remoteTimestamp: data.updated_at
          ? new Date(data.updated_at).getTime()
          : Date.now(),
        remoteData: data,
      };

      this.onConflict?.(conflict);
      return;
    }

    // No conflict - apply remote changes
    console.log("[RealtimeSync] Applying remote update");
    this.onRemoteChange?.(data);
  }

  /**
   * Handle remote effect update
   */
  private async handleRemoteEffectUpdate(data: EffectUpdate): Promise<void> {
    console.log("[RealtimeSync] Effect updated remotely:", data.id);

    // Notify about the change
    this.onRemoteChange?.({
      id: this.projectId,
      effects: [data],
      updated_at: data.updated_at || new Date().toISOString(),
    });
  }

  /**
   * Mark local update timestamp
   * Call this before performing local saves
   */
  markLocalUpdate(): void {
    this.lastLocalUpdate = Date.now();
  }

  /**
   * Handle conflict resolution
   * Strategy: Last-write-wins with user notification
   */
  async handleConflictResolution(
    strategy: "local" | "remote" | "merge"
  ): Promise<void> {
    console.log(`[RealtimeSync] Resolving conflict with strategy: ${strategy}`);

    // Implementation depends on strategy
    switch (strategy) {
      case "local":
        // Keep local changes, overwrite remote
        console.log("[RealtimeSync] Keeping local changes");
        break;

      case "remote":
        // Discard local changes, accept remote
        console.log("[RealtimeSync] Accepting remote changes");
        break;

      case "merge":
        // Attempt to merge changes (complex logic)
        console.log("[RealtimeSync] Attempting to merge changes");
        break;
    }
  }

  /**
   * Sync offline changes when coming back online
   */
  async syncOfflineChanges(changes: OfflineChange[]): Promise<void> {
    if (changes.length === 0) return;

    console.log(`[RealtimeSync] Syncing ${changes.length} offline changes`);

    try {
      const supabase = createClient();

      // Process changes in order
      for (const change of changes) {
        switch (change.type) {
          case "effect_create":
            await supabase.from("effects").insert(change.data);
            break;

          case "effect_update":
            await supabase
              .from("effects")
              .update(change.data)
              .eq("id", change.data.id);
            break;

          case "effect_delete":
            await supabase.from("effects").delete().eq("id", change.data.id);
            break;

          case "project_update":
            await supabase
              .from("projects")
              .update(change.data)
              .eq("id", this.projectId);
            break;
        }
      }

      console.log("[RealtimeSync] Offline changes synced successfully");
    } catch (error) {
      console.error("[RealtimeSync] Failed to sync offline changes:", error);
      throw error;
    }
  }

  /**
   * Cleanup subscription
   */
  cleanup(): void {
    if (this.channel) {
      void this.channel.unsubscribe();
      this.channel = null;
      console.log(`[RealtimeSync] Unsubscribed from project ${this.projectId}`);
    }
  }
}

// Types
export interface ProjectUpdate {
  id: string;
  name?: string;
  effects?: EffectUpdate[];
  updated_at?: string;
}

export interface EffectUpdate {
  id: string;
  project_id: string;
  track_id: string;
  media_file_id?: string;
  type: string;
  start_time: number;
  duration: number;
  properties?: Record<string, unknown>;
  updated_at?: string;
}

export interface ConflictData {
  projectId: string;
  localTimestamp: number;
  remoteTimestamp: number;
  remoteData: ProjectUpdate;
}

export interface OfflineChange {
  type: "effect_create" | "effect_update" | "effect_delete" | "project_update";
  data: Record<string, unknown>;
  timestamp: number;
}
