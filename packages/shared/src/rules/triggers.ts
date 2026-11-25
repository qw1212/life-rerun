import type { GameEvent, PlayerState, StoryOption } from '../types/game.js'

function meetsMinAttributes(
  player: PlayerState,
  minAttributes?: Partial<Record<keyof PlayerState['attributes'], number>>
): boolean {
  if (!minAttributes) return true
  return Object.entries(minAttributes).every(([key, value]) => {
    return value === undefined || player.attributes[key as keyof PlayerState['attributes']] >= value
  })
}

function meetsMaxAttributes(
  player: PlayerState,
  maxAttributes?: Partial<Record<keyof PlayerState['attributes'], number>>
): boolean {
  if (!maxAttributes) return true
  return Object.entries(maxAttributes).every(([key, value]) => {
    return value === undefined || player.attributes[key as keyof PlayerState['attributes']] <= value
  })
}

function hasRequiredTalents(player: PlayerState, requiredTalents?: string[]): boolean {
  if (!requiredTalents || requiredTalents.length === 0) return true
  const playerTalentIds = new Set(player.talents.map((t) => t.id))
  return requiredTalents.every((id) => playerTalentIds.has(id))
}

function hasRequiredEvents(player: PlayerState, requiredEvents?: string[]): boolean {
  if (!requiredEvents || requiredEvents.length === 0) return true
  const playerEventIds = new Set(player.history.map((h) => h.eventId))
  return requiredEvents.every((id) => playerEventIds.has(id))
}

function hasExcludedEvents(player: PlayerState, excludedEvents?: string[]): boolean {
  if (!excludedEvents || excludedEvents.length === 0) return false
  const playerEventIds = new Set(player.history.map((h) => h.eventId))
  return excludedEvents.some((id) => playerEventIds.has(id))
}

function meetsAgeCondition(player: PlayerState, event: GameEvent): boolean {
  const minAge = event.triggerCondition?.minAge ?? 0
  const maxAge = event.triggerCondition?.maxAge ?? 999
  return player.age >= minAge && player.age <= maxAge
}

function meetsStageCondition(player: PlayerState, event: GameEvent): boolean {
  if (event.stage === 'any') return true
  return player.stage === event.stage
}

/**
 * 检查事件是否满足基础触发条件（不考虑随机概率）
 */
export function canTriggerEvent(player: PlayerState, event: GameEvent): boolean {
  const tc = event.triggerCondition
  return (
    meetsStageCondition(player, event) &&
    meetsAgeCondition(player, event) &&
    meetsMinAttributes(player, tc?.minAttributes) &&
    meetsMaxAttributes(player, tc?.maxAttributes) &&
    hasRequiredTalents(player, tc?.requiredTalents) &&
    hasRequiredEvents(player, tc?.requiredEvents) &&
    !hasExcludedEvents(player, tc?.excludedEvents) &&
    (tc?.theme === undefined || player.theme === tc.theme)
  )
}

/** 玩家是否已经历过某个事件 */
export function hasSeenEvent(player: PlayerState, eventId: string): boolean {
  return player.history.some((record) => record.eventId === eventId)
}

/**
 * 是否可以作为「普通推进」事件抽取。
 *
 * 顿悟与喘息只能由心理急救链路（低谷之后 / 近期低谷密集）触发。
 * 如果把它们混进普通事件池，玩家会在没有任何挫折时突然「顿悟」，
 * 心理设计就失真了。
 */
export function isStandardEvent(event: GameEvent): boolean {
  return event.type !== 'insight' && event.type !== 'breather'
}

/**
 * 计算事件触发权重（运气加权 + 主线匹配加权 + 天赋解锁加权）
 */
export function calcEventWeight(player: PlayerState, event: GameEvent): number {
  const baseProbability = event.triggerCondition?.probability ?? 1
  const luckWeight = event.triggerCondition?.luckWeight ?? 0
  const luck = Math.max(0, player.attributes.luck)
  const themeBonus =
    player.theme !== 'undecided' && event.triggerCondition?.theme === player.theme ? 1.5 : 0
  // 特殊天赋写明了「解锁某段剧情」时，让它真正更容易出现，而不是只写在描述里
  const talentBonus = player.talents.some((talent) =>
    talent.effect.unlockEventIds?.includes(event.id)
  )
    ? 2
    : 0
  return Math.max(0, baseProbability + (luck / 100) * luckWeight + themeBonus + talentBonus)
}

/**
 * 检查隐藏选项是否解锁
 */
export function isOptionUnlocked(player: PlayerState, option: StoryOption): boolean {
  if (!option.hidden) return true
  const cond = option.unlockCondition
  if (!cond) return true
  if (cond.minAttributes) {
    for (const [key, value] of Object.entries(cond.minAttributes)) {
      if (value !== undefined && player.attributes[key as keyof PlayerState['attributes']] < value) {
        return false
      }
    }
  }
  if (cond.hasTalent && !player.talents.some((t) => t.id === cond.hasTalent)) return false
  if (cond.hasEvent && !player.history.some((h) => h.eventId === cond.hasEvent)) return false
  if (cond.minResilience !== undefined && player.resilience < cond.minResilience) return false
  return true
}

/**
 * 从候选事件中按权重随机选择一个
 */
export function pickWeightedEvent(candidates: GameEvent[], weights: number[]): GameEvent | null {
  if (candidates.length === 0) return null
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return candidates[0]
  let random = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i]
    if (random <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

export interface PickEventOptions {
  /**
   * 允许重复已经历过的事件。
   * 心理急救（喘息/顿悟）必须允许重复：如果连一个未触发过的支持事件都没有，
   * 玩家会被卡在低谷里没有任何缓冲。
   */
  allowRepeats?: boolean
}

/**
 * 挑选下一个事件。
 *
 * 默认优先挑选玩家没经历过的事件，只有当候选池全部经历过时才允许重复，
 * 否则 80 年人生里同一个故事会反复出现，叙事体验会迅速崩坏。
 */
export function pickEventForPlayer(
  player: PlayerState,
  candidates: GameEvent[],
  options: PickEventOptions = {}
): GameEvent | null {
  const eligible = candidates.filter((event) => canTriggerEvent(player, event))
  if (eligible.length === 0) return null

  if (options.allowRepeats) {
    return pickWeightedEvent(
      eligible,
      eligible.map((event) => calcEventWeight(player, event))
    )
  }

  const unseen = eligible.filter((event) => !hasSeenEvent(player, event.id))
  const pool = unseen.length > 0 ? unseen : eligible
  return pickWeightedEvent(
    pool,
    pool.map((event) => calcEventWeight(player, event))
  )
}

/**
 * 心理急救：近期低谷密集时强制插入喘息事件。
 *
 * 注意不能用「连续 3 个低谷」作为条件：低谷之后一定会插入顿悟事件，
 * 历史记录里永远不可能出现 3 个连续低谷，那条判断实际上永远不会生效。
 * 这里改为「最近 4 段人生里出现 2 次低谷」，并把刚喘息过的情况排除，
 * 避免喘息事件自己把自己再次触发。
 */
export function needsBreather(
  player: PlayerState,
  options: { lookback?: number; threshold?: number } = {}
): boolean {
  const lookback = options.lookback ?? 4
  const threshold = options.threshold ?? 2
  const recent = player.history.slice(-lookback)
  if (recent.length < threshold) return false
  const last = recent[recent.length - 1]
  if (last?.eventType === 'breather') return false
  return recent.filter((record) => record.eventType === 'low').length >= threshold
}

/**
 * 统计玩家最近连续的低谷事件数（从最新一条往前数）。
 */
export function countRecentLowStreak(player: PlayerState): number {
  let streak = 0
  for (let i = player.history.length - 1; i >= 0; i -= 1) {
    if (player.history[i].eventType === 'low') streak += 1
    else break
  }
  return streak
}

/**
 * 检查是否需要触发低谷后的顿悟事件
 */
export function needsInsightAfterLow(player: PlayerState): boolean {
  const lastRecord = player.history[player.history.length - 1]
  if (!lastRecord) return false
  return lastRecord.eventType === 'low'
}
