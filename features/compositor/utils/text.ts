/**
 * PIXI.Text utility functions - Phase 7 T074
 * Separated from TextManager for reusability
 */

import * as PIXI from 'pixi.js'

export interface TextConfig {
  content: string
  x?: number
  y?: number
  fontFamily?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
}

/**
 * Create PIXI.Text with configuration
 */
export function createPIXIText(config: TextConfig): PIXI.Text {
  const text = new PIXI.Text(config.content, {
    fontFamily: config.fontFamily || 'Arial',
    fontSize: config.fontSize || 24,
    fill: config.color || '#ffffff',
    align: config.align || 'left',
    fontWeight: config.fontWeight || 'normal',
  })

  text.x = config.x || 0
  text.y = config.y || 0
  text.anchor.set(0.5)

  return text
}
