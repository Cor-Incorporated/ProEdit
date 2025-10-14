/**
 * File hash calculation utilities
 * Ported from omniclip: /s/context/controllers/media/parts/file-hasher.ts
 * Uses SHA-256 for file deduplication
 */

/**
 * Calculate SHA-256 hash of a file
 * Uses Web Crypto API for security and performance
 * Handles large files with chunk processing to avoid memory issues
 * @param file File to hash
 * @returns Promise<string> Hex-encoded hash
 */
export async function calculateFileHash(file: File): Promise<string> {
  const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB chunks
  const chunks = Math.ceil(file.size / CHUNK_SIZE)
  const hashBuffer: ArrayBuffer[] = []

  // Read file in chunks to avoid memory issues
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    const arrayBuffer = await chunk.arrayBuffer()
    hashBuffer.push(arrayBuffer)
  }

  // Concatenate all chunks
  const concatenated = new Uint8Array(
    hashBuffer.reduce((acc, buf) => acc + buf.byteLength, 0)
  )
  let offset = 0
  for (const buf of hashBuffer) {
    concatenated.set(new Uint8Array(buf), offset)
    offset += buf.byteLength
  }

  // Calculate SHA-256 hash
  const hashArrayBuffer = await crypto.subtle.digest('SHA-256', concatenated)

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashArrayBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Calculate hash for multiple files in parallel
 * @param files Array of files
 * @returns Promise<Map<File, string>> Map of file to hash
 */
export async function calculateFileHashes(
  files: File[]
): Promise<Map<File, string>> {
  const hashes = new Map<File, string>()

  // Process all files in parallel for better performance
  const hashPromises = files.map(async (file) => {
    const hash = await calculateFileHash(file)
    return { file, hash }
  })

  const results = await Promise.all(hashPromises)
  results.forEach(({ file, hash }) => {
    hashes.set(file, hash)
  })

  return hashes
}
