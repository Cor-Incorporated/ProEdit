import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/**
 * FFmpeg.wasm loader and initialization
 * Handles loading FFmpeg with proper CORS headers
 */

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Loads and initializes FFmpeg.wasm
 * Uses singleton pattern to avoid multiple loads
 * @returns Promise<FFmpeg> The initialized FFmpeg instance
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  // Return existing instance if already loaded
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  // Wait if currently loading
  if (isLoading) {
    return new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (ffmpegInstance) {
          clearInterval(checkLoaded);
          resolve(ffmpegInstance);
        }
        if (loadError) {
          clearInterval(checkLoaded);
          reject(loadError);
        }
      }, 100);
    });
  }

  isLoading = true;
  loadError = null;

  try {
    const ffmpeg = new FFmpeg();

    // Set up logging for debugging
    ffmpeg.on("log", ({ message }) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[FFmpeg]", message);
      }
    });

    // Set up progress tracking
    ffmpeg.on("progress", ({ progress, time }) => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[FFmpeg Progress] ${(progress * 100).toFixed(2)}% (${time}ms)`
        );
      }
    });

    // Load FFmpeg core from CDN
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpegInstance = ffmpeg;
    isLoading = false;

    return ffmpeg;
  } catch (error) {
    isLoading = false;
    loadError = error as Error;
    throw new Error(
      `Failed to load FFmpeg: ${(error as Error).message}`
    );
  }
}

/**
 * Gets the current FFmpeg instance
 * @returns FFmpeg | null The FFmpeg instance if loaded
 */
export function getFFmpeg(): FFmpeg | null {
  return ffmpegInstance;
}

/**
 * Checks if FFmpeg is loaded and ready
 * @returns boolean True if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
  return ffmpegInstance !== null && ffmpegInstance.loaded;
}

/**
 * Terminates FFmpeg instance and cleans up resources
 */
export async function terminateFFmpeg(): Promise<void> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    await ffmpegInstance.terminate();
    ffmpegInstance = null;
  }
}
