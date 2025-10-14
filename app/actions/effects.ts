'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Effect, VideoImageProperties, AudioProperties, TextProperties } from '@/types/effects'

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

  // Insert effect
  const { data, error } = await supabase
    .from('effects')
    .insert({
      project_id: projectId,
      kind: effect.kind,
      track: effect.track,
      start_at_position: effect.start_at_position,
      duration: effect.duration,
      start: effect.start, // Trim start (omniclip)
      end: effect.end, // Trim end (omniclip)
      media_file_id: effect.media_file_id || null,
      properties: effect.properties as unknown as Record<string, unknown>,
      // Add metadata fields
      file_hash: 'file_hash' in effect ? effect.file_hash : null,
      name: 'name' in effect ? effect.name : null,
      thumbnail: 'thumbnail' in effect ? effect.thumbnail : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Create effect error:', error)
    throw new Error(error.message)
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
    throw new Error(error.message)
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

  // Update effect
  const { data, error } = await supabase
    .from('effects')
    .update({
      ...updates,
      properties: updates.properties as unknown as Record<string, unknown> | undefined,
    })
    .eq('id', effectId)
    .select()
    .single()

  if (error) {
    console.error('Update effect error:', error)
    throw new Error(error.message)
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
    throw new Error(error.message)
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

  // 4. Get metadata
  const metadata = mediaFile.metadata as Record<string, unknown>
  const rawDuration = ((metadata.duration as number | undefined) || 5) * 1000 // Default 5s for images

  // 5. Calculate optimal position and track if not provided
  const { findPlaceForNewEffect } = await import('@/features/timeline/utils/placement')
  let position = targetPosition ?? 0
  let track = targetTrack ?? 0

  if (targetPosition === undefined || targetTrack === undefined) {
    const optimal = findPlaceForNewEffect(existingEffects, 3) // 3 tracks default
    position = targetPosition ?? optimal.position
    track = targetTrack ?? optimal.track
  }

  // 6. Create effect with appropriate properties
  const effectData = {
    kind,
    track,
    start_at_position: position,
    duration: rawDuration,
    start: 0, // Trim start (omniclip)
    end: rawDuration, // Trim end (omniclip)
    media_file_id: mediaFileId,
    file_hash: mediaFile.file_hash,
    name: mediaFile.filename,
    thumbnail: kind === 'video' ? ((metadata.thumbnail as string | undefined) || '') :
               kind === 'image' ? (mediaFile.storage_path || '') : '',
    properties: createDefaultProperties(kind, metadata) as unknown as VideoImageProperties | AudioProperties | TextProperties,
  } as Omit<Effect, 'id' | 'project_id' | 'created_at' | 'updated_at'>

  // 7. Create effect in database
  return createEffect(projectId, effectData)
}

/**
 * Create default properties based on media type
 */
function createDefaultProperties(kind: 'video' | 'audio' | 'image', metadata: Record<string, unknown>): Record<string, unknown> {
  if (kind === 'video' || kind === 'image') {
    const width = (metadata.width as number | undefined) || 1920
    const height = (metadata.height as number | undefined) || 1080

    return {
      rect: {
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: {
          x: 1920 / 2, // Center X
          y: 1080 / 2  // Center Y
        },
        rotation: 0,
        pivot: {
          x: width / 2,
          y: height / 2
        }
      },
      raw_duration: ((metadata.duration as number | undefined) || 5) * 1000,
      frames: (metadata.frames as number | undefined) || Math.floor(((metadata.duration as number | undefined) || 5) * ((metadata.fps as number | undefined) || 30))
    }
  } else if (kind === 'audio') {
    return {
      volume: 1.0,
      muted: false,
      raw_duration: ((metadata.duration as number | undefined) || 0) * 1000
    }
  }

  return {}
}
