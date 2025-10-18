import { createReadStream, promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFfmpegCommand } from "@/lib/ffmpeg/node";
import { EXPORT_PRESETS, ExportQuality } from "@/features/export/types";
import { createServiceClient } from "@/lib/supabase/admin";

const QUALITY_CRF: Record<ExportQuality, number> = {
  "720p": 25,
  "1080p": 23,
  "4k": 21,
};

const EXPORT_SIGNED_URL_TTL = Number(process.env.EXPORT_SIGNED_URL_TTL ?? 60 * 60 * 24);
const EXPORT_AUDIO_BITRATE = Number(process.env.EXPORT_AUDIO_BITRATE ?? 192_000);
const MAX_FILENAME_LENGTH = Number(process.env.EXPORT_MAX_FILENAME_LENGTH ?? 80);

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
  supabase: SupabaseClient,
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
  const ext = path.extname(media.filename) || ".mp4";
  const localPath = path.join(mediaDir, `${media.id}${ext}`);

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
        `${EXPORT_AUDIO_BITRATE}`,
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

  try {
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
  } finally {
    await fs.rm(concatFile, { force: true }).catch(() => undefined);
  }
}

async function updateJobProgress(
  jobId: string,
  updates: Partial<{
    status: string;
    progress: number;
    output_url: string | null;
    completed_at: string | null;
    error_message: string | null;
  }>,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const client = supabaseClient ?? createServiceClient();
  const { error } = await client
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

function sanitizeFilename(projectName: string, jobId: string, quality: ExportQuality): string {
  const slug = projectName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const truncated = slug.slice(0, MAX_FILENAME_LENGTH);
  return `${truncated || "export"}-${jobId.slice(0, 8)}-${quality}.mp4`;
}

export interface ExportJobResult {
  status: string;
  progress: number;
  downloadUrl?: string;
  filename?: string;
  error_message?: string | null;
}

export async function getExportJob(jobId: string, userId: string): Promise<ExportJobResult | null> {
  const supabase = createServiceClient();
  const { data: job, error } = await supabase
    .from("export_jobs")
    .select("status, progress, output_url, settings, error_message")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[ExportJob] Failed to fetch job:", error);
    throw new Error(error.message);
  }

  if (!job) {
    return null;
  }

  if (job.status === "completed" && job.output_url) {
    const { data, error: urlError } = await supabase.storage
      .from("exports")
      .createSignedUrl(job.output_url, EXPORT_SIGNED_URL_TTL);

    if (urlError || !data?.signedUrl) {
      throw new Error(urlError?.message ?? "Failed to create signed URL for export");
    }

    const settings = job.settings as { quality?: ExportQuality; projectName?: string } | null;
    const quality = settings?.quality ?? "1080p";
    const projectName = settings?.projectName ?? "export";

    return {
      status: job.status,
      progress: job.progress,
      downloadUrl: data.signedUrl,
      filename: sanitizeFilename(projectName, jobId, quality),
      error_message: job.error_message,
    };
  }

  return {
    status: job.status,
    progress: job.progress,
    error_message: job.error_message,
  };
}

export async function processExportJob(jobId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: lockedJob, error: lockError } = await supabase
    .from("export_jobs")
    .update({ status: "processing", progress: 5, error_message: null })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id, project_id, user_id, settings")
    .maybeSingle();

  if (lockError) {
    console.error("[ExportJob] Failed to acquire job lock:", lockError);
    return;
  }

  if (!lockedJob) {
    // Already processed or cancelled
    return;
  }

  const quality = (lockedJob.settings as { quality?: ExportQuality } | null)?.quality ?? "1080p";
  const preset = EXPORT_PRESETS[quality];
  const tmpBaseDir = await fs.mkdtemp(path.join(tmpdir(), `proedit-export-${jobId}-`));
  const mediaCache = new Map<string, string>();

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("name")
      .eq("id", lockedJob.project_id)
      .eq("user_id", lockedJob.user_id)
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
          "end",
          "media_file_id",
          "media_files!inner(id, storage_path, filename, mime_type)",
        ].join(",")
      )
      .eq("project_id", lockedJob.project_id)
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
    const videoEffects = rawEffects.filter((effect) => effect.media_file_id && effect.media_files);

    if (videoEffects.length === 0) {
      throw new Error("エクスポート可能なビデオクリップが見つかりませんでした。");
    }

    const clipDir = path.join(tmpBaseDir, "clips");
    await fs.mkdir(clipDir, { recursive: true });

    const clipPaths: string[] = [];

    for (let index = 0; index < videoEffects.length; index++) {
      const effect = videoEffects[index];
      const clipDurationMs = effect.duration ?? effect.end - effect.start;
      if (!clipDurationMs || clipDurationMs <= 0) {
        continue;
      }

      const sourcePath = await downloadSourceMedia(supabase, effect.media_files, mediaCache, tmpBaseDir);
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

      const progressBase = 10;
      const progressRange = 70;
      const currentProgress =
        progressBase + Math.round(((index + 1) / videoEffects.length) * progressRange);
      await updateJobProgress(jobId, { progress: currentProgress, status: "processing" }, supabase);
    }

    if (clipPaths.length === 0) {
      throw new Error("書き出しに使用できるクリップがありません。");
    }

    const outputFileName = sanitizeFilename(project.name, jobId, quality);
    const outputPath = path.join(tmpBaseDir, outputFileName);

    await concatClips(clipPaths, outputPath);
    await updateJobProgress(jobId, { progress: 90, status: "processing" }, supabase);

    const storagePath = `${lockedJob.user_id}/${lockedJob.project_id}/${jobId}.mp4`;
    const readStream = createReadStream(outputPath);

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(storagePath, readStream, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const durationMs = videoEffects.reduce((acc, effect) => {
      const clipDuration = effect.duration ?? effect.end - effect.start;
      return acc + (clipDuration > 0 ? clipDuration : 0);
    }, 0);

    await updateJobProgress(jobId, {
      status: "completed",
      progress: 100,
      output_url: storagePath,
      completed_at: new Date().toISOString(),
      error_message: null,
    }, supabase);

    // Persist derived data for analytics (best-effort)
    await supabase
      .from("export_jobs")
      .update({
        settings: {
          ...(lockedJob.settings as Record<string, unknown> | null),
          quality,
          durationMs,
          projectName: project.name,
        },
      })
      .eq("id", jobId);
  } catch (error) {
    await updateJobProgress(jobId, {
      status: "failed",
      progress: 0,
      output_url: null,
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : String(error),
    }, supabase);

    console.error("[ExportJob] Processing failed:", error);
  } finally {
    await fs.rm(tmpBaseDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
