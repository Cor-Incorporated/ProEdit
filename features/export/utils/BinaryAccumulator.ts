// Ported from omniclip: vendor/omniclip/s/context/controllers/video-export/tools/BinaryAccumulator/tool.ts (Line 1-41)

/**
 * BinaryAccumulator - Accumulates binary chunks into a single Uint8Array
 * Used for collecting encoded video chunks
 */
export class BinaryAccumulator {
  private chunks: Uint8Array[] = []
  private totalSize = 0
  private cachedBinary: Uint8Array | null = null

  // Ported from omniclip Line 6-10
  addChunk(chunk: Uint8Array): void {
    this.totalSize += chunk.byteLength
    this.chunks.push(chunk)
    this.cachedBinary = null // Invalidate cache on new data
  }

  // Ported from omniclip Line 14-29
  // Try to get binary once at the end of encoding to avoid memory leaks
  get binary(): Uint8Array {
    // Return cached binary if available
    if (this.cachedBinary) {
      return this.cachedBinary
    }

    let offset = 0
    const binary = new Uint8Array(this.totalSize)
    for (const chunk of this.chunks) {
      binary.set(chunk, offset)
      offset += chunk.byteLength
    }

    this.cachedBinary = binary // Cache the result
    return binary
  }

  // Ported from omniclip Line 31-33
  get size(): number {
    return this.totalSize
  }

  // Ported from omniclip Line 35-39
  clearBinary(): void {
    this.chunks = []
    this.totalSize = 0
    this.cachedBinary = null
  }
}
