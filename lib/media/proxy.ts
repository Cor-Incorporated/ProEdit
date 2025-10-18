import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { MediaFile } from "@/types/media";
import { createFfmpegCommand } from "@/lib/ffmpeg/node";

const PROXY_TARGET_WIDTH = Number(process.env.PROXY_TARGET_WIDTH) || 1280;
const PROXY_TARGET_HEIGHT = Number(process.env.PROXY_TARGET_HEIGHT) || 720;
const PROXY_MAX_ATTEMPTS = Number(process.env.PROXY_MAX_ATTEMPTS) || 3;

async function writeBlobToFile(blob: Blob, filePath: string): Promise<void> {
  const arrayBuffer = await blob.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function downloadOriginalMedia(
  storagePath: string
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  const supabase = await createClient();

  const tmpDir = await fs.mkdtemp(path.join(tmpdir(), "proedit-proxy-"));
  const sourcePath = path.join(tmpDir, path.basename(storagePath));

  const { data, error } = await supabase.storage.from("media-files").download(storagePath);
  if (error || !data) {
    throw new Error(`Failed to download original media: ${error?.message ?? "No data returned"}`);
  }

  await writeBlobToFile(data, sourcePath);

  return {
    filePath: sourcePath,
    cleanup: async () => {
      await fs.rm(tmpDir, { recursive: true, force: true });
    },
  };
}

async function transcodeProxy(
  sourcePath: string,
  destinationPath: string,
  width: number,
  height: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    createFfmpegCommand(sourcePath)
      .outputOptions([
        "-vf",
        `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
      ])
      .output(destinationPath)
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
      .run();
  });
}

async function uploadProxy(
  userId: string,
  mediaFileId: string,
  proxyTempPath: string
): Promise<string> {
  const supabase = await createClient();
  const proxyStoragePath = `${userId}/${mediaFileId}.mp4`;
  const fileBuffer = await fs.readFile(proxyTempPath);

  const { error } = await supabase.storage
    .from("media-proxies")
    .upload(proxyStoragePath, fileBuffer, {
      upsert: true,
      contentType: "video/mp4",
    });

  if (error) {
    throw new Error(`Failed to upload proxy: ${error.message}`);
  }

  return proxyStoragePath;
}

async function markProxyStatus(
  mediaFileId: string,
  userId: string,
  updates: Partial<Pick<MediaFile, "proxy_path" | "proxy_status" | "proxy_generated_at" | "proxy_last_error">>
): Promise<PostgrestSingleResponse<MediaFile>> {
  const supabase = await createClient();

  return supabase
    .from("media_files")
    .update({
      proxy_path: updates.proxy_path ?? null,
      proxy_status: updates.proxy_status ?? "pending",
      proxy_generated_at: updates.proxy_generated_at ?? null,
      proxy_last_error: updates.proxy_last_error ?? null,
    })
    .eq("id", mediaFileId)
    .eq("user_id", userId)
    .select()
    .single();
}

/**
 * Generate a low-resolution proxy for the provided media file.
 * Stores the proxy in the media-proxies storage bucket and updates media_files metadata.
 */
interface GenerateProxyOptions {
  force?: boolean;
}

export async function generateProxyForMedia(
  mediaFileId: string,
  options: GenerateProxyOptions = {}
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: media, error } = await supabase
    .from("media_files")
    .select("id, user_id, mime_type, storage_path, proxy_status, proxy_path")
    .eq("id", mediaFileId)
    .eq("user_id", user.id)
    .single();

  if (error || !media) {
    throw new Error(`Media file not found: ${error?.message ?? "unknown error"}`);
  }

  // Skip proxy generation for non-video assets
  if (!media.mime_type.startsWith("video/")) {
    await markProxyStatus(media.id, user.id, {
      proxy_status: "ready",
      proxy_path: null,
      proxy_generated_at: new Date().toISOString(),
      proxy_last_error: null,
    });
    return;
  }

  const needsProxy =
    options.force ||
    !media.proxy_path ||
    media.proxy_status === "pending" ||
    media.proxy_status === "failed";

  if (!needsProxy || media.proxy_status === "processing") {
    return;
  }

  const lockQuery = supabase
    .from("media_files")
    .update({
      proxy_status: "processing",
      proxy_last_error: null,
    })
    .eq("id", media.id)
    .eq("user_id", user.id)
    .neq("proxy_status", "processing");

  if (!options.force) {
    lockQuery.or("proxy_status.eq.pending,proxy_status.eq.failed,proxy_path.is.null");
  }

  const { data: lockedRow, error: lockError } = await lockQuery.select("id").maybeSingle();

  if (lockError) {
    throw new Error(`Failed to acquire proxy generation lock: ${lockError.message}`);
  }

  if (!lockedRow) {
    // Another worker acquired the lock or proxy is already up-to-date
    return;
  }

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < PROXY_MAX_ATTEMPTS) {
    attempt += 1;
    const { filePath: sourcePath, cleanup } = await downloadOriginalMedia(media.storage_path);
    const proxyTempPath = `${sourcePath}-proxy-${attempt}.mp4`;

    try {
      await transcodeProxy(sourcePath, proxyTempPath, PROXY_TARGET_WIDTH, PROXY_TARGET_HEIGHT);
      const proxyStoragePath = await uploadProxy(user.id, media.id, proxyTempPath);

      await markProxyStatus(media.id, user.id, {
        proxy_status: "ready",
        proxy_path: proxyStoragePath,
        proxy_generated_at: new Date().toISOString(),
        proxy_last_error: null,
      });
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= PROXY_MAX_ATTEMPTS) {
        await markProxyStatus(media.id, user.id, {
          proxy_status: "failed",
          proxy_path: null,
          proxy_generated_at: null,
          proxy_last_error: error instanceof Error ? error.message : String(error),
        });
        throw error instanceof Error ? error : new Error(String(error));
      }
      await markProxyStatus(media.id, user.id, {
        proxy_status: "pending",
        proxy_path: null,
        proxy_generated_at: null,
        proxy_last_error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await cleanup();
      try {
        await fs.rm(proxyTempPath, { force: true });
      } catch {
        // Ignore cleanup failure
      }
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
