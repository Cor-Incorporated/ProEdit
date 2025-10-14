"use client"

/**
 * ColorPicker Component - Phase 7 T072
 * Provides preset colors and custom color picker
 */

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
        >
          <div
            className="mr-2 h-4 w-4 rounded border"
            style={{ backgroundColor: value }}
          />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div>
            <label htmlFor="color-input" className="text-sm font-medium">
              Custom Color
            </label>
            <Input
              id="color-input"
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Preset Colors</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-8 w-8 rounded border-2 border-muted hover:border-ring"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
