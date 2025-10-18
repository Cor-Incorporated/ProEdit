import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

let isConfigured = false;

function ensureConfigured(): void {
  if (!isConfigured) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    isConfigured = true;
  }
}

/**
 * Create a fluent-ffmpeg command with the installed binary pre-configured.
 * @param input Optional input path passed directly to ffmpeg()
 */
export function createFfmpegCommand(input?: string): ffmpeg.FfmpegCommand {
  ensureConfigured();
  return input ? ffmpeg(input) : ffmpeg();
}

/**
 * Ensure FFmpeg is configured and return the fluent-ffmpeg module reference.
 */
export function getFfmpegModule(): typeof ffmpeg {
  ensureConfigured();
  return ffmpeg;
}
