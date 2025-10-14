/**
 * TextManager for PIXI.js text effects
 * Ported from omniclip text-manager.ts (Line 15-89)
 * Phase 7 - T073
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

export interface TextStyle {
  fontFamily?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
}

export class TextManager {
  private app: PIXI.Application
  private container: PIXI.Container
  private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  private fonts: Map<string, boolean> = new Map() // Track loaded fonts

  constructor(
    app: PIXI.Application,
    getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {
    this.app = app
    this.container = new PIXI.Container()
    this.getMediaFileUrl = getMediaFileUrl
    app.stage.addChild(this.container)
  }

  /**
   * Create text effect on canvas
   * Ported from omniclip Line 25-45
   */
  createTextEffect(config: TextConfig): PIXI.Text {
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

    this.container.addChild(text)
    return text
  }

  /**
   * Update text style dynamically
   * Ported from omniclip Line 46-62
   */
  updateTextStyle(text: PIXI.Text, style: Partial<TextStyle>): void {
    if (style.fontSize !== undefined) text.style.fontSize = style.fontSize
    if (style.color !== undefined) text.style.fill = style.color
    if (style.fontFamily !== undefined) {
      text.style.fontFamily = style.fontFamily
      void this.loadFont(style.fontFamily)
    }
    if (style.align !== undefined) text.style.align = style.align
  }

  /**
   * Load font dynamically
   * Ported from omniclip Line 63-89
   */
  async loadFont(fontFamily: string): Promise<void> {
    if (this.fonts.has(fontFamily)) return

    try {
      await document.fonts.load(`16px "${fontFamily}"`)
      this.fonts.set(fontFamily, true)
      console.log(`[TextManager] Font loaded: ${fontFamily}`)
    } catch (error) {
      console.warn(`[TextManager] Font failed to load: ${fontFamily}`, error)
      this.fonts.set(fontFamily, false)
    }
  }

  /**
   * Remove text from canvas
   */
  removeText(text: PIXI.Text): void {
    this.container.removeChild(text)
    text.destroy()
  }

  /**
   * Clear all text from canvas
   */
  clear(): void {
    this.container.removeChildren()
  }
}
