/**
 * SplitButton component
 * Allows splitting selected effects at the playhead position
 */

'use client'

import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'
import { useTimelineStore } from '@/stores/timeline'
import { useCompositorStore } from '@/stores/compositor'
import { useHistoryStore } from '@/stores/history'
import { splitEffect } from '../utils/split'
import { updateEffect, createEffect } from '@/app/actions/effects'
import { toast } from 'sonner'

export function SplitButton() {
  const { effects, selectedEffectIds, updateEffect: updateStoreEffect, addEffect } = useTimelineStore()
  const { timecode } = useCompositorStore()
  const { recordSnapshot } = useHistoryStore()

  const handleSplit = async () => {
    // Get selected effects
    const selectedEffects = effects.filter(e => selectedEffectIds.includes(e.id))

    if (selectedEffects.length === 0) {
      toast.error('No effect selected')
      return
    }

    // Use current playhead position
    const splitTimecode = timecode

    // Record snapshot before split
    recordSnapshot(effects, `Split ${selectedEffects.length} effect(s)`)

    let splitCount = 0
    const errors: string[] = []

    for (const effect of selectedEffects) {
      try {
        const result = splitEffect(effect, splitTimecode)

        if (!result) {
          errors.push(`Cannot split ${effect.kind} at this position`)
          continue
        }

        const [leftEffect, rightEffect] = result

        // Update left effect (keeps original ID)
        await updateEffect(leftEffect.id, {
          duration: leftEffect.duration,
          end: leftEffect.end,
        })
        updateStoreEffect(leftEffect.id, leftEffect)

        // Create right effect (new)
        const { id, created_at, updated_at, ...rightData } = rightEffect
        const createdEffect = await createEffect(effect.project_id, rightData as any)
        addEffect(createdEffect)

        splitCount++
      } catch (error) {
        console.error('Failed to split effect:', error)
        errors.push(`Failed to split ${effect.kind}`)
      }
    }

    // Show results
    if (splitCount > 0) {
      toast.success(`Split ${splitCount} effect(s)`)
    }
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err))
    }
  }

  const isDisabled = selectedEffectIds.length === 0

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSplit}
      disabled={isDisabled}
      title="Split selected effects at playhead (S)"
      data-action="split"
      className="gap-2"
    >
      <Scissors className="h-4 w-4" />
      Split
    </Button>
  )
}
