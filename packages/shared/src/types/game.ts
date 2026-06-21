/**
 * 玩家六维属性
 */
export interface Attributes {
  intelligence: number // 智力
  physique: number // 体质
  charm: number // 魅力
  wealth: number // 家境
  luck: number // 运气
  resilience: number // 心理韧性
}

export type AttributeKey = keyof Attributes

/**
 * PERMA 积极心理学五维
 */
export interface Perma {
  positive: number // 积极情绪
  engagement: number // 投入
  relationships: number // 人际关系
  meaning: number // 意义
  achievement: number // 成就
}

/**
 * 情绪标签
 */
export type EmotionTag =
  | '平静'
  | '期待'
  | '焦虑'
  | '喜悦'
  | '失落'
  | '愤怒'
  | '感恩'
  | '孤独'
  | '希望'
  | '疲惫'

/**
 * 年龄阶段
 */
export type LifeStage = 'childhood' | 'adolescence' | 'youth' | 'middleAge' | 'oldAge'

export interface AgeRange {
  min: number
  max: number
}

export const LIFE_STAGES: Record<LifeStage, { label: string; range: AgeRange; pace: 'fast' | 'medium' | 'slow' }> = {
  childhood: { label: '童年', range: { min: 0, max: 12 }, pace: 'fast' },
  adolescence: { label: '青少年', range: { min: 13, max: 18 }, pace: 'medium' },
  youth: { label: '青年', range: { min: 19, max: 35 }, pace: 'slow' },
  middleAge: { label: '中年', range: { min: 36, max: 55 }, pace: 'medium' },
  oldAge: { label: '老年', range: { min: 56, max: 100 }, pace: 'fast' },
}

export function getLifeStage(age: number): LifeStage {
  if (age <= 12) return 'childhood'
  if (age <= 18) return 'adolescence'
  if (age <= 35) return 'youth'
  if (age <= 55) return 'middleAge'
  return 'oldAge'
}

/**
 * 人生主题 / 主线分支
 */
export type LifeTheme =
  | 'academic' // 学术线
  | 'startup' // 创业线
  | 'art' // 艺术线
  | 'social' // 社会服务线
  | 'ordinary' // 平凡幸福线
  | 'undecided' // 未确定

export interface ThemeMeta {
  label: string
  description: string
  keyAttributes: AttributeKey[]
}

export const THEME_META: Record<LifeTheme, ThemeMeta> = {
  academic: {
    label: '学术探索',
    description: '在知识的海洋中寻找真理与自我',
    keyAttributes: ['intelligence', 'resilience'],
  },
  startup: {
    label: '创业征程',
    description: '在不确定中创造属于自己的价值',
    keyAttributes: ['intelligence', 'luck', 'wealth'],
  },
  art: {
    label: '艺术人生',
    description: '用创造表达内心，让世界看见你的光',
    keyAttributes: ['charm', 'intelligence'],
  },
  social: {
    label: '社会服务',
    description: '在帮助他人中找到生命的意义',
    keyAttributes: ['charm', 'resilience'],
  },
  ordinary: {
    label: '平凡幸福',
    description: '在日常点滴中收集温暖与满足',
    keyAttributes: ['resilience', 'charm'],
  },
  undecided: {
    label: '尚未确定',
    description: '人生的方向还在展开中',
    keyAttributes: ['luck', 'resilience'],
  },
}

/**
 * 选项类型：代表不同价值观与心理策略
 */
export type OptionType =
  | 'safe' // 稳妥型
  | 'adventure' // 冒险型
  | 'relationship' // 关系型
  | 'growth' // 成长型
  | 'acceptance' // 接纳型
  | 'meaning' // 意义型

export interface OptionEffect {
  attributes?: Partial<Record<AttributeKey, number>>
  perma?: Partial<Perma>
  resilience?: number
  theme?: LifeTheme
  unlockTalent?: string
  addTag?: EmotionTag
  removeTag?: EmotionTag
  addHelper?: Helper
}

export interface StoryOption {
  id: string
  text: string
  type: OptionType
  hidden?: boolean
  unlockCondition?: {
    minAttributes?: Partial<Record<AttributeKey, number>>
    hasTalent?: string
    hasEvent?: string
    minResilience?: number
  }
  effect: OptionEffect
  preview?: string
}

/**
 * 事件模板
 */
export type EventType =
  | 'normal' // 普通事件
  | 'highlight' // 高光/爽文事件
  | 'low' // 低谷事件
  | 'insight' // 顿悟事件
  | 'breather' // 喘息/支持事件
  | 'milestone' // 人生节点事件

export interface GameEvent {
  id: string
  type: EventType
  stage: LifeStage | 'any'
  title: string
  story: string
  options: StoryOption[]
  psychologyHint: string
  permaTags?: Partial<Perma>
  triggerCondition?: {
    minAge?: number
    maxAge?: number
    minAttributes?: Partial<Record<AttributeKey, number>>
    maxAttributes?: Partial<Record<AttributeKey, number>>
    requiredTalents?: string[]
    requiredEvents?: string[]
    excludedEvents?: string[]
    probability?: number // 基础概率
    luckWeight?: number // 运气加权
    theme?: LifeTheme
  }
  followUp?: {
    eventId: string
    delay: number // 几年后触发
  }
}

/**
 * 天赋
 */
export type TalentType = 'normal' | 'special' | 'psychology'

export interface Talent {
  id: string
  name: string
  description: string
  type: TalentType
  effect: {
    attributes?: Partial<Record<AttributeKey, number>>
    resilienceBonus?: number
    unlockTheme?: LifeTheme
    unlockEventIds?: string[]
    specialAbility?: string
  }
}

/**
 * 贵人
 */
export type HelperRole = 'mentor' | 'friend' | 'partner' | 'stranger'

export interface Helper {
  id: string
  name: string
  role: HelperRole
  description: string
  unlockEventIds: string[]
}

/**
 * 玩家状态
 */
export interface PlayerState {
  id: string
  name: string
  age: number
  stage: LifeStage
  attributes: Attributes
  perma: Perma
  resilience: number // 当前心理韧性（0-100）
  emotionTags: EmotionTag[]
  talents: Talent[]
  theme: LifeTheme
  helpers: Helper[]
  history: HistoryRecord[]
  gratitudeLog: string[]
  createdAt: string
  updatedAt: string
}

export interface HistoryRecord {
  age: number
  eventId: string
  eventTitle: string
  eventType: EventType
  selectedOptionId: string
  selectedOptionText: string
  selectedOptionType?: OptionType
  attributeChanges: Partial<Record<AttributeKey, number>>
  psychologyHint: string
  reflection?: string
}

/**
 * 叙事请求 / 响应
 */
export interface NarrativeRequest {
  player: PlayerState
  currentEvent?: GameEvent
}

export interface NarrativeResponse {
  story: string
  options: StoryOption[]
  psychologyHint: string
  attributeChanges?: Partial<Record<AttributeKey, number>>
  permaChanges?: Partial<Perma>
}

/**
 * 结局
 */
export interface Ending {
  title: string
  summary: string
  achievement: string
  growthReport: string
  permaRadar: Perma
  keptQuality: string
  lifeBook: string
}

/**
 * 存档
 */
export interface SaveSlot {
  id: string
  name: string
  player: PlayerState
  savedAt: string
}
