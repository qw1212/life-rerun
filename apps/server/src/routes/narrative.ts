import { Router } from 'express'
import { generateNarrative } from '../services/ai/index.js'
import { getLifeStage, type PlayerState } from '@life-rerun/shared'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const partial = req.body as Partial<PlayerState>

    if (!partial.name || partial.age === undefined) {
      res.status(400).json({ error: '缺少必要的玩家状态字段' })
      return
    }

    const player: PlayerState = {
      id: partial.id || crypto.randomUUID(),
      name: partial.name,
      age: partial.age,
      stage: partial.stage || getLifeStage(partial.age),
      attributes: partial.attributes || {
        intelligence: 50,
        physique: 50,
        charm: 50,
        wealth: 50,
        luck: 50,
        resilience: 50,
      },
      perma: partial.perma || {
        positive: 50,
        engagement: 50,
        relationships: 50,
        meaning: 50,
        achievement: 50,
      },
      resilience: partial.resilience ?? 50,
      emotionTags: partial.emotionTags || ['平静'],
      talents: partial.talents || [],
      theme: partial.theme || 'undecided',
      helpers: partial.helpers || [],
      history: partial.history || [],
      gratitudeLog: partial.gratitudeLog || [],
      createdAt: partial.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = await generateNarrative(player)
    res.json(response)
  } catch (error) {
    console.error('Narrative error:', error)
    res.status(500).json({ error: '生成叙事失败' })
  }
})

export default router
