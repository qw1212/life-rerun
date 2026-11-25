import type {
  AIGeneratedEventType,
  AttributeKey,
  NarrativeResponse,
  OptionEffect,
  OptionType,
  Perma,
  PlayerState,
  StoryOption,
} from '@life-rerun/shared'
import { buildSystemPrompt, buildUserPrompt, SAFETY_PROMPT_SUFFIX } from './prompts.js'

export interface AIProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AIProvider {
  generateNarrative(player: PlayerState): Promise<NarrativeResponse>
}

const AI_EVENT_TYPES: AIGeneratedEventType[] = ['normal', 'highlight', 'insight', 'breather']
const OPTION_TYPES: OptionType[] = [
  'safe',
  'adventure',
  'relationship',
  'growth',
  'acceptance',
  'meaning',
]
const ATTRIBUTE_KEYS: AttributeKey[] = [
  'intelligence',
  'physique',
  'charm',
  'wealth',
  'luck',
  'resilience',
]
const PERMA_KEYS: (keyof Perma)[] = [
  'positive',
  'engagement',
  'relationships',
  'meaning',
  'achievement',
]

const DEFAULT_HINT = '每一次选择，都是更了解自己的机会。'

/**
 * 从模型输出里取出 JSON。
 * 有些兼容接口会在 JSON 前后带解释文字或 Markdown 代码块，直接 JSON.parse 会整段失败。
 */
function extractJson(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const text = (fenced ? fenced[1] : content).trim()
  // 即使 JSON 前后有解释文字，也截取最外层的 {...}，避免整段解析失败
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) return text.slice(start, end + 1)
  return text
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLength)
}

function clampEffect(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n === 0) return undefined
  const clamped = Math.max(min, Math.min(max, n))
  return Math.round(clamped * 10) / 10
}

function normalizeEffect(raw: unknown): OptionEffect {
  const effect: OptionEffect = {}
  if (!raw || typeof raw !== 'object') return effect
  const source = raw as Record<string, unknown>

  const attributes: Partial<Record<AttributeKey, number>> = {}
  const rawAttributes =
    source.attributes && typeof source.attributes === 'object'
      ? (source.attributes as Record<string, unknown>)
      : {}
  for (const key of ATTRIBUTE_KEYS) {
    const value = clampEffect(rawAttributes[key], -3, 3)
    if (value !== undefined) attributes[key] = value
  }
  if (Object.keys(attributes).length > 0) effect.attributes = attributes

  const perma: Partial<Perma> = {}
  const rawPerma =
    source.perma && typeof source.perma === 'object'
      ? (source.perma as Record<string, unknown>)
      : {}
  for (const key of PERMA_KEYS) {
    const value = clampEffect(rawPerma[key], -3, 3)
    if (value !== undefined) perma[key] = value
  }
  if (Object.keys(perma).length > 0) effect.perma = perma

  const resilience = clampEffect(source.resilience, -5, 5)
  if (resilience !== undefined) effect.resilience = resilience

  // 刻意忽略 theme / unlockTalent / addHelper：
  // 这些字段会影响主线与贵人系统，只能由人工审核过的模板事件写入。
  return effect
}

function normalizeOption(raw: unknown, index: number, usedIds: Set<string>): StoryOption | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const text = cleanText(source.text, 80)
  if (!text) return null

  let id = cleanText(source.id, 40) || `opt-${index + 1}`
  let suffix = index + 1
  while (usedIds.has(id)) {
    id = `opt-${suffix}`
    suffix += 1
  }
  usedIds.add(id)

  const rawType = cleanText(source.type, 20) as OptionType
  const type = OPTION_TYPES.includes(rawType) ? rawType : 'safe'
  const preview = cleanText(source.preview, 40)

  return {
    id,
    text,
    type,
    effect: normalizeEffect(source.effect),
    ...(preview ? { preview } : {}),
  }
}

/**
 * 把模型返回的 JSON 规范化成可安全渲染的叙事结构。
 *
 * 模型输出是不可信输入：缺字段、选项为空、数值离谱、id 重复都会让界面
 * 出现空白卡片或数值爆炸。这里统一校验并收敛，不合格就抛错走模板降级。
 */
export function parseNarrativeResponse(content: string): NarrativeResponse {
  const json = extractJson(content)
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(json) as Record<string, unknown>
  } catch (error) {
    console.error('Failed to parse AI response:', content)
    throw new Error(
      `Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const story = cleanText(parsed.story, 2000)
  if (!story) throw new Error('AI response is missing story')

  const rawOptions = Array.isArray(parsed.options) ? parsed.options : []
  const usedIds = new Set<string>()
  const options = rawOptions
    .map((option, index) => normalizeOption(option, index, usedIds))
    .filter((option): option is StoryOption => option !== null)
    .slice(0, 4)

  if (options.length < 2) {
    throw new Error('AI response does not contain enough valid options')
  }

  const rawType = cleanText(parsed.type, 20) as AIGeneratedEventType
  const eventType = AI_EVENT_TYPES.includes(rawType) ? rawType : undefined
  const eventTitle = cleanText(parsed.title, 24)
  const psychologyHint = cleanText(parsed.psychologyHint, 60) || DEFAULT_HINT

  return {
    story,
    options,
    psychologyHint,
    ...(eventType ? { eventType } : {}),
    ...(eventTitle ? { eventTitle } : {}),
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(private config: AIProviderConfig) {}

  async generateNarrative(player: PlayerState): Promise<NarrativeResponse> {
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(player) + SAFETY_PROMPT_SUFFIX },
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const request = (jsonMode: boolean) =>
      fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.8,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      })

    try {
      // 部分 OpenAI 兼容接口不支持 response_format，会直接返回 400；
      // 这种情况下去掉该参数重试一次，而不是白白降级到模板。
      let response = await request(true)
      if (response.status === 400) {
        response = await request(false)
      }

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`AI API error: ${response.status} ${text}`)
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('AI response is empty')
      }

      return parseNarrativeResponse(content)
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export function createAIProvider(): AIProvider | null {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey || isPlaceholderKey(apiKey)) {
    return null
  }

  return new OpenAICompatibleProvider({ apiKey, baseUrl, model })
}

function isPlaceholderKey(key: string): boolean {
  const normalized = key.trim().toLowerCase()
  return (
    normalized === '' ||
    normalized === 'your_openai_api_key' ||
    normalized === 'your_api_key' ||
    normalized === 'your_api_key_here' ||
    normalized === 'sk-xxx'
  )
}
