import { Application, Assets } from "pixi.js";

/**
 * PIXI.js v7 initialization helper
 * Sets up the PIXI Application with optimal settings for video editing
 */

export interface PIXISetupOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: number;
  resolution?: number;
  antialias?: boolean;
}

/**
 * Creates and initializes a PIXI Application
 * @param options Configuration options for PIXI setup
 * @returns Promise<Application> The initialized PIXI app
 */
export async function createPIXIApp(options: PIXISetupOptions): Promise<Application> {
  const {
    canvas,
    width,
    height,
    backgroundColor = 0x000000,
    resolution = window.devicePixelRatio || 1,
    antialias = true,
  } = options;

  // Initialize PIXI Application with WebGL renderer (v7 API)
  const app = new Application({
    view: canvas,
    width,
    height,
    backgroundColor,
    resolution,
    antialias,
    autoDensity: true,
    powerPreference: "high-performance",
  });

  return app;
}

/**
 * Preloads assets for faster rendering
 * @param assets Array of asset paths to preload
 */
export async function preloadAssets(assets: string[]): Promise<void> {
  if (assets.length === 0) return;

  // Add assets to loader
  assets.forEach((asset) => {
    Assets.add({ alias: asset, src: asset });
  });

  // Load all assets
  await Assets.load(assets);
}

/**
 * Cleans up PIXI application resources
 * @param app The PIXI Application to destroy
 */
export function destroyPIXIApp(app: Application): void {
  if (app) {
    app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true,
    });
  }
}
