"use client"

/**
 * TextEditor Panel - Phase 7 T070
 * Main interface for creating and editing text overlays
 */

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FontPicker } from './FontPicker'
import { ColorPicker } from './ColorPicker'
import { TextEffect } from '@/types/effects'

interface TextEditorProps {
  effect?: TextEffect
  onSave: (effect: TextEffect) => void
  onClose: () => void
  open: boolean
}

export function TextEditor({ effect, onSave, onClose, open }: TextEditorProps) {
  const [content, setContent] = useState(effect?.properties.text || 'Enter text')
  const [fontSize, setFontSize] = useState(effect?.properties.fontSize || 24)
  const [fontFamily, setFontFamily] = useState(effect?.properties.fontFamily || 'Arial')
  const [color, setColor] = useState(effect?.properties.fill[0] || '#ffffff')
  const [x, setX] = useState(effect?.properties.rect.position_on_canvas.x || 100)
  const [y, setY] = useState(effect?.properties.rect.position_on_canvas.y || 100)

  const handleSave = () => {
    const textEffect: TextEffect = {
      ...effect,
      id: effect?.id || crypto.randomUUID(),
      project_id: effect?.project_id || '',
      kind: 'text',
      track: effect?.track || 1,
      start_at_position: effect?.start_at_position || 0,
      duration: effect?.duration || 5000,
      start: 0,
      end: 5000,
      properties: {
        text: content,
        fontFamily,
        fontSize,
        fontStyle: 'normal',
        align: 'center',
        fill: [color],
        rect: {
          width: 800,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          position_on_canvas: { x, y },
          rotation: 0,
          pivot: { x: 0, y: 0 }
        },
        // Complete TextProperties defaults
        fontVariant: 'normal',
        fontWeight: 'normal',
        fillGradientType: 0,
        fillGradientStops: [],
        stroke: '#000000',
        strokeThickness: 0,
        lineJoin: 'miter',
        miterLimit: 10,
        textBaseline: 'alphabetic',
        letterSpacing: 0,
        dropShadow: false,
        dropShadowDistance: 0,
        dropShadowBlur: 0,
        dropShadowAlpha: 1,
        dropShadowAngle: Math.PI / 4,
        dropShadowColor: '#000000',
        breakWords: false,
        wordWrap: false,
        lineHeight: 0,
        leading: 0,
        wordWrapWidth: 100,
        whiteSpace: 'pre'
      },
      created_at: effect?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    onSave(textEffect)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Text Editor</SheetTitle>
          <SheetDescription>
            Create and edit text overlays
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="content">Text Content</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Font</Label>
            <FontPicker
              value={fontFamily}
              onChange={setFontFamily}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="200"
            />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <ColorPicker
              value={color}
              onChange={setColor}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x">X Position</Label>
              <Input
                id="x"
                type="number"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="y">Y Position</Label>
              <Input
                id="y"
                type="number"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
            </div>
          </div>

          <Button onClick={handleSave}>
            Save Text
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
