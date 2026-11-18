import { Router } from 'express'
import { generateNarrative } from '../services/ai/index.js'
import {
  getLifeStage,
  assessRisk,
  extractAssessmentSignals,
  countRecentLowStreak,
  type AssessmentResult,
  type PlayerState,
  type RiskSignals,
} from '@life-rerun/shared'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const body = req.body as Partial<PlayerState> & { assessments?: AssessmentResult[] }
    const assessments = body.assessments
    const partial = body

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

    // 危机分级：综合自由文本、量表结果与近期低谷密度
    const signals: RiskSignals = {
      freeText: player.gratitudeLog,
      recentLowStreak: countRecentLowStreak(player),
      ...extractAssessmentSignals(assessments),
    }
    const risk = assessRisk(signals)

    // 高风险：硬中断叙事，不调用 AI，交由客户端展示危机支持界面
    if (risk.blockNarrative) {
      res.json({ story: '', options: [], psychologyHint: '', risk, blocked: true })
      return
    }

    const response = await generateNarrative(player)
    res.json({ ...response, risk })
  } catch (error) {
    console.error('Narrative error:', error)
    res.status(500).json({ error: '生成叙事失败' })
  }
})

export default router
