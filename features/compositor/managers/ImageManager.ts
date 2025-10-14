import * as PIXI from 'pixi.js'
import { ImageEffect } from '@/types/effects'

/**
 * ImageManager - Manages image effects on PIXI canvas
 * Ported from omniclip: /s/context/controllers/compositor/parts/image-manager.ts
 */
export class ImageManager {
  private images = new Map<
    string,
    {
      sprite: PIXI.Sprite
      texture: PIXI.Texture
    }
  >()

  constructor(
    private app: PIXI.Application,
    private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {}

  /**
   * Add image effect to canvas
   * Ported from omniclip:45-80
   */
  async addImage(effect: ImageEffect): Promise<void> {
    try {
      const fileUrl = await this.getMediaFileUrl(effect.media_file_id)

      // Load texture (omniclip:47)
      const texture = await PIXI.Assets.load(fileUrl)

      // Create sprite (omniclip:48-56)
      const sprite = new PIXI.Sprite(texture)
      sprite.x = effect.properties.rect.position_on_canvas.x
      sprite.y = effect.properties.rect.position_on_canvas.y
      sprite.scale.set(effect.properties.rect.scaleX, effect.properties.rect.scaleY)
      sprite.rotation = effect.properties.rect.rotation * (Math.PI / 180)
      sprite.pivot.set(effect.properties.rect.pivot.x, effect.properties.rect.pivot.y)
      sprite.eventMode = 'static'
      sprite.cursor = 'pointer'

      this.images.set(effect.id, { sprite, texture })

      console.log(`ImageManager: Added image effect ${effect.id}`)
    } catch (error) {
      console.error(`ImageManager: Failed to add image ${effect.id}:`, error)
      throw error
    }
  }

  addToStage(effectId: string, track: number, trackCount: number): void {
    const image = this.images.get(effectId)
    if (!image) return

    image.sprite.zIndex = trackCount - track
    this.app.stage.addChild(image.sprite)
  }

  removeFromStage(effectId: string): void {
    const image = this.images.get(effectId)
    if (!image) return

    this.app.stage.removeChild(image.sprite)
  }

  remove(effectId: string): void {
    const image = this.images.get(effectId)
    if (!image) return

    this.removeFromStage(effectId)
    image.texture.destroy(true)
    this.images.delete(effectId)
  }

  /**
   * FIXED: Added error handling to prevent cleanup failures
   */
  destroy(): void {
    this.images.forEach((_, id) => {
      try {
        this.remove(id)
      } catch (error) {
        console.warn(`ImageManager: Error removing image ${id}:`, error)
      }
    })
    this.images.clear()
  }

  getSprite(effectId: string): PIXI.Sprite | undefined {
    return this.images.get(effectId)?.sprite
  }
}
