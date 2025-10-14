'use client'

// T081: Quality Selector Component

import { ExportQuality, EXPORT_PRESETS } from '../types'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export interface QualitySelectorProps {
  value: ExportQuality
  onValueChange: (quality: ExportQuality) => void
  disabled?: boolean
}

export function QualitySelector({
  value,
  onValueChange,
  disabled = false,
}: QualitySelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Export Quality</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onValueChange(v as ExportQuality)}
        disabled={disabled}
        className="gap-3"
      >
        {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
          <div key={key} className="flex items-center space-x-3 space-y-0">
            <RadioGroupItem value={key} id={key} />
            <Label
              htmlFor={key}
              className="font-normal cursor-pointer flex flex-col"
            >
              <span className="font-medium">{key.toUpperCase()}</span>
              <span className="text-xs text-muted-foreground">
                {preset.width}x{preset.height}, {preset.bitrate / 1000}Mbps, {preset.framerate}fps
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
