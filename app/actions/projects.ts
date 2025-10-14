"use server";

import { createClient } from "@/lib/supabase/server";
import { EffectBaseSchema, validateEffectProperties } from "@/lib/validation/effect-schemas";
import { Project, ProjectSettings } from "@/types/project";
import { revalidatePath } from "next/cache";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Get projects error:", error);
    throw new Error(`Failed to get projects: ${error.message}`, { cause: error });
  }

  return data as Project[];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Get project error:", error);
    throw new Error(`Failed to get project ${projectId}: ${error.message}`, { cause: error });
  }

  return data as Project;
}

export async function createProject(name: string): Promise<Project> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error("Project name is required");
  }

  if (name.length > 255) {
    throw new Error("Project name must be less than 255 characters");
  }

  const defaultSettings: ProjectSettings = {
    width: 1920,
    height: 1080,
    fps: 30,
    aspectRatio: "16:9",
    bitrate: 9000,
    standard: "1080p",
  };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: name.trim(),
      settings: defaultSettings,
    })
    .select()
    .single();

  if (error) {
    console.error("Create project error:", error);
    throw new Error(`Failed to create project "${name}": ${error.message}`, { cause: error });
  }

  revalidatePath("/editor");
  return data as Project;
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; settings?: ProjectSettings }
): Promise<Project> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      throw new Error("Project name is required");
    }
    if (updates.name.length > 255) {
      throw new Error("Project name must be less than 255 characters");
    }
    updates.name = updates.name.trim();
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Update project error:", error);
    throw new Error(`Failed to update project ${projectId}: ${error.message}`, { cause: error });
  }

  revalidatePath("/editor");
  revalidatePath(`/editor/${projectId}`);
  return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete project error:", error);
    throw new Error(`Failed to delete project ${projectId}: ${error.message}`, { cause: error });
  }

  revalidatePath("/editor");
}

/**
 * Phase 9: Save project data (auto-save)
 * Constitutional Requirement: FR-009 "System MUST auto-save every 5 seconds"
 */
export async function saveProject(
  projectId: string,
  projectData: {
    effects?: unknown[];
    tracks?: unknown[];
    mediaFiles?: unknown[];
    lastModified: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Update project with new data
    const { error } = await supabase
      .from("projects")
      .update({
        updated_at: projectData.lastModified,
        // Store project state in metadata (or separate tables)
        // For now, we'll use a JSONB column if available
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Save project error:", error);
      return { success: false, error: error.message };
    }

    // Update effects if provided
    // P0-1 FIX: Implement actual effect persistence (FR-009 compliance)
    if (projectData.effects && projectData.effects.length > 0) {
      // Delete existing effects for this project
      const { error: deleteError } = await supabase
        .from("effects")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) {
        console.error("[SaveProject] Failed to delete existing effects:", deleteError);
        return { success: false, error: `Failed to delete effects: ${deleteError.message}` };
      }

      // Insert new effects
      // Validate each effect before insertion
      // P0-FIX: Added ID validation to prevent SQL injection
      // CR-FIX: Added properties validation to prevent malicious data
      const effectsToInsert = projectData.effects.map((effect: unknown) => {
        const effectData = effect as Record<string, unknown>;

        // Validate ID to prevent SQL injection
        const effectId = typeof effectData.id === 'string' ? effectData.id : '';
        if (!effectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectId)) {
          throw new Error(`Invalid effect ID format: ${effectId}`);
        }

        const validated = EffectBaseSchema.parse({
          kind: effectData.kind,
          track: effectData.track,
          start_at_position: effectData.start_at_position,
          duration: effectData.duration,
          start: effectData.start,
          end: effectData.end,
          media_file_id: effectData.media_file_id || null,
        });

        // CR-FIX: Validate properties based on effect kind
        // This prevents malicious data from being stored in the database
        const validatedProperties = validateEffectProperties(
          validated.kind,
          effectData.properties || {}
        );

        return {
          id: effectId, // ID is now validated
          project_id: projectId,
          kind: validated.kind,
          track: validated.track,
          start_at_position: validated.start_at_position,
          duration: validated.duration,
          start: validated.start,  // Fixed: Use 'start' instead of 'start_time'
          end: validated.end,      // Fixed: Use 'end' instead of 'end_time'
          media_file_id: validated.media_file_id || null,
          properties: validatedProperties as Record<string, unknown>,
        };
      });

      const { error: insertError } = await supabase
        .from("effects")
        .insert(effectsToInsert);

      if (insertError) {
        console.error("[SaveProject] Failed to insert effects:", insertError);
        return { success: false, error: `Failed to save effects: ${insertError.message}` };
      }

      console.log(`[SaveProject] Successfully saved ${projectData.effects.length} effects`);
    }

    revalidatePath(`/editor/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Save project exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
