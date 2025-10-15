/**
 * Database integer normalization helpers
 */
export function ensureInteger(value: number | undefined): number | undefined {
  return value !== undefined ? Math.round(value) : undefined
}

export function ensureIntegerOr(value: number | undefined, fallback: number): number {
  return value !== undefined ? Math.round(value) : fallback
}

