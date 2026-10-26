/**
 * Performs a fetch that is aborted after `timeoutMs` and resolves to parsed JSON.
 * Resolves to `null` on network failure, timeout, non-2xx status, or invalid JSON,
 * so callers can treat every external provider failure uniformly (graceful fallback).
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  logLabel: string
): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      console.warn(`[${logLabel}] HTTP ${response.status} ${response.statusText}`)
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    console.warn(`[${logLabel}] Request failed or timed out:`, (error as Error).message)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
