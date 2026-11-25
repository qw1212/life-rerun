import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAIProvider,
  parseNarrativeResponse,
} from '../src/services/ai/provider.js'
import { checkInputSafety, checkOutputSafety, sanitizeStory } from '../src/services/ai/safety.js'
import { generateFallbackNarrative } from '../src/services/ai/fallback.js'
import { clearCache, generateNarrative } from '../src/services/ai/index.js'
import type { PlayerState } from '@life-rerun/shared'

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p',
    name: '小安',
    age: 16,
    stage: 'adolescence',
    attributes: {
      intelligence: 60,
      physique: 50,
      charm: 60,
      wealth: 50,
      luck: 50,
      resilience: 60,
    },
    perma: {
      positive: 50,
      engagement: 50,
      relationships: 50,
      meaning: 50,
      achievement: 50,
    },
    resilience: 60,
    emotionTags: ['平静'],
    talents: [],
    theme: 'undecided',
    helpers: [],
    history: [],
    gratitudeLog: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

test('AI 输出：可从 Markdown 代码块中提取 JSON', () => {
  const content = '```json\n{"story":"你走进教室。","options":[],"psychologyHint":"提示"}\n```'
  assert.throws(() => parseNarrativeResponse(content), /enough valid options/)
})

test('AI 输出：规范化脏数据（数值、类型、重复 id、系统字段）', () => {
  const content = JSON.stringify({
    type: 'highlight',
    title: '<b>小小胜利</b>',
    story: '<script>alert(1)</script>你今天完成了一件害怕的事。',
    options: [
      {
        id: 'dup',
        text: '庆祝一下',
        type: 'acceptance',
        effect: {
          attributes: { intelligence: 99, charm: 2, unknown: 5 },
          resilience: 9,
          theme: 'art',
          unlockTalent: 'hidden-genius',
        },
        hidden: true,
      },
      {
        id: 'dup',
        text: '继续挑战',
        type: 'not-a-type',
        effect: { attributes: { physique: -99 } },
      },
      { id: 'third', text: '分享给朋友', type: 'relationship' },
      { id: 'fourth', text: '记下来', type: 'growth' },
      { id: 'fifth', text: '多余选项', type: 'safe' },
    ],
    psychologyHint: '',
  })

  const result = parseNarrativeResponse(content)

  assert.equal(result.eventType, 'highlight')
  assert.equal(result.eventTitle, '小小胜利')
  assert.equal(result.story.includes('<script>'), false)
  assert.equal(result.options.length, 4)

  const first = result.options[0]
  assert.equal(first.effect.attributes?.intelligence, 3, '属性变化必须收敛到 ±3')
  assert.equal(first.effect.attributes?.charm, 2)
  assert.equal(first.effect.attributes?.unknown, undefined)
  assert.equal(first.effect.resilience, 5, '韧性变化必须收敛到 ±5')
  assert.equal(first.effect.theme, undefined, 'AI 不能写主线')
  assert.equal(first.effect.unlockTalent, undefined, 'AI 不能解锁天赋')
  assert.equal(first.hidden, undefined, 'AI 不能设置隐藏选项')

  const second = result.options[1]
  assert.equal(second.id, 'opt-2', '重复 id 必须被替换')
  assert.equal(second.type, 'safe', '非法选项类型回退为稳妥型')
  assert.equal(second.effect.attributes?.physique, -3)

  assert.ok(result.psychologyHint.length > 0, '心理提示为空时应补默认文案')
})

test('AI 输出：禁止生成低谷事件，缺选项时抛错', () => {
  const low = parseNarrativeResponse(
    JSON.stringify({
      type: 'low',
      story: '一段低落的日子。',
      psychologyHint: '慢慢来',
      options: [
        { id: 'a', text: 'A', type: 'safe', effect: {} },
        { id: 'b', text: 'B', type: 'growth', effect: {} },
      ],
    })
  )
  assert.equal(low.eventType, undefined, 'AI 不允许把事件标成低谷')

  assert.throws(
    () =>
      parseNarrativeResponse(
        JSON.stringify({
          story: '只有一句话。',
          psychologyHint: '提示',
          options: [{ id: 'a', text: 'A', type: 'safe', effect: {} }],
        })
      ),
    /enough valid options/
  )

  assert.throws(() => parseNarrativeResponse('not json'), /Failed to parse AI response/)
})

test('安全检查：风险文本与敏感内容都会被拦截', () => {
  assert.equal(checkInputSafety('今天和朋友一起吃饭，很开心').safe, true)
  assert.equal(checkInputSafety('我不想活了').safe, false)
  assert.equal(checkInputSafety('包含暴力内容').safe, false)

  assert.equal(checkOutputSafety('我想自杀').safe, false)
  assert.equal(checkOutputSafety('我很难过').safe, true)

  const lowMood = checkInputSafety('我最近很焦虑，睡不着')
  assert.equal(lowMood.safe, true)
  assert.equal(lowMood.needsSupport, true)

  assert.equal(sanitizeStory('  <p>你好</p>  '), '你好')
})

test('降级叙事：保留事件类型等元数据，并附加求助信息', () => {
  const response = generateFallbackNarrative(makePlayer(), true)

  assert.ok(response.story.length > 0)
  assert.ok(response.options.length >= 2)
  assert.ok(response.eventId, '降级事件需要回传 id')
  assert.ok(response.eventTitle, '降级事件需要回传标题')
  assert.ok(response.eventType, '降级事件需要回传类型')
  assert.ok(response.psychologyHint.includes('12356'), '需要支持时必须附上求助热线')
})

test('降级叙事：普通推进不会随机生成顿悟或喘息事件', () => {
  for (let i = 0; i < 30; i += 1) {
    const response = generateFallbackNarrative(makePlayer({ age: 10, stage: 'childhood' }))
    assert.notEqual(response.eventType, 'insight')
    assert.notEqual(response.eventType, 'breather')
  }
})

test('叙事入口：中高风险必须附带求助信息', async () => {
  const original = process.env.OPENAI_API_KEY
  try {
    delete process.env.OPENAI_API_KEY
    clearCache()
    const response = await generateNarrative(makePlayer(), { needsSupport: true })
    assert.ok(response.psychologyHint.includes('12356'))
    assert.ok(response.options.length >= 2)
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = original
  }
})

test('AI provider：未配置或占位 Key 时返回 null', () => {
  const original = process.env.OPENAI_API_KEY
  try {
    delete process.env.OPENAI_API_KEY
    assert.equal(createAIProvider(), null)

    process.env.OPENAI_API_KEY = 'your_openai_api_key'
    assert.equal(createAIProvider(), null)

    process.env.OPENAI_API_KEY = 'sk-test-real-key'
    assert.ok(createAIProvider())
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = original
  }
})
