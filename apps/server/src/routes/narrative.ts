import { Router } from 'express'
import { z } from 'zod'
import { generateNarrative } from '../services/ai/index.js'
import { rateLimit } from '../middleware/rate-limit.js'
import {
  assessRisk,
  countRecentLowStreak,
  extractAssessmentSignals,
  getAssessmentScale,
  getLifeStage,
  scoreAssessment,
  type AssessmentResult,
  type EmotionTag,
  type EventType,
  type Helper,
  type HistoryRecord,
  type LifeTheme,
  type OptionType,
  type PlayerState,
  type RiskSignals,
  type Talent,
} from '@life-rerun/shared'

const router = Router()

const EMOTION_TAGS = [
  '平静',
  '期待',
  '焦虑',
  '喜悦',
  '失落',
  '愤怒',
  '感恩',
  '孤独',
  '希望',
  '疲惫',
] as const

const LIFE_THEMES = ['academic', 'startup', 'art', 'social', 'ordinary', 'undecided'] as const
const EVENT_TYPES: EventType[] = [
  'normal',
  'highlight',
  'low',
  'insight',
  'breather',
  'milestone',
]
const OPTION_TYPES: OptionType[] = [
  'safe',
  'adventure',
  'relationship',
  'growth',
  'acceptance',
  'meaning',
]
const historySchema = z
  .object({
    age: z.number().optional(),
    eventId: z.string().max(80).optional(),
    eventTitle: z.string().max(120).optional(),
    eventType: z.enum(['normal', 'highlight', 'low', 'insight', 'breather', 'milestone']).optional(),
    selectedOptionId: z.string().max(80).optional(),
    selectedOptionText: z.string().max(200).optional(),
    selectedOptionType: z
      .enum(['safe', 'adventure', 'relationship', 'growth', 'acceptance', 'meaning'])
      .optional(),
    psychologyHint: z.string().max(200).optional(),
  })
  .passthrough()

const bodySchema = z
  .object({
    name: z.string().trim().min(1, '缺少角色名字').max(24, '角色名字过长'),
    age: z.number().int().min(0).max(120),
    id: z.string().max(80).optional(),
    theme: z.enum(LIFE_THEMES).optional(),
    resilience: z.number().min(0).max(100).optional(),
    emotionTags: z.array(z.enum(EMOTION_TAGS)).max(6).optional(),
    gratitudeLog: z.array(z.string().max(200)).max(20).optional(),
    history: z.array(historySchema).max(80).optional(),
    talents: z.array(z.unknown()).max(10).optional(),
    helpers: z.array(z.unknown()).max(10).optional(),
    attributes: z.unknown().optional(),
    perma: z.unknown().optional(),
    assessments: z.array(z.unknown()).max(4).optional(),
  })
  .passthrough()

const assessmentSchema = z
  .object({
    scale: z.enum(['phq9', 'gad7']),
    phase: z.enum(['pre', 'post']),
    answers: z.array(z.number().int().min(0).max(3)).min(1).max(20),
    completedAt: z.string().max(40).optional(),
  })
  .passthrough()

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNumber(value: unknown, fallback: number, max = 100): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return clamp(Math.round(value), 0, max)
}

function readText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLength)
}

function buildAttributes(raw: unknown): PlayerState['attributes'] {
  const source = isRecord(raw) ? raw : {}
  return {
    intelligence: readNumber(source.intelligence, 50),
    physique: readNumber(source.physique, 50),
    charm: readNumber(source.charm, 50),
    wealth: readNumber(source.wealth, 50),
    luck: readNumber(source.luck, 50),
    resilience: readNumber(source.resilience, 50),
  }
}

function buildPerma(raw: unknown): PlayerState['perma'] {
  const source = isRecord(raw) ? raw : {}
  return {
    positive: readNumber(source.positive, 50),
    engagement: readNumber(source.engagement, 50),
    relationships: readNumber(source.relationships, 50),
    meaning: readNumber(source.meaning, 50),
    achievement: readNumber(source.achievement, 50),
  }
}

function buildHistory(raw: unknown): HistoryRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(-80).flatMap((item) => {
    const parsed = historySchema.safeParse(item)
    if (!parsed.success) return []
    const data = parsed.data
    const eventType =
      data.eventType && EVENT_TYPES.includes(data.eventType as EventType)
        ? (data.eventType as EventType)
        : 'normal'
    return [
      {
        age: typeof data.age === 'number' ? clamp(Math.round(data.age), 0, 120) : 0,
        eventId: readText(data.eventId, 80) || 'unknown-event',
        eventTitle: readText(data.eventTitle, 120) || '人生片段',
        eventType,
        selectedOptionId: readText(data.selectedOptionId, 80) || 'unknown-option',
        selectedOptionText: readText(data.selectedOptionText, 200) || '（未记录）',
        ...(data.selectedOptionType && OPTION_TYPES.includes(data.selectedOptionType)
          ? { selectedOptionType: data.selectedOptionType }
          : {}),
        attributeChanges: {},
        psychologyHint: readText(data.psychologyHint, 200),
      },
    ]
  })
}

function buildTalents(raw: unknown): Talent[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 10).flatMap((item) => {
    if (!isRecord(item)) return []
    const id = readText(item.id, 60)
    const name = readText(item.name, 40)
    if (!id || !name) return []
    const effectRaw = isRecord(item.effect) ? item.effect : {}
    const unlockTheme =
      typeof effectRaw.unlockTheme === 'string' &&
      (LIFE_THEMES as readonly string[]).includes(effectRaw.unlockTheme)
        ? (effectRaw.unlockTheme as LifeTheme)
        : undefined
    const unlockEventIds = Array.isArray(effectRaw.unlockEventIds)
      ? effectRaw.unlockEventIds
          .filter((value): value is string => typeof value === 'string')
          .slice(0, 10)
      : undefined
    return [
      {
        id,
        name,
        description: readText(item.description, 120),
        type: 'normal' as const,
        effect: {
          ...(unlockTheme ? { unlockTheme } : {}),
          ...(unlockEventIds ? { unlockEventIds } : {}),
        },
      },
    ]
  })
}

function buildHelpers(raw: unknown): Helper[] {
  if (!Array.isArray(raw)) return []
  const roles: Helper['role'][] = ['mentor', 'friend', 'partner', 'stranger']
  return raw.slice(0, 10).flatMap((item) => {
    if (!isRecord(item)) return []
    const id = readText(item.id, 60)
    const name = readText(item.name, 40)
    if (!id || !name) return []
    const role = roles.includes(item.role as Helper['role'])
      ? (item.role as Helper['role'])
      : 'stranger'
    return [
      {
        id,
        name,
        role,
        description: readText(item.description, 160),
        unlockEventIds: [],
      },
    ]
  })
}

/**
 * 只接受「答题完整」的量表结果，并用答案重新计分。
 * 客户端传来的 totalScore 一律不采信，避免伪造分数绕过风险分级。
 */
function buildAssessments(raw: unknown): AssessmentResult[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 4).flatMap((item) => {
    const parsed = assessmentSchema.safeParse(item)
    if (!parsed.success) return []
    const { scale, phase, answers } = parsed.data
    const meta = getAssessmentScale(scale)
    if (answers.length !== meta.itemCount) return []
    if (!answers.every((answer) => Number.isInteger(answer) && answer <= meta.maxItemScore)) {
      return []
    }
    return [
      {
        scale,
        phase,
        answers,
        completedAt: parsed.data.completedAt || new Date().toISOString(),
        ...scoreAssessment(scale, answers),
      },
    ]
  })
}

function buildPlayer(body: z.infer<typeof bodySchema>): PlayerState {
  const age = body.age
  const emotionTags = (body.emotionTags && body.emotionTags.length > 0
    ? body.emotionTags
    : ['平静']) as EmotionTag[]

  return {
    id: readText(body.id, 80) || 'anonymous',
    name: body.name,
    age,
    // 阶段由服务端按年龄重新推导：客户端传来的 stage 可能与 age 不一致
    stage: getLifeStage(age),
    attributes: buildAttributes(body.attributes),
    perma: buildPerma(body.perma),
    resilience: readNumber(body.resilience, 50),
    emotionTags,
    talents: buildTalents(body.talents),
    theme: body.theme && (LIFE_THEMES as readonly string[]).includes(body.theme)
      ? body.theme
      : 'undecided',
    helpers: buildHelpers(body.helpers),
    history: buildHistory(body.history),
    gratitudeLog: (body.gratitudeLog ?? [])
      .map((entry) => readText(entry, 200))
      .filter((entry) => entry.length > 0)
      .slice(-20),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

router.post('/', rateLimit, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || '请求参数不合法'
    res.status(400).json({ error: message })
    return
  }

  try {
    const player = buildPlayer(parsed.data)
    const assessments = buildAssessments(parsed.data.assessments)

    // 危机分级：综合自由文本、量表结果与近期低谷密度
    const signals: RiskSignals = {
      freeText: player.gratitudeLog,
      recentLowStreak: countRecentLowStreak(player),
      ...extractAssessmentSignals(assessments),
    }
    const risk = assessRisk(signals)

    // 叙事响应包含个人化内容，禁止中间层缓存
    res.setHeader('Cache-Control', 'no-store')

    // 高风险：硬中断叙事，不调用 AI，交由客户端展示危机支持界面
    if (risk.blockNarrative) {
      res.json({ story: '', options: [], psychologyHint: '', risk, blocked: true })
      return
    }

    const response = await generateNarrative(player, { needsSupport: risk.needsSupport })
    res.json({ ...response, risk })
  } catch (error) {
    console.error('Narrative error:', error)
    res.status(500).json({ error: '生成叙事失败，请稍后再试' })
  }
})

export default router
