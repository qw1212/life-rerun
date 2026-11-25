import type { NextFunction, Request, Response } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MINUTE) || 30
const MAX_BUCKETS = 5000

/**
 * 极简内存限流。
 *
 * 这个接口会消耗真金白银的模型额度，没有限流时，一个脚本就能把 API Key 刷爆。
 * 单实例部署足够用；多实例部署时应换成 Redis 之类的共享存储。
 */
export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now()
  const key = req.ip || req.socket.remoteAddress || 'unknown'

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    next()
    return
  }

  bucket.count += 1
  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    res.setHeader('Retry-After', String(retryAfter))
    res.status(429).json({ error: '请求太频繁了，请稍后再试。' })
    return
  }

  next()
}
