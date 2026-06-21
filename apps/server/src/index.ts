import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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

app.listen(PORT, () => {
  console.log(`🌱 Life Rerun server running at http://localhost:${PORT}`)
})

