import type { Attributes, Perma, PlayerState, OptionType } from '@life-rerun/shared'

export const ATTRIBUTE_MIN = 0
export const ATTRIBUTE_MAX = 100
export const RESILIENCE_MIN = 0
export const RESILIENCE_MAX = 100
export const PERMA_MIN = 0
export const PERMA_MAX = 100

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function clampAttributes(attrs: Attributes): Attributes {
  return {
    intelligence: clamp(attrs.intelligence, ATTRIBUTE_MIN, ATTRIBUTE_MAX),
    physique: clamp(attrs.physique, ATTRIBUTE_MIN, ATTRIBUTE_MAX),
    charm: clamp(attrs.charm, ATTRIBUTE_MIN, ATTRIBUTE_MAX),
    wealth: clamp(attrs.wealth, ATTRIBUTE_MIN, ATTRIBUTE_MAX),
    luck: clamp(attrs.luck, ATTRIBUTE_MIN, ATTRIBUTE_MAX),
    resilience: clamp(attrs.resilience, ATTRIBUTE_MIN, ATTRIBUTE_MAX),
  }
}

export function clampPerma(perma: Perma): Perma {
  return {
    positive: clamp(perma.positive, PERMA_MIN, PERMA_MAX),
    engagement: clamp(perma.engagement, PERMA_MIN, PERMA_MAX),
    relationships: clamp(perma.relationships, PERMA_MIN, PERMA_MAX),
    meaning: clamp(perma.meaning, PERMA_MIN, PERMA_MAX),
    achievement: clamp(perma.achievement, PERMA_MIN, PERMA_MAX),
  }
}

/**
 * 心理韧性恢复公式（每次跨年结算一次，不在每次选择后叠加）。
 *
 * 使用「剩余空间」而不是固定恢复量：韧性越高恢复越慢，
 * 否则每次选择 + 每年恢复会让数值在青年阶段就顶到 100，整条曲线失去意义。
 */
export function calcResilienceRecovery(player: PlayerState): number {
  const headroom = (RESILIENCE_MAX - player.resilience) * 0.04 // 50 → 2，80 → 0.8，95 → 0.2
  const resilienceAttrBonus = player.attributes.resilience / 100 // 0~1
  const recentLowEvents = player.history.slice(-3).filter((h) => h.eventType === 'low').length
  const penalty = recentLowEvents * 1.5
  return clamp(headroom + resilienceAttrBonus - penalty, -3, 2)
}

export function applyAttributeChanges(
  base: Attributes,
  changes: Partial<Attributes>
): Attributes {
  const next: Attributes = { ...base }
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined && Number.isFinite(value)) {
      next[key as keyof Attributes] += value
    }
  }
  return clampAttributes(next)
}

export function applyPermaChanges(base: Perma, changes: Partial<Perma>): Perma {
  const next: Perma = { ...base }
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined && Number.isFinite(value)) {
      next[key as keyof Perma] += value
    }
  }
  return clampPerma(next)
}

export function applyTalentEffects(
  base: Attributes,
  talents: { effect: { attributes?: Partial<Record<keyof Attributes, number>> } }[]
): Attributes {
  const next: Attributes = { ...base }
  for (const talent of talents) {
    const attrs = talent.effect.attributes
    if (!attrs) continue
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined) {
        next[key as keyof Attributes] += value
      }
    }
  }
  return clampAttributes(next)
}

export function getInitialResilience(talents: { effect: { resilienceBonus?: number } }[]): number {
  const bonus = talents.reduce((sum, t) => sum + (t.effect.resilienceBonus || 0), 0)
  return clamp(50 + bonus, RESILIENCE_MIN, RESILIENCE_MAX)
}

export function getInitialAttributes(): Attributes {
  return {
    intelligence: 50,
    physique: 50,
    charm: 50,
    wealth: 50,
    luck: 50,
    resilience: 50,
  }
}

export function getInitialPerma(): Perma {
  return {
    positive: 50,
    engagement: 50,
    relationships: 50,
    meaning: 50,
    achievement: 50,
  }
}

/**
 * 不同选择类型对 PERMA 的默认影响。
 *
 * 模板事件只有少数选项手写了 perma，如果不做这层推导，不接 AI 的玩家
 * 五项数值会一直停在 50，结局雷达图完全失去意义。
 */
const OPTION_PERMA: Record<OptionType, Partial<Perma>> = {
  safe: { positive: 1 },
  adventure: { engagement: 1, achievement: 1 },
  relationship: { relationships: 2 },
  growth: { engagement: 2, achievement: 1 },
  acceptance: { positive: 2 },
  meaning: { meaning: 2 },
}

export function derivePermaChanges(optionType: OptionType): Partial<Perma> {
  return { ...OPTION_PERMA[optionType] }
}
