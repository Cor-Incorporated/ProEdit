/**
 * TextStyleControls - Complete text styling panel
 * T075 - Phase 7 Implementation
 * Constitutional FR-007 compliance
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextEffect } from '@/types/effects'
import { ColorPicker } from './ColorPicker'
import { FontPicker } from './FontPicker'

interface TextStyleControlsProps {
  effect: TextEffect | null
  onStyleChange: (updates: Partial<TextEffect['properties']>) => void
}

export function TextStyleControls({ effect, onStyleChange }: TextStyleControlsProps) {
  if (!effect) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Text Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a text element to edit its properties
          </p>
        </CardContent>
      </Card>
    )
  }

  const props = effect.properties

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader>
        <CardTitle>Text Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-content">Content</Label>
              <Input
                id="text-content"
                value={props.text}
                onChange={(e) => onStyleChange({ text: e.target.value })}
                placeholder="Enter text..."
              />
            </div>

            <div className="space-y-2">
              <Label>Font Family</Label>
              <FontPicker
                value={props.fontFamily}
                onChange={(fontFamily) => onStyleChange({ fontFamily })}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Size: {props.fontSize}px</Label>
              <Slider
                value={[props.fontSize || 38]}
                onValueChange={([fontSize]) => onStyleChange({ fontSize })}
                min={12}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={props.fontWeight}
                onValueChange={(fontWeight) =>
                  onStyleChange({
                    fontWeight: fontWeight as TextEffect['properties']['fontWeight'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="bolder">Bolder</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="300">300</SelectItem>
                  <SelectItem value="400">400</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="600">600</SelectItem>
                  <SelectItem value="700">700</SelectItem>
                  <SelectItem value="800">800</SelectItem>
                  <SelectItem value="900">900</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Style</Label>
              <Select
                value={props.fontStyle}
                onValueChange={(fontStyle) =>
                  onStyleChange({ fontStyle: fontStyle as TextEffect['properties']['fontStyle'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                  <SelectItem value="oblique">Oblique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={props.align}
                onValueChange={(align) =>
                  onStyleChange({ align: align as TextEffect['properties']['align'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="justify">Justify</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4">
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <ColorPicker
                value={props.fill[0] || '#FFFFFF'}
                onChange={(color) => onStyleChange({ fill: [color, ...props.fill.slice(1)] })}
              />
              {props.fill.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Gradient: {props.fill.length} colors
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Stroke Color</Label>
              <ColorPicker
                value={props.stroke || '#FFFFFF'}
                onChange={(stroke) => onStyleChange({ stroke })}
              />
            </div>

            <div className="space-y-2">
              <Label>Stroke Thickness: {props.strokeThickness || 0}px</Label>
              <Slider
                value={[props.strokeThickness || 0]}
                onValueChange={([strokeThickness]) => onStyleChange({ strokeThickness })}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Letter Spacing: {props.letterSpacing || 0}px</Label>
              <Slider
                value={[props.letterSpacing || 0]}
                onValueChange={([letterSpacing]) => onStyleChange({ letterSpacing })}
                min={-10}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Line Join</Label>
              <Select
                value={props.lineJoin}
                onValueChange={(lineJoin) =>
                  onStyleChange({ lineJoin: lineJoin as TextEffect['properties']['lineJoin'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miter">Miter</SelectItem>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="bevel">Bevel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Text Baseline</Label>
              <Select
                value={props.textBaseline}
                onValueChange={(textBaseline) =>
                  onStyleChange({
                    textBaseline: textBaseline as TextEffect['properties']['textBaseline'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetic">Alphabetic</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="hanging">Hanging</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="ideographic">Ideographic</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Drop Shadow</Label>
              <Switch
                checked={props.dropShadow || false}
                onCheckedChange={(dropShadow) => onStyleChange({ dropShadow })}
              />
            </div>

            {props.dropShadow && (
              <>
                <div className="space-y-2">
                  <Label>Shadow Color</Label>
                  <ColorPicker
                    value={props.dropShadowColor || '#000000'}
                    onChange={(dropShadowColor) => onStyleChange({ dropShadowColor })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shadow Distance: {props.dropShadowDistance || 5}px</Label>
                  <Slider
                    value={[props.dropShadowDistance || 5]}
                    onValueChange={([dropShadowDistance]) =>
                      onStyleChange({ dropShadowDistance })
                    }
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shadow Blur: {props.dropShadowBlur || 0}px</Label>
                  <Slider
                    value={[props.dropShadowBlur || 0]}
                    onValueChange={([dropShadowBlur]) => onStyleChange({ dropShadowBlur })}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Shadow Alpha: {((props.dropShadowAlpha || 1) * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    value={[(props.dropShadowAlpha || 1) * 100]}
                    onValueChange={([alpha]) => onStyleChange({ dropShadowAlpha: alpha / 100 })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shadow Angle: {props.dropShadowAngle || 0.5}rad</Label>
                  <Slider
                    value={[props.dropShadowAngle || 0.5]}
                    onValueChange={([dropShadowAngle]) => onStyleChange({ dropShadowAngle })}
                    min={0}
                    max={Math.PI * 2}
                    step={0.1}
                  />
                </div>
              </>
            )}

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Word Wrap</Label>
                <Switch
                  checked={props.wordWrap || false}
                  onCheckedChange={(wordWrap) => onStyleChange({ wordWrap })}
                />
              </div>

              {props.wordWrap && (
                <div className="space-y-2">
                  <Label>Wrap Width: {props.wordWrapWidth || 100}px</Label>
                  <Slider
                    value={[props.wordWrapWidth || 100]}
                    onValueChange={([wordWrapWidth]) => onStyleChange({ wordWrapWidth })}
                    min={50}
                    max={1000}
                    step={10}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Break Words</Label>
                <Switch
                  checked={props.breakWords || false}
                  onCheckedChange={(breakWords) => onStyleChange({ breakWords })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
