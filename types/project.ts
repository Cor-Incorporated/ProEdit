/**
 * Project type definitions
 */

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  aspectRatio: string;
  bitrate: number;
  standard: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  project_id: string;
  track_index: number;
  visible: boolean;
  locked: boolean;
  muted: boolean;
  created_at: string;
}

// Export job types
export type ExportStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface ExportSettings {
  format: "mp4" | "webm" | "mov";
  quality: "low" | "medium" | "high" | "ultra";
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
}

export interface ExportJob {
  id: string;
  project_id: string;
  status: ExportStatus;
  settings: ExportSettings;
  output_url?: string;
  progress: number;
  created_at: string;
  completed_at?: string;
}

// Create/Update payloads
export interface CreateProjectPayload {
  name: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectPayload {
  name?: string;
  settings?: Partial<ProjectSettings>;
}

export interface CreateExportJobPayload {
  project_id: string;
  settings: ExportSettings;
}
