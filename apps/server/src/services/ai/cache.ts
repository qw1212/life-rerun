import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'

interface CacheEntry {
  response: NarrativeResponse
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 // 24 小时
const MAX_ENTRIES = 500

function buildCacheKey(player: PlayerState): string {
  const keyParts = [
    // 故事里会出现玩家姓名，不写进 key 会把别人的故事返回给你
    player.name,
    player.age,
    player.stage,
    player.theme,
    Math.round(player.resilience),
    // 注意不要直接 sort()：那会原地修改请求里的情绪标签数组
    [...player.emotionTags].sort().join(','),
    player.history
      .slice(-6)
      .map((record) => record.eventId)
      .join(','),
  ]
  return keyParts.join('|')
}

function purgeExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key)
  }
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

export function setCachedNarrative(
  player: PlayerState,
  response: NarrativeResponse,
  ttlMs = DEFAULT_TTL_MS
): void {
  if (cache.size >= MAX_ENTRIES) {
    purgeExpired(Date.now())
    // 仍然过多时按插入顺序淘汰最早的条目，避免内存无上限增长
    while (cache.size >= MAX_ENTRIES) {
      const oldestKey = cache.keys().next().value
      if (oldestKey === undefined) break
      cache.delete(oldestKey)
    }
  }

  cache.set(buildCacheKey(player), {
    response,
    expiresAt: Date.now() + ttlMs,
  })
}

export function clearCache(): void {
  cache.clear()
}
