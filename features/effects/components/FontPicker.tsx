"use client"

/**
 * FontPicker Component - Phase 7 T071
 * Allows users to select from standard web fonts
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// tasks.md standard font list
const SUPPORTED_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black'
] as const

interface FontPickerProps {
  value: string
  onChange: (font: string) => void
}

export function FontPicker({ value, onChange }: FontPickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select font" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_FONTS.map((font) => (
          <SelectItem key={font} value={font}>
            <span style={{ fontFamily: font }}>{font}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
