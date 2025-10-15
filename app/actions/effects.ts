'use server'

import { createClient } from '@/lib/supabase/server'
import { AudioProperties, Effect, TextProperties, VideoImageProperties } from '@/types/effects'
import { revalidatePath } from 'next/cache'
// P0-3 FIX: Add input validation
import { EffectBaseSchema, validateEffectProperties, validatePartialEffectProperties } from '@/lib/validation/effect-schemas'
import { ensureInteger } from '@/lib/utils/database'

/**
 * Create a new effect on the timeline
 * @param projectId Project ID
 * @param effect Effect data
 * @returns Promise<Effect> The created effect
 */
export async function createEffect(
  projectId: string,
  effect: Omit<Effect, 'id' | 'project_id' | 'created_at' | 'updated_at'>
): Promise<Effect> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) throw new Error('Project not found')

  // P0-3 FIX: Validate effect base fields
  const validatedBase = EffectBaseSchema.parse({
    kind: effect.kind,
    track: effect.track,
    start_at_position: effect.start_at_position,
    duration: effect.duration,
    start: effect.start,
    end: effect.end,
    media_file_id: effect.media_file_id || null,
  });

  // P0-3 FIX: Validate properties based on effect kind
  const validatedProperties = validateEffectProperties(effect.kind, effect.properties);

  // Insert effect
  const { data, error } = await supabase
    .from('effects')
    .insert({
      project_id: projectId,
      kind: validatedBase.kind,
      track: validatedBase.track,
      start_at_position: ensureInteger(validatedBase.start_at_position)!,
      duration: ensureInteger(validatedBase.duration)!,
      start: ensureInteger(validatedBase.start)!, // Trim start (omniclip)
      end: ensureInteger(validatedBase.end)!, // Trim end (omniclip)
      media_file_id: validatedBase.media_file_id,
      properties: validatedProperties as Record<string, unknown>,
      // Add metadata fields
      file_hash: 'file_hash' in effect ? effect.file_hash : null,
      name: 'name' in effect ? effect.name : null,
      thumbnail: 'thumbnail' in effect ? effect.thumbnail : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Create effect error:', error)
    throw new Error(`Failed to create effect: ${error.message}`, { cause: error })
  }

  revalidatePath(`/editor/${projectId}`)
  return data as Effect
}

/**
 * Get all effects for a project
 * @param projectId Project ID
 * @returns Promise<Effect[]> Array of effects
 */
export async function getEffects(projectId: string): Promise<Effect[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) throw new Error('Project not found')

  // Get effects
  const { data, error } = await supabase
    .from('effects')
    .select('*')
    .eq('project_id', projectId)
    .order('track', { ascending: true })
    .order('start_at_position', { ascending: true })

  if (error) {
    console.error('Get effects error:', error)
    throw new Error(`Failed to get effects for project ${projectId}: ${error.message}`, { cause: error })
  }

  return data as Effect[]
}

/**
 * Update an effect
 * @param effectId Effect ID
 * @param updates Partial effect data to update
 * @returns Promise<Effect> The updated effect
 */
export async function updateEffect(
  effectId: string,
  updates: Partial<Omit<Effect, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<Effect> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify effect exists and user owns the project
  const { data: effect } = await supabase
    .from('effects')
    .select('project_id, projects!inner(user_id)')
    .eq('id', effectId)
    .single()

  if (!effect) throw new Error('Effect not found')

  // Type assertion to access nested fields
  const effectWithProject = effect as unknown as { project_id: string; projects: { user_id: string } }
  if (effectWithProject.projects.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // P0-3 FIX: Validate properties if provided
  let validatedUpdates = { ...updates };
  if (updates.properties) {
    // Get effect to know its kind (P0-FIX: Added error handling)
    const { data: effectData, error: effectError } = await supabase
      .from('effects')
      .select('kind')
      .eq('id', effectId)
      .single();

    if (effectError) {
      console.error('[UpdateEffect] Failed to fetch effect kind:', effectError);
      throw new Error(`Failed to validate effect properties: ${effectError.message}`);
    }

    if (!effectData) {
      throw new Error('Effect not found for validation');
    }

    const validatedProperties = validatePartialEffectProperties(effectData.kind, updates.properties);
    validatedUpdates = {
      ...updates,
      properties: validatedProperties as VideoImageProperties | AudioProperties | TextProperties,
    };
  }

  // FIX: Ensure INTEGER fields are rounded (database schema requires integers)
  // Float values from calculations must be converted to integers
  if (validatedUpdates.start_at_position !== undefined) {
    validatedUpdates.start_at_position = ensureInteger(validatedUpdates.start_at_position)!;
  }
  if (validatedUpdates.duration !== undefined) {
    validatedUpdates.duration = ensureInteger(validatedUpdates.duration)!;
  }
  if (validatedUpdates.start !== undefined) {
    validatedUpdates.start = ensureInteger(validatedUpdates.start)!;
  }
  if (validatedUpdates.end !== undefined) {
    validatedUpdates.end = ensureInteger(validatedUpdates.end)!;
  }

  // Update effect
  const { data, error } = await supabase
    .from('effects')
    .update({
      ...validatedUpdates,
      properties: validatedUpdates.properties as unknown as Record<string, unknown> | undefined,
    })
    .eq('id', effectId)
    .select()
    .single()

  if (error) {
    console.error('Update effect error:', error)
    throw new Error(`Failed to update effect ${effectId}: ${error.message}`, { cause: error })
  }

  revalidatePath('/editor')
  return data as Effect
}

/**
 * Delete an effect
 * @param effectId Effect ID
 * @returns Promise<void>
 */
export async function deleteEffect(effectId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify effect exists and user owns the project
  const { data: effect } = await supabase
    .from('effects')
    .select('project_id, projects!inner(user_id)')
    .eq('id', effectId)
    .single()

  if (!effect) throw new Error('Effect not found')

  // Type assertion to access nested fields
  const effectWithProject = effect as unknown as { project_id: string; projects: { user_id: string } }
  if (effectWithProject.projects.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Delete effect
  const { error } = await supabase
    .from('effects')
    .delete()
    .eq('id', effectId)

  if (error) {
    console.error('Delete effect error:', error)
    throw new Error(`Failed to delete effect ${effectId}: ${error.message}`, { cause: error })
  }

  revalidatePath('/editor')
}

/**
 * Batch update multiple effects
 * Used for pushing effects forward or other bulk operations
 * @param updates Array of effect ID and updates
 * @returns Promise<Effect[]> Updated effects
 */
export async function batchUpdateEffects(
  updates: Array<{ id: string; updates: Partial<Effect> }>
): Promise<Effect[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const updatedEffects: Effect[] = []

  // Note: Supabase doesn't support batch updates directly,
  // so we update one by one in a transaction-like manner
  for (const { id, updates: effectUpdates } of updates) {
    try {
      const updated = await updateEffect(id, effectUpdates)
      updatedEffects.push(updated)
    } catch (error) {
      console.error(`Failed to update effect ${id}:`, error)
      throw error
    }
  }

  return updatedEffects
}

/**
 * Create effect from media file with automatic positioning and smart defaults
 * This is the main entry point from UI (MediaCard "Add to Timeline" button)
 *
 * @param projectId Project ID
 * @param mediaFileId Media file ID
 * @param targetPosition Optional target position (auto-calculated if not provided)
 * @param targetTrack Optional target track (auto-calculated if not provided)
 * @returns Promise<Effect> Created effect with proper defaults
 */
export async function createEffectFromMediaFile(
  projectId: string,
  mediaFileId: string,
  targetPosition?: number,
  targetTrack?: number
): Promise<Effect> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Get media file
  const { data: mediaFile, error: mediaError } = await supabase
    .from('media_files')
    .select('*')
    .eq('id', mediaFileId)
    .eq('user_id', user.id)
    .single()

  if (mediaError || !mediaFile) {
    throw new Error('Media file not found')
  }

  // 2. Get existing effects for smart placement
  const existingEffects = await getEffects(projectId)

  // 3. Determine effect kind from MIME type
  const kind = mediaFile.mime_type.startsWith('video/') ? 'video' as const :
               mediaFile.mime_type.startsWith('audio/') ? 'audio' as const :
               mediaFile.mime_type.startsWith('image/') ? 'image' as const :
               null

  if (!kind) throw new Error('Unsupported media type')

  // 4. Get project settings for canvas dimensions
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('settings')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    throw new Error('Project not found')
  }

  const settings = (project.settings as Record<string, unknown>) || {}
  const canvasWidth = (settings.width as number | undefined) || 1920
  const canvasHeight = (settings.height as number | undefined) || 1080

  // 5. Get metadata
  const metadata = mediaFile.metadata as Record<string, unknown>
  const rawDuration = Math.round(((metadata.duration as number | undefined) || 5) * 1000) // Default 5s for images, must be integer

  // 6. Calculate optimal position and track if not provided
  const { findPlaceForNewEffect } = await import('@/features/timeline/utils/placement')
  let position = targetPosition ?? 0
  let track = targetTrack ?? 0

  if (targetPosition === undefined || targetTrack === undefined) {
    const optimal = findPlaceForNewEffect(existingEffects, 3) // 3 tracks default
    position = targetPosition ?? optimal.position
    track = targetTrack ?? optimal.track
  }

  // 7. Create effect with appropriate properties
  const effectData = {
    kind,
    track,
    start_at_position: Math.round(position), // Must be integer
    duration: rawDuration,
    start: 0, // Trim start (omniclip)
    end: rawDuration, // Trim end (omniclip)
    media_file_id: mediaFileId,
    file_hash: mediaFile.file_hash,
    name: mediaFile.filename,
    thumbnail: kind === 'video' ? ((metadata.thumbnail as string | undefined) || '') :
               kind === 'image' ? (mediaFile.storage_path || '') : '',
    properties: createDefaultProperties(kind, metadata, canvasWidth, canvasHeight) as unknown as VideoImageProperties | AudioProperties | TextProperties,
  } as Omit<Effect, 'id' | 'project_id' | 'created_at' | 'updated_at'>

  // 7. Create effect in database
  return createEffect(projectId, effectData)
}

/**
 * Create default properties based on media type
 * @param kind Effect type (video, audio, image)
 * @param metadata Media file metadata
 * @param canvasWidth Canvas width from project settings
 * @param canvasHeight Canvas height from project settings
 */
function createDefaultProperties(
  kind: 'video' | 'audio' | 'image',
  metadata: Record<string, unknown>,
  canvasWidth: number = 1920,
  canvasHeight: number = 1080
): Record<string, unknown> {
  if (kind === 'video' || kind === 'image') {
    const width = (metadata.width as number | undefined) || canvasWidth
    const height = (metadata.height as number | undefined) || canvasHeight

    return {
      rect: {
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: {
          x: canvasWidth / 2,  // Center X based on project settings
          y: canvasHeight / 2  // Center Y based on project settings
        },
        rotation: 0,
        pivot: {
          x: width / 2,
          y: height / 2
        }
      },
      raw_duration: Math.round(((metadata.duration as number | undefined) || 5) * 1000), // Must be integer
      frames: (metadata.frames as number | undefined) || Math.floor(((metadata.duration as number | undefined) || 5) * ((metadata.fps as number | undefined) || 30))
    }
  } else if (kind === 'audio') {
    return {
      volume: 1.0,
      muted: false,
      raw_duration: Math.round(((metadata.duration as number | undefined) || 0) * 1000) // Must be integer
    }
  }

  return {}
}

// ======================================
// Text Effect CRUD - T076 (Phase 7)
// ======================================

/**
 * Create text effect with full styling support
 * Constitutional FR-007 compliance
 */
export async function createTextEffect(
  projectId: string,
  text: string,
  position?: { x: number; y: number },
  track?: number
): Promise<Effect> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get project settings for canvas dimensions
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('settings')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    throw new Error('Project not found')
  }

  const settings = (project.settings as Record<string, unknown>) || {}
  const canvasWidth = (settings.width as number | undefined) || 1920
  const canvasHeight = (settings.height as number | undefined) || 1080

  // Get existing effects for smart placement
  const existingEffects = await getEffects(projectId)

  // Calculate optimal position
  const { findPlaceForNewEffect } = await import('@/features/timeline/utils/placement')
  const optimal = findPlaceForNewEffect(existingEffects, 3)

  const textEffect = {
    kind: 'text' as const,
    track: track ?? optimal.track,
    start_at_position: position?.x ?? optimal.position,
    duration: 5000,  // Default 5 seconds
    start: 0,
    end: 5000,
    properties: {
      text: text || 'Default text',
      fontFamily: 'Arial',
      fontSize: 38,
      fontStyle: 'normal' as const,
      fontVariant: 'normal' as const,
      fontWeight: 'normal' as const,
      align: 'center' as const,
      fill: ['#FFFFFF'],
      fillGradientType: 0 as 0 | 1,
      fillGradientStops: [],
      rect: {
        width: 400,
        height: 100,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: {
          x: position?.x ?? (canvasWidth / 2),  // Center X based on project settings
          y: position?.y ?? (canvasHeight / 2)  // Center Y based on project settings
        },
        rotation: 0,
        pivot: { x: 0, y: 0 }
      },
      stroke: '#FFFFFF',
      strokeThickness: 0,
      lineJoin: 'miter' as const,
      miterLimit: 10,
      textBaseline: 'alphabetic' as const,
      letterSpacing: 0,
      dropShadow: false,
      dropShadowDistance: 5,
      dropShadowBlur: 0,
      dropShadowAlpha: 1,
      dropShadowAngle: 0.5,
      dropShadowColor: '#000000',
      breakWords: false,
      wordWrap: false,
      lineHeight: 0,
      leading: 0,
      wordWrapWidth: 100,
      whiteSpace: 'pre' as const
    }
  } as Omit<Effect, 'id' | 'project_id' | 'created_at' | 'updated_at'>

  return createEffect(projectId, textEffect)
}

/**
 * Update text effect styling
 * Supports all TextStyleOptions from TextManager
 */
export async function updateTextEffectStyle(
  effectId: string,
  styleUpdates: Partial<TextProperties>
): Promise<Effect> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get existing effect
  const { data: existingEffect } = await supabase
    .from('effects')
    .select('properties')
    .eq('id', effectId)
    .single()

  if (!existingEffect) throw new Error('Effect not found')

  const updatedProperties = {
    ...(existingEffect.properties as TextProperties),
    ...styleUpdates
  }

  return updateEffect(effectId, { properties: updatedProperties as unknown as TextProperties })
}

/**
 * Batch update text positions (for drag operations)
 */
export async function updateTextPosition(
  effectId: string,
  position: { x: number; y: number },
  rotation?: number,
  scale?: { x: number; y: number }
): Promise<Effect> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get existing effect
  const { data: existingEffect } = await supabase
    .from('effects')
    .select('properties')
    .eq('id', effectId)
    .single()

  if (!existingEffect) throw new Error('Effect not found')

  const props = existingEffect.properties as TextProperties
  const updatedRect = {
    ...props.rect,
    position_on_canvas: position,
    ...(rotation !== undefined && { rotation }),
    ...(scale && { scaleX: scale.x, scaleY: scale.y })
  }

  return updateEffect(effectId, {
    properties: {
      ...props,
      rect: updatedRect
    } as unknown as TextProperties
  })
}
