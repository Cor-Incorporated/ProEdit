'use client'

import { useEffect } from 'react'

/**
 * Debug component to verify Service Worker registration
 * Required for FFmpeg.wasm SharedArrayBuffer support
 */
export function ServiceWorkerDebug() {
  useEffect(() => {
    // Check if Service Worker is supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log('[SW Debug] Service Worker registrations:', registrations.length)
        registrations.forEach((registration, index) => {
          console.log(`[SW Debug] Registration ${index}:`, registration.scope)
        })
      })

      // Check SharedArrayBuffer availability
      if (typeof SharedArrayBuffer !== 'undefined') {
        console.log('[SW Debug] ✅ SharedArrayBuffer is available')
      } else {
        console.error('[SW Debug] ❌ SharedArrayBuffer is NOT available - FFmpeg will fail')
        console.error('[SW Debug] Check COOP/COEP headers and Service Worker registration')
      }

      // Check cross-origin isolation
      if (crossOriginIsolated) {
        console.log('[SW Debug] ✅ Cross-origin isolated')
      } else {
        console.error('[SW Debug] ❌ NOT cross-origin isolated')
      }
    } else {
      console.error('[SW Debug] Service Worker not supported in this browser')
    }
  }, [])

  return null // No UI, debug only
}
