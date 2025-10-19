/**
 * Safely parse numeric environment variables.
 * Falls back to defaultValue when unset, NaN, or below the optional minimum.
 */
export function getEnvNumber(key: string, defaultValue: number, options: { min?: number } = {}): number {
  const raw = Number(process.env[key] ?? defaultValue);
  if (!Number.isFinite(raw)) {
    return defaultValue;
  }

  const min = options.min ?? 0;
  return raw >= min ? raw : defaultValue;
}
