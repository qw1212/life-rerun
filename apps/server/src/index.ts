import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import narrativeRouter from './routes/narrative.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * dotenv 默认只读「当前工作目录」的 .env。
 * `npm run dev -w apps/server` 的 cwd 是 apps/server，而 README 让用户把 .env 放在仓库根，
 * 结果开发模式下永远读不到 Key，只能默默走模板降级。这里按优先级找几个常见位置。
 */
const envCandidates = Array.from(
  new Set([
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/server/.env'),
    path.resolve(moduleDir, '../../../.env'),
    path.resolve(moduleDir, '../../.env'),
  ])
)
const envFile = envCandidates.find((candidate) => existsSync(candidate))
if (envFile) {
  dotenv.config({ path: envFile })
}

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.disable('x-powered-by')

// 部署在 Nginx 后面时必须信任一层代理，否则所有请求的 req.ip 都是容器网关地址，
// 限流会变成「全站共用一个额度」。直连公网时可设 TRUST_PROXY=0。
const trustProxy = Number(process.env.TRUST_PROXY)
app.set('trust proxy', Number.isFinite(trustProxy) ? trustProxy : 1)

// 生产环境建议通过 ALLOWED_ORIGINS 白名单限制来源；未配置时保持开发友好。
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
)
app.use(express.json({ limit: '256kb' }))

const healthHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    ai: process.env.OPENAI_API_KEY ? 'configured' : 'fallback',
    timestamp: new Date().toISOString(),
  })
}

// 同时暴露两个路径：直连后端用 /health，经 Nginx 反代时用 /api/health
app.get('/health', healthHandler)
app.get('/api/health', healthHandler)

app.use('/api/narrative', narrativeRouter)

// 未匹配的 API 路径返回 JSON，而不是掉进前端静态页
app.use('/api', (_req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 生产环境：如果存在前端构建产物，则直接提供静态服务（用于单容器/一体机部署）
const staticPath = path.resolve(moduleDir, '../../web/dist')
if (existsSync(staticPath)) {
  app.use(express.static(staticPath, { maxAge: '7d', index: false }))
  app.get('*', (req, res) => {
    // 缺失的静态资源应该 404，而不是回退成 index.html（否则浏览器会拿到
    // 一段 HTML 当 JS 执行，报错信息完全对不上真正的问题）
    if (/\.[a-z0-9]+$/i.test(req.path)) {
      res.status(404).end()
      return
    }
    res.sendFile(path.join(staticPath, 'index.html'))
  })
}

// 统一错误出口：请求体 JSON 解析失败也返回结构化错误，避免暴露 HTML 堆栈
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: '请求体不是合法的 JSON' })
    return
  }
  console.error('Unhandled error:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  const aiStatus = process.env.OPENAI_API_KEY ? 'AI 已配置' : '未配置 API Key，使用模板事件库'
  console.log(`🌱 Life Rerun server running at http://0.0.0.0:${PORT}（${aiStatus}）`)
  console.log(`📄 环境变量文件：${envFile ?? '未找到 .env，仅使用系统环境变量'}`)
})

function shutdown(signal: string): void {
  console.log(`\n收到 ${signal}，正在关闭服务...`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
