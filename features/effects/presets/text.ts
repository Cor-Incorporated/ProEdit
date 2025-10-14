/**
 * Text effect animation presets - Phase 7 T078
 * Standard text animations (fade in/out, slide, etc.)
 */

export interface TextAnimation {
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut'
  duration: number
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export const TEXT_ANIMATIONS: Record<string, TextAnimation> = {
  fadeIn: {
    type: 'fadeIn',
    duration: 500,
    easing: 'easeIn'
  },
  fadeOut: {
    type: 'fadeOut',
    duration: 500,
    easing: 'easeOut'
  },
  slideIn: {
    type: 'slideIn',
    duration: 800,
    easing: 'easeOut'
  },
  slideOut: {
    type: 'slideOut',
    duration: 800,
    easing: 'easeIn'
  }
}
