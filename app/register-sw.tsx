'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 * Registers coi-serviceworker.js for SharedArrayBuffer support (required by FFmpeg.wasm)
 * 
 * CRITICAL: Must be registered before FFmpeg loads
 * This component should be included in the root layout
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Check if Service Worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error('[SW] Service Worker not supported in this browser')
      return
    }

    // Register Service Worker
    const registerSW = async () => {
      try {
        // Check if already registered
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length > 0) {
          console.log('[SW] Service Worker already registered:', registrations.length)
          return
        }

        // Register new Service Worker
        const registration = await navigator.serviceWorker.register('/coi-serviceworker.js', {
          scope: '/',
        })

        console.log('[SW] Service Worker registered successfully:', registration.scope)

        // Wait for Service Worker to activate
        if (registration.active) {
          console.log('[SW] Service Worker is active')
        } else {
          console.log('[SW] Waiting for Service Worker to activate...')
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[SW] Service Worker activated - reloading page')
                  window.location.reload()
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error)
      }
    }

    // Register after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      void registerSW()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // No UI, just registration logic
  return null
}

/**
 * Wait for Service Worker to be ready and controller to be active.
 * Call this before initializing FFmpeg to reduce load failures.
 */
export async function waitForServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const onChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onChange)
        resolve()
      }
      navigator.serviceWorker.addEventListener('controllerchange', onChange, { once: true })
    })
  }
}

