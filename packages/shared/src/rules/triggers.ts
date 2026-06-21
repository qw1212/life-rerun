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

/**
 * 计算事件触发权重（运气加权 + 主线匹配加权）
 */
export function calcEventWeight(player: PlayerState, event: GameEvent): number {
  const baseProbability = event.triggerCondition?.probability ?? 1
  const luckWeight = event.triggerCondition?.luckWeight ?? 0
  const luck = Math.max(0, player.attributes.luck)
  const themeBonus =
    player.theme !== 'undecided' && event.triggerCondition?.theme === player.theme ? 1.5 : 0
  return baseProbability + (luck / 100) * luckWeight + themeBonus
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
  let random = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i]
    if (random <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

/**
 * 心理急救：连续低谷后强制插入喘息事件
 */
export function needsBreather(player: PlayerState, recentCount = 3): boolean {
  const recent = player.history.slice(-recentCount)
  if (recent.length < recentCount) return false
  return recent.every((h) => h.eventType === 'low')
}

/**
 * 检查是否需要触发低谷后的顿悟事件
 */
export function needsInsightAfterLow(player: PlayerState): boolean {
  const lastRecord = player.history[player.history.length - 1]
  if (!lastRecord) return false
  return lastRecord.eventType === 'low'
}
