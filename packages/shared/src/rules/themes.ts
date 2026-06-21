import type { LifeTheme, PlayerState, OptionType } from '../types/game.js'

const THEME_SCORES: Record<LifeTheme, number> = {
  academic: 0,
  startup: 0,
  art: 0,
  social: 0,
  ordinary: 0,
  undecided: 0,
}

const OPTION_TYPE_WEIGHTS: Partial<Record<OptionType, Partial<Record<LifeTheme, number>>>> = {
  growth: { academic: 1, social: 1 },
  adventure: { startup: 2, art: 1 },
  relationship: { social: 1, ordinary: 1 },
  meaning: { art: 1, social: 2 },
  safe: { academic: 1, ordinary: 1 },
  acceptance: { ordinary: 2 },
}

/**
 * 根据历史选择更新人生主线倾向
 */
export function detectTheme(player: PlayerState): LifeTheme {
  const scores = { ...THEME_SCORES }

  // 1. 天赋影响
  for (const talent of player.talents) {
    if (talent.effect.unlockTheme) {
      scores[talent.effect.unlockTheme] += 3
    }
  }

  // 2. 当前主题有惯性权重
  scores[player.theme] += 1

  // 3. 历史选择影响
  for (const record of player.history) {
    // 简化：根据事件 ID 和选择推断选项类型权重
    // 实际游戏中应在 HistoryRecord 中记录 optionType
    const optionType = inferOptionType(record.selectedOptionText)
    const weights = OPTION_TYPE_WEIGHTS[optionType]
    if (weights) {
      for (const [theme, weight] of Object.entries(weights)) {
        scores[theme as LifeTheme] += weight
      }
    }
  }

  // 4. 属性影响
  if (player.attributes.intelligence > 70) scores.academic += 1
  if (player.attributes.wealth > 70 || player.attributes.luck > 70) scores.startup += 1
  if (player.attributes.charm > 70) scores.art += 1
  if (player.attributes.resilience > 70) scores.social += 1

  // 5. 选择最高分，平局保持当前主题
  let bestTheme: LifeTheme = player.theme
  let bestScore = scores[player.theme]
  for (const [theme, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestTheme = theme as LifeTheme
    }
  }

  return bestTheme
}

/**
 * 临时推断：根据选项文本关键词推断选项类型
 * 后续应在 HistoryRecord 中直接记录 optionType
 */
function inferOptionType(text: string): OptionType {
  const t = text.toLowerCase()
  if (t.includes('冒险') || t.includes('辞去') || t.includes('加入')) return 'adventure'
  if (t.includes('学习') || t.includes('努力') || t.includes('复盘')) return 'growth'
  if (t.includes('朋友') || t.includes('家人') || t.includes('陪伴')) return 'relationship'
  if (t.includes('意义') || t.includes('价值') || t.includes('公益')) return 'meaning'
  if (t.includes('接纳') || t.includes('原谅') || t.includes('放下')) return 'acceptance'
  return 'safe'
}

/**
 * 判断玩家是否进入某个主线
 */
export function isOnTheme(player: PlayerState, theme: LifeTheme, threshold = 5): boolean {
  const scores = { ...THEME_SCORES }
  for (const talent of player.talents) {
    if (talent.effect.unlockTheme === theme) scores[theme] += 3
  }
  for (const record of player.history) {
    const optionType = inferOptionType(record.selectedOptionText)
    const weights = OPTION_TYPE_WEIGHTS[optionType]
    if (weights && weights[theme]) scores[theme] += weights[theme]
  }
  return scores[theme] >= threshold
}
