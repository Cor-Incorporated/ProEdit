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
  start_at_position: number; // Timeline position in ms
  duration: number; // Display duration in ms
  start_time: number; // Trim start in ms
  end_time: number; // Trim end in ms
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
}

export interface ImageEffect extends BaseEffect {
  kind: "image";
  properties: VideoImageProperties;
  media_file_id: string;
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
}

// Text specific properties
export interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic" | "bold" | "bold italic";
  align: "left" | "center" | "right";
  fill: string[]; // Gradient colors
  rect: {
    width: number;
    height: number;
    position_on_canvas: Position;
  };
  stroke?: string;
  strokeThickness?: number;
  dropShadow?: boolean;
  dropShadowDistance?: number;
  dropShadowBlur?: number;
  dropShadowAlpha?: number;
  dropShadowAngle?: number;
  dropShadowColor?: string;
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
