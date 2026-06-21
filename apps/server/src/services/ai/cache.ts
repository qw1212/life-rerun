import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'

interface CacheEntry {
  response: NarrativeResponse
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 // 24 小时

function buildCacheKey(player: PlayerState): string {
  const keyParts = [
    player.age,
    player.stage,
    player.theme,
    player.resilience,
    player.emotionTags.sort().join(','),
    player.history.length,
  ]
  return keyParts.join('|')
}

export function getCachedNarrative(player: PlayerState): NarrativeResponse | null {
  const key = buildCacheKey(player)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.response
}

export function setCachedNarrative(player: PlayerState, response: NarrativeResponse, ttlMs = DEFAULT_TTL_MS): void {
  const key = buildCacheKey(player)
  cache.set(key, {
    response,
    expiresAt: Date.now() + ttlMs,
  })
}

export function clearCache(): void {
  cache.clear()
}
