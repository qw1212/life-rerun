import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import narrativeRouter from './routes/narrative.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/narrative', narrativeRouter)

// 生产环境：如果存在前端构建产物，则直接提供静态服务（用于单容器/一体机部署）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const staticPath = path.resolve(__dirname, '../../web/dist')
if (existsSync(staticPath)) {
  app.use(express.static(staticPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌱 Life Rerun server running at http://0.0.0.0:${PORT}`)
})
