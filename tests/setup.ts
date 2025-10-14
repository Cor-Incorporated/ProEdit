import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
  redirect: vi.fn(),
}))

// Mock window.crypto for hash tests (if needed in Node environment)
if (typeof window !== 'undefined' && !window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: {
        digest: async (algorithm: string, data: ArrayBuffer) => {
          // Fallback to Node crypto for tests
          const crypto = await import('crypto')
          return crypto.createHash('sha256').update(Buffer.from(data)).digest()
        }
      }
    }
  })
}
