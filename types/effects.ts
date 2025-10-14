/**
 * Effect type definitions adapted from omniclip
 * Represents timeline elements (video, audio, image, text)
 */

// Base effect interface
export type EffectKind = "video" | "audio" | "image" | "text";

export interface Position {
  x: number;
  y: number;
}

export interface Rect {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  position_on_canvas: Position;
  rotation: number;
  pivot: Position;
}

// Base effect properties
export interface BaseEffect {
  id: string;
  project_id: string;
  kind: EffectKind;
  track: number;

  // Timeline positioning (from omniclip)
  start_at_position: number; // Timeline position in ms
  duration: number; // Display duration in ms (calculated: end - start)

  // Trim points (from omniclip) - CRITICAL for Phase 6 trim functionality
  start: number; // Trim start position in ms (within media file)
  end: number; // Trim end position in ms (within media file)

  // Mute state (from omniclip) - for audio mixing
  is_muted?: boolean;

  // Database-specific fields
  media_file_id?: string;
  created_at: string;
  updated_at: string;
}

// Video/Image specific properties
export interface VideoImageProperties {
  rect: Rect;
  raw_duration: number;
  frames: number;
}

export interface VideoEffect extends BaseEffect {
  kind: "video";
  properties: VideoImageProperties;
  media_file_id: string;
  file_hash: string; // File deduplication (from omniclip)
  name: string; // Original filename (from omniclip)
  thumbnail: string; // Thumbnail URL (from omniclip)
}

export interface ImageEffect extends BaseEffect {
  kind: "image";
  properties: VideoImageProperties;
  media_file_id: string;
  file_hash: string; // File deduplication (from omniclip)
  name: string; // Original filename (from omniclip)
  thumbnail?: string; // Optional thumbnail URL (omniclip compatible - images use source as thumbnail)
}

// Audio specific properties
export interface AudioProperties {
  volume: number;
  muted: boolean;
  raw_duration: number;
}

export interface AudioEffect extends BaseEffect {
  kind: "audio";
  properties: AudioProperties;
  media_file_id: string;
  file_hash: string; // File deduplication (from omniclip)
  name: string; // Original filename (from omniclip)
}

// Text specific properties - Complete omniclip compatibility
export interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic" | "oblique";
  fontVariant: "normal" | "small-caps";
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  align: "left" | "center" | "right" | "justify";
  fill: string[]; // Gradient colors
  fillGradientType: 0 | 1; // 0: VERTICAL, 1: HORIZONTAL
  fillGradientStops: number[];
  rect: Rect; // Full rect with all transform properties
  stroke: string;
  strokeThickness: number;
  lineJoin: "miter" | "round" | "bevel";
  miterLimit: number;
  textBaseline: "alphabetic" | "top" | "hanging" | "middle" | "ideographic" | "bottom";
  letterSpacing: number;
  dropShadow: boolean;
  dropShadowDistance: number;
  dropShadowBlur: number;
  dropShadowAlpha: number;
  dropShadowAngle: number;
  dropShadowColor: string;
  // Advanced text properties from omniclip
  breakWords: boolean;
  wordWrap: boolean;
  lineHeight: number;
  leading: number;
  wordWrapWidth: number;
  whiteSpace: "pre" | "normal" | "pre-line";
}

export interface TextEffect extends BaseEffect {
  kind: "text";
  properties: TextProperties;
  media_file_id?: never;
}

// Union type for all effects
export type Effect = VideoEffect | ImageEffect | AudioEffect | TextEffect;

// Filter types
export type FilterType = "brightness" | "contrast" | "saturation" | "blur" | "hue";

export interface Filter {
  id: string;
  project_id: string;
  effect_id: string;
  type: FilterType;
  value: number;
  created_at: string;
}

// Animation types
export type AnimationType = "in" | "out";
export type EaseType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInBack"
  | "easeOutBack"
  | "easeInOutBack";

export interface Animation {
  id: string;
  project_id: string;
  effect_id: string;
  type: AnimationType;
  for_type: string; // Property being animated (opacity, scale, position, etc.)
  ease_type: EaseType;
  duration: number;
  created_at: string;
}

// Transition types
export interface Transition {
  id: string;
  project_id: string;
  from_effect_id: string;
  to_effect_id: string;
  name: string;
  duration: number;
  params: Record<string, unknown>;
  created_at: string;
}

// Helper functions for type guards
export function isVideoEffect(effect: Effect): effect is VideoEffect {
  return effect.kind === "video";
}

export function isImageEffect(effect: Effect): effect is ImageEffect {
  return effect.kind === "image";
}

export function isAudioEffect(effect: Effect): effect is AudioEffect {
  return effect.kind === "audio";
}

export function isTextEffect(effect: Effect): effect is TextEffect {
  return effect.kind === "text";
}

export function hasMediaFile(effect: Effect): effect is VideoEffect | ImageEffect | AudioEffect {
  return effect.kind === "video" || effect.kind === "image" || effect.kind === "audio";
}
