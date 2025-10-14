import { describe, it, expect } from 'vitest'
import { calculateFileHash, calculateFileHashes } from '@/features/media/utils/hash'

describe('File Hash Calculation', () => {
  it('should generate consistent hash for same file', async () => {
    const content = 'test content for hashing'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    const hash1 = await calculateFileHash(file)
    const hash2 = await calculateFileHash(file)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 produces 64 hex characters
  })

  it('should generate different hashes for different files', async () => {
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' })
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' })

    const hash1 = await calculateFileHash(file1)
    const hash2 = await calculateFileHash(file2)

    expect(hash1).not.toBe(hash2)
  })

  it('should handle empty files', async () => {
    const file = new File([], 'empty.txt', { type: 'text/plain' })
    const hash = await calculateFileHash(file)

    expect(hash).toHaveLength(64)
  })

  it('should calculate hashes for multiple files', async () => {
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' })
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' })

    const hashMap = await calculateFileHashes([file1, file2])

    expect(hashMap.size).toBe(2)
    expect(hashMap.get(file1)).toBeDefined()
    expect(hashMap.get(file2)).toBeDefined()
    expect(hashMap.get(file1)).not.toBe(hashMap.get(file2))
  })
})
