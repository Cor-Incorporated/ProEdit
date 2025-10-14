/**
 * P0-3 FIX: Input validation schemas for effect properties
 * Prevents type assertion bypasses and validates all effect data
 */

import { z } from 'zod';

// Base rect schema used by all visual effects
const RectSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  scaleX: z.number().default(1),
  scaleY: z.number().default(1),
  position_on_canvas: z.object({
    x: z.number(),
    y: z.number(),
  }),
  rotation: z.number().default(0),
  pivot: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

// Video/Image properties schema
export const VideoImagePropertiesSchema = z.object({
  rect: RectSchema,
  raw_duration: z.number().positive(),
  frames: z.number().int().positive().optional(),
});

// Audio properties schema
export const AudioPropertiesSchema = z.object({
  volume: z.number().min(0).max(1).default(1),
  muted: z.boolean().default(false),
  raw_duration: z.number().positive(),
});

// Text properties schema
export const TextPropertiesSchema = z.object({
  text: z.string().max(10000),
  fontFamily: z.string().min(1).max(100),
  fontSize: z.number().min(8).max(200),
  fontStyle: z.enum(['normal', 'italic', 'oblique']).default('normal'),
  fontVariant: z.enum(['normal', 'small-caps']).default('normal'),
  fontWeight: z.enum(['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal'),
  align: z.enum(['left', 'center', 'right', 'justify']).default('center'),
  fill: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(1),
  fillGradientType: z.union([z.literal(0), z.literal(1)]).default(0),
  fillGradientStops: z.array(z.number()).default([]),
  rect: RectSchema,
  stroke: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  strokeThickness: z.number().min(0).max(50).default(0),
  lineJoin: z.enum(['miter', 'round', 'bevel']).default('miter'),
  miterLimit: z.number().positive().default(10),
  textBaseline: z.enum(['alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom']).default('alphabetic'),
  letterSpacing: z.number().default(0),
  dropShadow: z.boolean().default(false),
  dropShadowDistance: z.number().min(0).default(5),
  dropShadowBlur: z.number().min(0).default(0),
  dropShadowAlpha: z.number().min(0).max(1).default(1),
  dropShadowAngle: z.number().default(0.5),
  dropShadowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
  breakWords: z.boolean().default(false),
  wordWrap: z.boolean().default(false),
  lineHeight: z.number().min(0).default(0),
  leading: z.number().default(0),
  wordWrapWidth: z.number().positive().default(100),
  whiteSpace: z.enum(['normal', 'pre', 'pre-line']).default('pre'),
});

// Effect base schema
export const EffectBaseSchema = z.object({
  kind: z.enum(['video', 'audio', 'image', 'text']),
  track: z.number().int().min(0),
  start_at_position: z.number().int().min(0),
  duration: z.number().int().positive(),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  media_file_id: z.string().uuid().nullable(),
});

/**
 * Validate effect properties based on kind
 */
export function validateEffectProperties(kind: string, properties: unknown): unknown {
  switch (kind) {
    case 'video':
    case 'image':
      return VideoImagePropertiesSchema.parse(properties);
    case 'audio':
      return AudioPropertiesSchema.parse(properties);
    case 'text':
      return TextPropertiesSchema.parse(properties);
    default:
      throw new Error(`Unknown effect kind: ${kind}`);
  }
}

/**
 * Partial validation for updates (all fields optional)
 */
export function validatePartialEffectProperties(kind: string, properties: unknown): unknown {
  switch (kind) {
    case 'video':
    case 'image':
      return VideoImagePropertiesSchema.partial().parse(properties);
    case 'audio':
      return AudioPropertiesSchema.partial().parse(properties);
    case 'text':
      return TextPropertiesSchema.partial().parse(properties);
    default:
      throw new Error(`Unknown effect kind: ${kind}`);
  }
}
