"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Project, ProjectSettings } from "@/types/project";

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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  revalidatePath("/");
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
    throw new Error(error.message);
  }

  revalidatePath("/");
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
    throw new Error(error.message);
  }

  revalidatePath("/");
}
