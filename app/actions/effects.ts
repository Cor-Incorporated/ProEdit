'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Effect } from '@/types/effects'

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
      start_time: effect.start_time,
      end_time: effect.end_time,
      media_file_id: effect.media_file_id || null,
      properties: effect.properties as any,
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
  const effectWithProject = effect as any
  if (effectWithProject.projects.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Update effect
  const { data, error } = await supabase
    .from('effects')
    .update({
      ...updates,
      properties: updates.properties as any,
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
  const effectWithProject = effect as any
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
