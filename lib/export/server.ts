import { promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFfmpegCommand } from "@/lib/ffmpeg/node";
import { EXPORT_PRESETS, ExportQuality } from "@/features/export/types";

const QUALITY_CRF: Record<ExportQuality, number> = {
  "720p": 25,
  "1080p": 23,
  "4k": 21,
};

type DatabaseClient = SupabaseClient<any, "public", any>;

interface ExportContext {
  supabase: DatabaseClient;
  jobId: string;
  projectId: string;
  userId: string;
  quality: ExportQuality;
}

interface MediaReference {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
}

interface VideoEffectRow {
  id: string;
  track: number;
  start_at_position: number;
  duration: number;
  start: number;
  end: number;
  media_file_id: string;
  media_files: MediaReference;
}

async function writeBlobToFile(blob: Blob, filePath: string): Promise<void> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  await fs.writeFile(filePath, buffer);
}

async function downloadSourceMedia(
  supabase: DatabaseClient,
  media: MediaReference,
  cache: Map<string, string>,
  baseDir: string
): Promise<string> {
  if (cache.has(media.id)) {
    return cache.get(media.id)!;
  }

  const { data, error } = await supabase.storage.from("media-files").download(media.storage_path);
  if (error || !data) {
    throw new Error(
      `Failed to download source media (${media.filename}): ${error?.message ?? "unknown error"}`
    );
  }

  const mediaDir = path.join(baseDir, "sources");
  await fs.mkdir(mediaDir, { recursive: true });
  const localPath = path.join(mediaDir, `${media.id}${path.extname(media.filename) || ".mp4"}`);

  await writeBlobToFile(data, localPath);
  cache.set(media.id, localPath);

  return localPath;
}

async function transcodeClip(
  sourcePath: string,
  targetPath: string,
  startSeconds: number,
  durationSeconds: number,
  width: number,
  height: number,
  crf: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    createFfmpegCommand(sourcePath)
      .setStartTime(startSeconds)
      .duration(durationSeconds)
      .outputOptions([
        "-vf",
        `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        String(crf),
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
      ])
      .output(targetPath)
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
      .run();
  });
}

async function concatClips(clipPaths: string[], outputPath: string): Promise<void> {
  const concatFile = `${outputPath}.txt`;
  const fileEntries = clipPaths.map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(concatFile, fileEntries, "utf-8");

  await new Promise<void>((resolve, reject) => {
    createFfmpegCommand()
      .input(concatFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
      .run();
  });

  await fs.rm(concatFile, { force: true });
}

async function updateJobProgress(
  supabase: DatabaseClient,
  jobId: string,
  updates: Partial<{
    status: string;
    progress: number;
    output_url: string | null;
    completed_at: string | null;
    error_message: string | null;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("export_jobs")
    .update({
      status: updates.status,
      progress: updates.progress,
      output_url: updates.output_url ?? undefined,
      completed_at: updates.completed_at ?? undefined,
      error_message: updates.error_message ?? undefined,
    })
    .eq("id", jobId);

  if (error) {
    console.error("[ExportJob] Failed to update job progress:", error);
  }
}

interface ExportResultPayload {
  downloadUrl: string;
  storagePath: string;
  filename: string;
  durationMs: number;
}

/**
 * Process an export job by fetching the project timeline, transcoding clips, concatenating them,
 * and uploading the final video to the exports storage bucket.
 * NOTE: Current implementation supports a single video track without transitions or overlays.
 */
export async function processExportJob({
  supabase,
  jobId,
  projectId,
  userId,
  quality,
}: ExportContext): Promise<ExportResultPayload> {
  const tmpBaseDir = await fs.mkdtemp(path.join(tmpdir(), `proedit-export-${jobId}-`));
  const mediaCache = new Map<string, string>();

  try {
    await updateJobProgress(supabase, jobId, { status: "processing", progress: 5 });

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectError || !project) {
      throw new Error(projectError?.message ?? "Project not found or unauthorized");
    }

    const { data: effects, error: effectsError } = await supabase
      .from("effects")
      .select(
        [
          "id",
          "kind",
          "track",
          "start_at_position",
          "duration",
          "start",
          '"end"',
          "media_file_id",
          "media_files!inner(id, storage_path, filename, mime_type)",
        ].join(",")
      )
      .eq("project_id", projectId)
      .eq("kind", "video")
      .order("track", { ascending: true })
      .order("start_at_position", { ascending: true });

    if (effectsError) {
      throw new Error(effectsError.message);
    }

    if (!effects || effects.length === 0) {
      throw new Error("Videoトラックにコンテンツがありません。");
    }

    const rawEffects = Array.isArray(effects)
      ? (effects as unknown as VideoEffectRow[])
      : [];
    const videoEffects = rawEffects.filter(
      (effect) => effect.media_file_id && effect.media_files
    );

    if (videoEffects.length === 0) {
      throw new Error("エクスポート可能なビデオクリップが見つかりませんでした。");
    }

    const preset = EXPORT_PRESETS[quality];
    const clipDir = path.join(tmpBaseDir, "clips");
    await fs.mkdir(clipDir, { recursive: true });

    const clipPaths: string[] = [];

    for (let index = 0; index < videoEffects.length; index++) {
      const effect = videoEffects[index];
      const clipDurationMs = effect.duration ?? effect.end - effect.start;
      if (!clipDurationMs || clipDurationMs <= 0) {
        continue;
      }

      const sourcePath = await downloadSourceMedia(
        supabase,
        effect.media_files,
        mediaCache,
        tmpBaseDir
      );
      const targetClipPath = path.join(clipDir, `${effect.id}.mp4`);

      await transcodeClip(
        sourcePath,
        targetClipPath,
        (effect.start ?? 0) / 1000,
        clipDurationMs / 1000,
        preset.width,
        preset.height,
        QUALITY_CRF[quality]
      );

      clipPaths.push(targetClipPath);

      const progressBase = 5;
      const progressRange = 70;
      const currentProgress =
        progressBase + Math.round(((index + 1) / videoEffects.length) * progressRange);
      await updateJobProgress(supabase, jobId, { progress: currentProgress });
    }

    if (clipPaths.length === 0) {
      throw new Error("書き出しに使用できるクリップがありません。");
    }

    const outputFileName = `${project.name.replace(/[^a-z0-9-_]/gi, "_") || "export"}_${quality}.mp4`;
    const outputPath = path.join(tmpBaseDir, outputFileName);

    await concatClips(clipPaths, outputPath);
    await updateJobProgress(supabase, jobId, { progress: 90 });

    const outputBuffer = await fs.readFile(outputPath);
    const storagePath = `${userId}/${projectId}/${jobId}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(storagePath, outputBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("exports")
      .createSignedUrl(storagePath, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(signedUrlError?.message ?? "Failed to create signed URL for export");
    }

    await updateJobProgress(supabase, jobId, {
      status: "completed",
      progress: 100,
      output_url: storagePath,
      completed_at: new Date().toISOString(),
      error_message: null,
    });

    const durationMs = videoEffects.reduce((acc, effect) => {
      const clipDuration = effect.duration ?? effect.end - effect.start;
      return acc + (clipDuration > 0 ? clipDuration : 0);
    }, 0);

    return {
      downloadUrl: signedUrlData.signedUrl,
      storagePath,
      filename: outputFileName,
      durationMs,
    };
  } catch (error) {
    await updateJobProgress(supabase, jobId, {
      status: "failed",
      progress: 0,
      output_url: null,
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await fs.rm(tmpBaseDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
