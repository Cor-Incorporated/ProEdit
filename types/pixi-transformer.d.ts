/**
 * Type declarations for pixi-transformer
 * Package uses PIXI v5, we're adapting for v8
 */
declare module 'pixi-transformer' {
  import type * as PIXI from 'pixi.js'

  export interface TransformerOptions {
    boxRotationEnabled?: boolean
    translateEnabled?: boolean
    group?: PIXI.DisplayObject[]
    stage?: PIXI.Container
    wireframeStyle?: {
      thickness?: number
      color?: number
    }
  }

  export class Transformer extends PIXI.Container {
    constructor(options?: TransformerOptions)
    destroy(): void
  }
}
