import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ASSESSMENT_SCALES,
  ENDING_AGE,
  EVENTS,
  assessRisk,
  calcEventWeight,
  canTriggerEvent,
  detectTheme,
  getEventsByStage,
  getLifeStage,
  isAssessmentComplete,
  isOptionUnlocked,
  isStandardEvent,
  needsBreather,
  needsInsightAfterLow,
  pickEventForPlayer,
  scoreAssessment,
  type EventType,
  type GameEvent,
  type HistoryRecord,
  type PlayerState,
  type StoryOption,
} from '../src/index.js'

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player-test',
    name: '测试',
    age: 20,
    stage: getLifeStage(20),
    attributes: {
      intelligence: 50,
      physique: 50,
      charm: 50,
      wealth: 50,
      luck: 50,
      resilience: 50,
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

function record(eventId: string, eventType: EventType = 'normal'): HistoryRecord {
  return {
    age: 10,
    eventId,
    eventTitle: eventId,
    eventType,
    selectedOptionId: 'opt',
    selectedOptionText: '选择',
    attributeChanges: {},
    psychologyHint: '',
  }
}

function makeEvent(id: string): GameEvent {
  return {
    id,
    type: 'normal',
    stage: 'any',
    title: id,
    story: 'story',
    options: [
      { id: `${id}-a`, text: 'A', type: 'safe', effect: {} },
      { id: `${id}-b`, text: 'B', type: 'growth', effect: {} },
    ],
    psychologyHint: 'hint',
  }
}

test('事件库：id 唯一、字段完整、低谷事件都有成长出口', () => {
  const ids = new Set<string>()
  for (const event of EVENTS) {
    assert.equal(ids.has(event.id), false, `重复事件 id: ${event.id}`)
    ids.add(event.id)

    assert.ok(event.title.trim().length > 0, `${event.id} 缺少标题`)
    assert.ok(event.story.trim().length > 0, `${event.id} 缺少故事`)
    assert.ok(event.psychologyHint.trim().length > 0, `${event.id} 缺少心理提示`)
    assert.ok(event.options.length >= 2, `${event.id} 选项太少`)

    const optionIds = new Set<string>()
    for (const option of event.options) {
      assert.equal(optionIds.has(option.id), false, `${event.id} 选项 id 重复: ${option.id}`)
      optionIds.add(option.id)
      assert.ok(option.text.trim().length > 0, `${event.id}/${option.id} 缺少文案`)
    }

    if (event.type === 'low') {
      const positiveExit = event.options.some(
        (option) =>
          !option.hidden && ['growth', 'meaning', 'acceptance', 'relationship'].includes(option.type)
      )
      assert.ok(positiveExit, `低谷事件 ${event.id} 没有成长/接纳/关系型出口`)
    }

    if (event.triggerCondition?.minAge !== undefined && event.triggerCondition.maxAge !== undefined) {
      assert.ok(
        event.triggerCondition.minAge <= event.triggerCondition.maxAge,
        `${event.id} 年龄区间写反了`
      )
    }
  }
})

test('量表：稀疏答案不会被误判为已完成', () => {
  const phq9 = ASSESSMENT_SCALES.phq9
  assert.equal(isAssessmentComplete('phq9', []), false)

  // 只答了第 9 题：length === 9 但有空洞，必须判为未完成
  const sparse = new Array(phq9.itemCount)
  sparse[phq9.crisisItemIndex!] = 1
  assert.equal(isAssessmentComplete('phq9', sparse), false)

  assert.equal(isAssessmentComplete('phq9', new Array(phq9.itemCount).fill(0)), true)
  assert.equal(isAssessmentComplete('phq9', new Array(phq9.itemCount).fill(4)), false)
})

test('量表：计分、分级与危机题标记', () => {
  const zero = scoreAssessment('phq9', new Array(9).fill(0))
  assert.equal(zero.totalScore, 0)
  assert.equal(zero.severity, 'minimal')
  assert.equal(zero.crisisFlag, false)

  const severeAnswers = new Array(9).fill(3)
  const severe = scoreAssessment('phq9', severeAnswers)
  assert.equal(severe.totalScore, 27)
  assert.equal(severe.maxScore, 27)
  assert.equal(severe.severity, 'severe')
  assert.equal(severe.crisisFlag, true)

  const gad = scoreAssessment('gad7', new Array(7).fill(2))
  assert.equal(gad.totalScore, 14)
  assert.equal(gad.severity, 'moderate')
})

test('风险分级：量表、文本与低谷密度分级正确', () => {
  assert.equal(assessRisk({}).level, 'none')

  const item9 = assessRisk({ phq9Item9Score: 1 })
  assert.equal(item9.level, 'high')
  assert.equal(item9.blockNarrative, true)

  const text = assessRisk({ freeText: ['我不想活了'] })
  assert.equal(text.level, 'high')
  assert.equal(text.blockNarrative, true)

  const mediumStreak = assessRisk({ recentLowStreak: 3 })
  assert.equal(mediumStreak.level, 'medium')
  assert.equal(mediumStreak.blockNarrative, false)
  assert.equal(mediumStreak.needsSupport, true)
})

test('心理急救：低谷-顿悟-低谷之后会触发喘息事件', () => {
  assert.equal(needsBreather(makePlayer({ history: [record('a', 'low')] })), false)

  const pattern = makePlayer({
    history: [record('a', 'low'), record('b', 'insight'), record('c', 'low')],
  })
  assert.equal(needsInsightAfterLow(pattern), true)
  assert.equal(needsBreather(pattern), true)

  const justBreathed = makePlayer({
    history: [
      record('a', 'low'),
      record('b', 'insight'),
      record('c', 'low'),
      record('d', 'breather'),
    ],
  })
  assert.equal(needsBreather(justBreathed), false, '刚喘息过不应该连续再次打断')
})

test('事件挑选：优先未经历过的事件，池耗尽后才重复', () => {
  const a = makeEvent('event-a')
  const b = makeEvent('event-b')
  const seenA = makePlayer({ history: [record('event-a')] })

  for (let i = 0; i < 20; i += 1) {
    assert.equal(pickEventForPlayer(seenA, [a, b])?.id, 'event-b')
  }

  const seenAll = makePlayer({ history: [record('event-a'), record('event-b')] })
  const repeated = pickEventForPlayer(seenAll, [a, b])
  assert.ok(repeated && ['event-a', 'event-b'].includes(repeated.id))

  const forced = pickEventForPlayer(seenAll, [a, b], { allowRepeats: true })
  assert.ok(forced)
})

test('普通事件池不包含顿悟与喘息', () => {
  const pool = getEventsByStage('youth').filter(isStandardEvent)
  assert.ok(pool.length > 0)
  assert.ok(pool.every((event) => event.type !== 'insight' && event.type !== 'breather'))
  assert.equal(EVENTS.filter(isStandardEvent).length < EVENTS.length, true)
})

test('隐藏选项：按属性、韧性与天赋解锁', () => {
  const hidden: StoryOption = {
    id: 'opt-hidden',
    text: '隐藏选项',
    type: 'growth',
    hidden: true,
    unlockCondition: { minAttributes: { intelligence: 70 }, minResilience: 70 },
    effect: {},
  }
  const low = makePlayer({ attributes: { ...makePlayer().attributes, intelligence: 60 } })
  assert.equal(isOptionUnlocked(low, hidden), false)

  const high = makePlayer({
    attributes: { ...makePlayer().attributes, intelligence: 80 },
    resilience: 80,
  })
  assert.equal(isOptionUnlocked(high, hidden), true)

  const talent: StoryOption = {
    id: 'opt-talent',
    text: '天赋选项',
    type: 'meaning',
    hidden: true,
    unlockCondition: { hasTalent: 'artistic-soul' },
    effect: {},
  }
  assert.equal(isOptionUnlocked(high, talent), false)
  assert.equal(
    isOptionUnlocked(
      makePlayer({
        talents: [
          {
            id: 'artistic-soul',
            name: '艺术灵魂',
            description: '',
            type: 'special',
            effect: {},
          },
        ],
      }),
      talent
    ),
    true
  )
})

test('主线检测：连续关系型选择会走向社会服务线', () => {
  const history = [
    { ...record('a'), selectedOptionType: 'relationship' as const },
    { ...record('b'), selectedOptionType: 'relationship' as const },
    { ...record('c'), selectedOptionType: 'relationship' as const },
  ]
  assert.equal(detectTheme(makePlayer({ history })), 'social')
})

test('事件权重：天赋写明的解锁事件会被加权', () => {
  const event = makeEvent('event-special')
  const plain = makePlayer()
  const talented = makePlayer({
    talents: [
      {
        id: 'fated',
        name: '命中贵人',
        description: '',
        type: 'special',
        effect: { unlockEventIds: ['event-special'] },
      },
    ],
  })
  assert.ok(calcEventWeight(talented, event) > calcEventWeight(plain, event))
})

test('触发条件与阶段：any 事件对所有阶段可用', () => {
  const child = makePlayer({ age: 8, stage: 'childhood' })
  const anyEvent = getEventsByStage('childhood').find((event) => event.stage === 'any')
  assert.ok(anyEvent)
  assert.equal(canTriggerEvent(child, anyEvent!), true)

  assert.equal(getLifeStage(12), 'childhood')
  assert.equal(getLifeStage(13), 'adolescence')
  assert.equal(getLifeStage(36), 'middleAge')
  assert.equal(getLifeStage(56), 'oldAge')
})

test('结局年龄与阶段边界一致', () => {
  assert.ok(ENDING_AGE >= 80)
  assert.equal(getLifeStage(ENDING_AGE), 'oldAge')
})
