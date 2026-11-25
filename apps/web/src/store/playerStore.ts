import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ENDING_AGE,
  detectTheme,
  drawTalents,
  getLifeStage,
  getTalentById,
  type AssessmentResult,
  type Attributes,
  type EmotionTag,
  type EventType,
  type GameEvent,
  type Helper,
  type HistoryRecord,
  type LifeTheme,
  type Perma,
  type PlayerState,
  type RiskAssessment,
  type StoryOption,
  type Talent,
} from '@life-rerun/shared'
import {
  applyAttributeChanges,
  applyPermaChanges,
  applyTalentEffects,
  calcResilienceRecovery,
  clamp,
  derivePermaChanges,
  getInitialAttributes,
  getInitialPerma,
  getInitialResilience,
} from '../utils/balance.js'

export interface SaveSlotSummary {
  name: string
  playerName: string
  age: number
  savedAt: string
}

export interface ImportResult {
  ok: boolean
  message: string
}

interface StoredSlot {
  player: PlayerState
  savedAt: string
  /** 存档时一并保存，避免读取旧人生后沿用另一个人生的量表与结局选择 */
  assessments?: AssessmentResult[]
  keptQuality?: string | null
}

interface PlayerStore {
  player: PlayerState | null
  currentEvent: GameEvent | null
  gratitudeInput: string
  isGameOver: boolean
  keptQuality: string | null

  // 心理评估与危机干预
  assessments: AssessmentResult[]
  acknowledgedRiskSignature: string | null
  submitAssessment: (result: AssessmentResult) => void
  acknowledgeCrisis: (risk: RiskAssessment) => void

  // 角色创建
  createPlayer: (name: string, selectedTalents?: Talent[], initialMood?: string) => void

  // 游戏推进
  setCurrentEvent: (event: GameEvent | null) => void
  selectOption: (option: StoryOption, event: GameEvent) => void
  addGratitude: () => void
  setGratitudeInput: (value: string) => void
  nextYear: () => void
  setKeptQuality: (quality: string | null) => void

  // 存档
  listSlots: () => SaveSlotSummary[]
  saveSlot: (slotName: string) => boolean
  loadSlotByName: (slotName: string) => boolean
  deleteSlot: (slotName: string) => boolean
  loadSlot: (savedPlayer: PlayerState) => void
  importLifeBook: (raw: string) => ImportResult
  exportLifeBook: () => string
  resetGame: () => void
}

const STORAGE_KEY = 'life-rerun-player'
const SLOTS_KEY = 'life-rerun-slots'
const LIFE_BOOK_VERSION = 2
const MAX_SLOT_NAME_LENGTH = 20

const EVENT_TYPES: EventType[] = ['normal', 'highlight', 'low', 'insight', 'breather', 'milestone']
const OPTION_TYPES: StoryOption['type'][] = [
  'safe',
  'adventure',
  'relationship',
  'growth',
  'acceptance',
  'meaning',
]
const LIFE_THEMES: LifeTheme[] = [
  'academic',
  'startup',
  'art',
  'social',
  'ordinary',
  'undecided',
]
const HELPER_ROLES: Helper['role'][] = ['mentor', 'friend', 'partner', 'stranger']

/** crypto.randomUUID 只在安全上下文可用，局域网 HTTP 调试时必须能降级。 */
export function generateId(prefix = 'id'): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    try {
      return cryptoApi.randomUUID()
    } catch {
      // 某些内嵌浏览器会抛错，继续走降级分支
    }
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLifeTheme(value: unknown): value is LifeTheme {
  return typeof value === 'string' && (LIFE_THEMES as string[]).includes(value)
}

function isEventType(value: unknown): value is EventType {
  return typeof value === 'string' && (EVENT_TYPES as string[]).includes(value)
}

function isOptionType(value: unknown): value is StoryOption['type'] {
  return typeof value === 'string' && (OPTION_TYPES as string[]).includes(value)
}

function isHelperRole(value: unknown): value is Helper['role'] {
  return typeof value === 'string' && (HELPER_ROLES as string[]).includes(value)
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, 0, 100) : fallback
}

function readText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

/**
 * 风险依据签名：用于判断「用户是否已阅读过当前这组风险提示」。
 */
export function getRiskSignature(risk: RiskAssessment | null): string | null {
  if (!risk || risk.reasons.length === 0) return null
  return risk.reasons.join('|')
}

function readSlots(): Record<string, StoredSlot> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}')
    if (!isRecord(parsed)) return {}
    const slots: Record<string, StoredSlot> = {}
    for (const [name, value] of Object.entries(parsed)) {
      if (!isRecord(value)) continue
      // 兼容旧格式：早期版本把 PlayerState 直接存在槽位里
      const candidate = 'player' in value ? value.player : value
      const player = normalizeImportedPlayer(candidate)
      if (!player) continue
      slots[name] = {
        player,
        savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString(),
        assessments: Array.isArray(value.assessments)
          ? value.assessments.filter(isAssessmentResult).slice(-4)
          : undefined,
        keptQuality: typeof value.keptQuality === 'string' ? value.keptQuality : null,
      }
    }
    return slots
  } catch {
    return {}
  }
}

function writeSlots(slots: Record<string, StoredSlot>): boolean {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots))
    return true
  } catch {
    return false
  }
}

export function getSaveSlots(): SaveSlotSummary[] {
  return Object.entries(readSlots())
    .map(([name, slot]) => ({
      name,
      playerName: slot.player.name,
      age: slot.player.age,
      savedAt: slot.savedAt,
    }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

function normalizeHistoryRecord(value: unknown): HistoryRecord | null {
  if (!isRecord(value)) return null
  const eventTitle = readText(value.eventTitle, 120)
  if (!eventTitle) return null

  const attributeChanges: Partial<Record<keyof Attributes, number>> = {}
  if (isRecord(value.attributeChanges)) {
    for (const key of Object.keys(getInitialAttributes()) as (keyof Attributes)[]) {
      const amount = value.attributeChanges[key]
      if (typeof amount === 'number' && Number.isFinite(amount)) {
        attributeChanges[key] = amount
      }
    }
  }

  return {
    age: typeof value.age === 'number' ? clamp(Math.round(value.age), 0, 120) : 0,
    eventId: readText(value.eventId, 80) || 'unknown-event',
    eventTitle,
    eventType: isEventType(value.eventType) ? value.eventType : 'normal',
    selectedOptionId: readText(value.selectedOptionId, 80) || 'unknown-option',
    selectedOptionText: readText(value.selectedOptionText, 200) || '（未记录）',
    ...(isOptionType(value.selectedOptionType)
      ? { selectedOptionType: value.selectedOptionType }
      : {}),
    attributeChanges,
    psychologyHint: readText(value.psychologyHint, 200),
    ...(typeof value.reflection === 'string' ? { reflection: value.reflection.slice(0, 500) } : {}),
  }
}

function normalizeTalent(value: unknown): Talent | null {
  if (!isRecord(value)) return null
  const id = readText(value.id, 60)
  const name = readText(value.name, 40)
  if (!id || !name) return null

  const effectRaw = isRecord(value.effect) ? value.effect : {}
  const effect: Talent['effect'] = {}

  if (isRecord(effectRaw.attributes)) {
    const attributes: Partial<Record<keyof Attributes, number>> = {}
    for (const key of Object.keys(getInitialAttributes()) as (keyof Attributes)[]) {
      const amount = effectRaw.attributes[key]
      if (typeof amount === 'number' && Number.isFinite(amount)) attributes[key] = amount
    }
    if (Object.keys(attributes).length > 0) effect.attributes = attributes
  }
  if (typeof effectRaw.resilienceBonus === 'number' && Number.isFinite(effectRaw.resilienceBonus)) {
    effect.resilienceBonus = effectRaw.resilienceBonus
  }
  if (isLifeTheme(effectRaw.unlockTheme)) effect.unlockTheme = effectRaw.unlockTheme
  if (Array.isArray(effectRaw.unlockEventIds)) {
    effect.unlockEventIds = effectRaw.unlockEventIds.filter(
      (eventId): eventId is string => typeof eventId === 'string'
    )
  }

  return {
    id,
    name,
    description: readText(value.description, 160),
    type:
      value.type === 'special' || value.type === 'psychology' || value.type === 'normal'
        ? value.type
        : 'normal',
    effect,
  }
}

function normalizeHelper(value: unknown): Helper | null {
  if (!isRecord(value)) return null
  const id = readText(value.id, 60)
  const name = readText(value.name, 40)
  if (!id || !name) return null
  return {
    id,
    name,
    role: isHelperRole(value.role) ? value.role : 'stranger',
    description: readText(value.description, 200),
    unlockEventIds: Array.isArray(value.unlockEventIds)
      ? value.unlockEventIds.filter((eventId): eventId is string => typeof eventId === 'string')
      : [],
  }
}

/**
 * 把外部 JSON（导入的人生之书 / 旧版本存档）规范成可用的 PlayerState。
 * 缺字段一律补默认值，坏字段直接忽略，避免一个字段异常让整个读档崩掉。
 */
function normalizeImportedPlayer(value: unknown): PlayerState | null {
  if (!isRecord(value)) return null
  const name = readText(value.name, 24)
  if (!name || typeof value.age !== 'number' || !Number.isFinite(value.age)) return null

  const age = clamp(Math.round(value.age), 0, 120)
  const attributes = getInitialAttributes()
  if (isRecord(value.attributes)) {
    for (const key of Object.keys(attributes) as (keyof Attributes)[]) {
      attributes[key] = readNumber(value.attributes[key], attributes[key])
    }
  }

  const perma = getInitialPerma()
  if (isRecord(value.perma)) {
    for (const key of Object.keys(perma) as (keyof Perma)[]) {
      perma[key] = readNumber(value.perma[key], perma[key])
    }
  }

  const talents = Array.isArray(value.talents)
    ? value.talents
        .map(normalizeTalent)
        .filter((talent): talent is Talent => talent !== null)
        .slice(0, 10)
    : []

  const emotionTags = Array.isArray(value.emotionTags)
    ? (value.emotionTags.filter((tag) => typeof tag === 'string').slice(0, 3) as EmotionTag[])
    : []

  return {
    id: readText(value.id, 80) || generateId('player'),
    name,
    age,
    stage: getLifeStage(age),
    attributes,
    perma,
    resilience: readNumber(value.resilience, getInitialResilience(talents)),
    emotionTags: emotionTags.length > 0 ? emotionTags : ['平静'],
    talents,
    theme: isLifeTheme(value.theme) ? value.theme : 'undecided',
    helpers: Array.isArray(value.helpers)
      ? value.helpers
          .map(normalizeHelper)
          .filter((helper): helper is Helper => helper !== null)
          .slice(0, 10)
      : [],
    history: Array.isArray(value.history)
      ? value.history
          .map(normalizeHistoryRecord)
          .filter((record): record is HistoryRecord => record !== null)
          .slice(-100)
      : [],
    gratitudeLog: Array.isArray(value.gratitudeLog)
      ? value.gratitudeLog
          .filter((entry) => typeof entry === 'string')
          .map((entry) => entry.slice(0, 200))
          .slice(-20)
      : [],
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function isAssessmentResult(value: unknown): value is AssessmentResult {
  return (
    isRecord(value) &&
    (value.scale === 'phq9' || value.scale === 'gad7') &&
    (value.phase === 'pre' || value.phase === 'post') &&
    Array.isArray(value.answers) &&
    typeof value.totalScore === 'number' &&
    typeof value.maxScore === 'number' &&
    typeof value.severity === 'string' &&
    typeof value.severityLabel === 'string'
  )
}

function createInitialPlayer(name: string, talents: Talent[], initialMood?: string): PlayerState {
  const now = new Date().toISOString()
  const attributes = applyTalentEffects(getInitialAttributes(), talents)
  return {
    id: generateId('player'),
    name,
    age: 6,
    stage: 'childhood',
    attributes,
    perma: getInitialPerma(),
    resilience: getInitialResilience(talents),
    emotionTags: [(initialMood || '期待') as EmotionTag],
    talents,
    theme: 'undecided',
    helpers: [],
    history: [],
    gratitudeLog: [],
    createdAt: now,
    updatedAt: now,
  }
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      player: null,
      currentEvent: null,
      gratitudeInput: '',
      isGameOver: false,
      keptQuality: null,
      assessments: [],
      acknowledgedRiskSignature: null,

      submitAssessment: (result) => {
        const { assessments } = get()
        const others = assessments.filter(
          (a) => !(a.scale === result.scale && a.phase === result.phase)
        )
        set({ assessments: [...others, result] })
      },

      acknowledgeCrisis: (risk) =>
        set({ acknowledgedRiskSignature: getRiskSignature(risk) }),

      createPlayer: (name, selectedTalents, initialMood) => {
        const talents =
          selectedTalents && selectedTalents.length > 0 ? selectedTalents : drawTalents(3)
        const player = createInitialPlayer(name.trim().slice(0, 24), talents, initialMood)
        set({
          player,
          currentEvent: null,
          isGameOver: false,
          gratitudeInput: '',
          keptQuality: null,
          acknowledgedRiskSignature: null,
        })
      },

      setCurrentEvent: (event) => set({ currentEvent: event }),

      selectOption: (option, event) => {
        const { player } = get()
        if (!player) return

        const effect = option.effect
        const attributeChanges = effect.attributes || {}
        // 事件自带的 PERMA 倾向 + 选项类型的默认倾向 + 选项显式声明
        const permaChanges = {
          ...(event.permaTags || {}),
          ...derivePermaChanges(option.type),
          ...(effect.perma || {}),
        }
        const resilienceChange = effect.resilience || 0

        // 选项可以把「隐藏天赋」真正解锁，而不是只写在 effect 里没人处理
        const unlockedTalent = effect.unlockTalent ? getTalentById(effect.unlockTalent) : undefined
        const acquiredTalent =
          unlockedTalent && !player.talents.some((talent) => talent.id === unlockedTalent.id)
            ? unlockedTalent
            : undefined

        const baseAttributes = applyAttributeChanges(player.attributes, attributeChanges)
        const nextAttributes = acquiredTalent
          ? applyTalentEffects(baseAttributes, [acquiredTalent])
          : baseAttributes
        const nextPerma = applyPermaChanges(player.perma, permaChanges)
        // 低谷本身会消耗「情境韧性」，再由选项决定恢复多少。
        // 如果只有正向恢复，这个数值会一路只升不降，心理韧性的设计就失去意义。
        const eventResilienceCost = event.type === 'low' ? -3 : 0

        // 年度恢复只在 nextYear 结算；这里只应用选项与事件本身的即时影响，
        // 否则「选择 + 跨年」双重恢复会让韧性过快封顶。
        const nextResilience = clamp(
          player.resilience +
            resilienceChange +
            eventResilienceCost +
            (acquiredTalent?.effect.resilienceBonus ?? 0),
          0,
          100
        )

        // 情绪标签更新
        const nextEmotionTags = [...player.emotionTags]
        if (effect.removeTag) {
          const idx = nextEmotionTags.indexOf(effect.removeTag)
          if (idx >= 0) nextEmotionTags.splice(idx, 1)
        }
        if (effect.addTag && !nextEmotionTags.includes(effect.addTag)) {
          nextEmotionTags.push(effect.addTag)
        }

        const record: HistoryRecord = {
          age: player.age,
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.type,
          selectedOptionId: option.id,
          selectedOptionText: option.text,
          selectedOptionType: option.type,
          attributeChanges,
          psychologyHint: event.psychologyHint,
        }

        // 主线检测需要包含这一次选择
        const tempPlayer: PlayerState = {
          ...player,
          history: [...player.history, record],
        }
        const nextTheme = detectTheme(tempPlayer)

        const nextHelpers = effect.addHelper
          ? [...player.helpers.filter((helper) => helper.id !== effect.addHelper!.id), effect.addHelper]
          : player.helpers

        set({
          player: {
            ...player,
            attributes: nextAttributes,
            perma: nextPerma,
            resilience: nextResilience,
            emotionTags: nextEmotionTags.slice(0, 3),
            theme: effect.theme || nextTheme,
            talents: acquiredTalent ? [...player.talents, acquiredTalent] : player.talents,
            helpers: nextHelpers,
            history: [...player.history, record],
            updatedAt: new Date().toISOString(),
          },
          currentEvent: null,
        })
      },

      addGratitude: () => {
        const { player, gratitudeInput } = get()
        if (!player) return
        const value = gratitudeInput.trim().slice(0, 120)
        if (!value) return
        set({
          player: {
            ...player,
            gratitudeLog: [...player.gratitudeLog, value].slice(-20),
            updatedAt: new Date().toISOString(),
          },
          gratitudeInput: '',
        })
      },

      setGratitudeInput: (value) => set({ gratitudeInput: value }),

      nextYear: () => {
        const { player, isGameOver } = get()
        if (!player || isGameOver || player.age >= ENDING_AGE) return

        const paceMap: Record<PlayerState['stage'], number> = {
          childhood: 2,
          adolescence: 1,
          youth: 1,
          middleAge: 2,
          oldAge: 3,
        }

        const targetAge = player.age + paceMap[player.stage]
        const nextAge = Math.min(targetAge, ENDING_AGE)

        set({
          player: {
            ...player,
            age: nextAge,
            stage: getLifeStage(nextAge),
            resilience: clamp(player.resilience + calcResilienceRecovery(player), 0, 100),
            updatedAt: new Date().toISOString(),
          },
          currentEvent: null,
          isGameOver: targetAge >= ENDING_AGE,
        })
      },

      setKeptQuality: (quality) => set({ keptQuality: quality }),

      listSlots: () => getSaveSlots(),

      saveSlot: (slotName) => {
        const { player, assessments, keptQuality } = get()
        const name = slotName.trim().slice(0, MAX_SLOT_NAME_LENGTH)
        if (!player || !name) return false
        const slots = readSlots()
        slots[name] = {
          player: JSON.parse(JSON.stringify(player)) as PlayerState,
          savedAt: new Date().toISOString(),
          assessments: JSON.parse(JSON.stringify(assessments)) as AssessmentResult[],
          keptQuality,
        }
        return writeSlots(slots)
      },

      loadSlotByName: (slotName) => {
        const slot = readSlots()[slotName]
        if (!slot) return false
        set({
          player: slot.player,
          assessments: slot.assessments ?? [],
          keptQuality: slot.keptQuality ?? null,
          currentEvent: null,
          isGameOver: slot.player.age >= ENDING_AGE,
          gratitudeInput: '',
          // 换了一段人生，之前的人生里点过「我已了解」不能顺延到这里
          acknowledgedRiskSignature: null,
        })
        return true
      },

      deleteSlot: (slotName) => {
        const slots = readSlots()
        if (!(slotName in slots)) return false
        delete slots[slotName]
        return writeSlots(slots)
      },

      loadSlot: (savedPlayer) => {
        set({
          player: savedPlayer,
          currentEvent: null,
          isGameOver: savedPlayer.age >= ENDING_AGE,
          gratitudeInput: '',
          acknowledgedRiskSignature: null,
        })
      },

      importLifeBook: (raw) => {
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch {
          return { ok: false, message: '文件不是合法的 JSON，请确认导出文件是否完整' }
        }
        if (!isRecord(parsed)) {
          return { ok: false, message: '文件内容不是有效的人生之书' }
        }

        const player = normalizeImportedPlayer('player' in parsed ? parsed.player : parsed)
        if (!player) {
          return { ok: false, message: '没有找到可用的人生存档（缺少名字或年龄）' }
        }

        const assessments = Array.isArray(parsed.assessments)
          ? parsed.assessments.filter(isAssessmentResult).slice(-4)
          : []
        const keptQuality = typeof parsed.keptQuality === 'string' ? parsed.keptQuality : null

        set({
          player,
          assessments,
          keptQuality,
          currentEvent: null,
          isGameOver: player.age >= ENDING_AGE,
          gratitudeInput: '',
          acknowledgedRiskSignature: null,
        })
        return { ok: true, message: `已载入「${player.name}」的人生之书` }
      },

      exportLifeBook: () => {
        const { player, assessments, keptQuality } = get()
        if (!player) return ''
        return JSON.stringify(
          {
            version: LIFE_BOOK_VERSION,
            exportedAt: new Date().toISOString(),
            player,
            assessments,
            keptQuality,
          },
          null,
          2
        )
      },

      resetGame: () => {
        set({
          player: null,
          currentEvent: null,
          isGameOver: false,
          gratitudeInput: '',
          keptQuality: null,
          assessments: [],
          acknowledgedRiskSignature: null,
        })
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // 隐私模式下可能不可写，忽略即可
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        player: state.player,
        currentEvent: state.currentEvent,
        isGameOver: state.isGameOver,
        assessments: state.assessments,
        keptQuality: state.keptQuality,
      }),
    }
  )
)
