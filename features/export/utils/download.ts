// T092: Download utility for exported files

/**
 * Download a Uint8Array as a file
 */
export function downloadFile(
  data: Uint8Array,
  filename: string,
  mimeType: string = 'video/mp4'
): void {
  try {
    const blob = new Blob([data as BlobPart], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Download failed:', error)
    throw new Error('Failed to download file')
  }
}

/**
 * Generate a filename for export
 */
export function generateExportFilename(
  projectName: string = 'video',
  quality: string,
  extension: string = 'mp4'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_')
  return `${sanitizedName}_${quality}_${timestamp}.${extension}`
}
