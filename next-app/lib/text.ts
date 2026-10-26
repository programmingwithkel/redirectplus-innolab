/**
 * Converts an UPPER_SNAKE_CASE code into a human-readable Title Case label.
 * e.g. "EMERGENCY_CARE" → "Emergency Care"
 */
export function humanizeCode(code: string): string {
  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** Case- and whitespace-insensitive key used for matching free-text names. */
export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}
