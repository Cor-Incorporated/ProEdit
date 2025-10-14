import { createClient } from "./client";

/**
 * Supabase Storage utility functions
 * Handles media file operations with the media-files bucket
 */

/**
 * Upload a media file to Supabase Storage
 * Files are organized by user_id/project_id/filename
 * @param file The file to upload
 * @param userId User ID for folder organization
 * @param projectId Project ID for folder organization
 * @returns Promise<string> The storage path of the uploaded file
 */
export async function uploadMediaFile(
  file: File,
  userId: string,
  projectId: string
): Promise<string> {
  const supabase = createClient();

  // Generate unique filename to avoid collisions
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}-${sanitizedName}`;
  const filePath = `${userId}/${projectId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("media-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
}

/**
 * Get a signed URL for a media file
 * Signed URLs are valid for 1 hour by default
 * @param path The storage path of the file
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise<string> The signed URL
 */
export async function getMediaFileUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from("media-files")
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Get URL error:", error);
    throw new Error(`Failed to get file URL: ${error.message}`);
  }

  if (!data.signedUrl) {
    throw new Error("Failed to generate signed URL");
  }

  return data.signedUrl;
}

/**
 * Get a public URL for a media file
 * Note: This only works if the bucket is public
 * For private buckets, use getMediaFileUrl instead
 * @param path The storage path of the file
 * @returns string The public URL
 */
export function getPublicMediaFileUrl(path: string): string {
  const supabase = createClient();

  const { data } = supabase.storage.from("media-files").getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete a media file from Supabase Storage
 * @param path The storage path of the file
 * @returns Promise<void>
 */
export async function deleteMediaFile(path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from("media-files").remove([path]);

  if (error) {
    console.error("Delete error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple media files from Supabase Storage
 * @param paths Array of storage paths to delete
 * @returns Promise<void>
 */
export async function deleteMediaFiles(paths: string[]): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from("media-files").remove(paths);

  if (error) {
    console.error("Batch delete error:", error);
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * List all media files for a user/project
 * @param userId User ID
 * @param projectId Optional project ID to filter
 * @returns Promise<Array> List of files
 */
export async function listMediaFiles(
  userId: string,
  projectId?: string
): Promise<
  Array<{
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, unknown>;
  }>
> {
  const supabase = createClient();

  const path = projectId ? `${userId}/${projectId}` : userId;

  const { data, error } = await supabase.storage.from("media-files").list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    console.error("List error:", error);
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data || [];
}

/**
 * Get file metadata from storage
 * @param path The storage path of the file
 * @returns Promise<object> File metadata
 */
export async function getMediaFileMetadata(path: string): Promise<{
  size: number;
  mimetype: string;
}> {
  const supabase = createClient();

  // Get file info using download
  const { data, error } = await supabase.storage.from("media-files").download(path);

  if (error) {
    console.error("Metadata error:", error);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }

  return {
    size: data.size,
    mimetype: data.type,
  };
}

/**
 * Copy a media file within storage
 * @param fromPath Source path
 * @param toPath Destination path
 * @returns Promise<string> The new file path
 */
export async function copyMediaFile(fromPath: string, toPath: string): Promise<string> {
  const supabase = createClient();

  const { error } = await supabase.storage.from("media-files").copy(fromPath, toPath);

  if (error) {
    console.error("Copy error:", error);
    throw new Error(`Failed to copy file: ${error.message}`);
  }

  return toPath;
}

/**
 * Move a media file within storage
 * @param fromPath Source path
 * @param toPath Destination path
 * @returns Promise<string> The new file path
 */
export async function moveMediaFile(fromPath: string, toPath: string): Promise<string> {
  const supabase = createClient();

  const { error } = await supabase.storage.from("media-files").move(fromPath, toPath);

  if (error) {
    console.error("Move error:", error);
    throw new Error(`Failed to move file: ${error.message}`);
  }

  return toPath;
}

