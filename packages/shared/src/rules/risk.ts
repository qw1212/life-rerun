import type {
  AssessmentResult,
  RiskAssessment,
  RiskLevel,
  RiskSignals,
} from '../types/assessment.js'

/**
 * 分层风险词表。
 *
 * 说明：这是筛查兜底手段，不是诊断工具。关键词匹配必然存在漏报与误报，
 * 因此高风险仅作为「转入支持界面」的信号之一，最终判断需结合量表与人工流程。
 */
const HIGH_RISK_PATTERNS = [
  '自杀',
  '轻生',
  '想死',
  '不想活',
  '活不下去',
  '结束生命',
  '结束自己',
  '了结自己',
  '自我了断',
  '自残',
  '自伤',
  '割腕',
  '跳楼',
  '去死',
]

const MEDIUM_RISK_PATTERNS = [
  '绝望',
  '无望',
  '活着没意思',
  '活着没意义',
  '撑不下去',
  '熬不下去',
  '看不到希望',
  '没有出路',
  '崩溃',
  '消失',
  '拖累',
  '一无是处',
]

const LOW_RISK_PATTERNS = [
  '抑郁',
  '焦虑',
  '低落',
  '失眠',
  '孤独',
  '痛苦',
  '难过',
  '压力大',
  '疲惫',
  '麻木',
  '空虚',
]

const RISK_ORDER: Record<RiskLevel, number> = { none: 0, low: 1, medium: 2, high: 3 }

function matchLevel(texts: string[]): { level: RiskLevel; matched: string[] } {
  const matched: string[] = []
  let level: RiskLevel = 'none'

  for (const raw of texts) {
    const text = raw.toLowerCase()
    for (const pattern of HIGH_RISK_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) {
        matched.push(pattern)
        level = 'high'
      }
    }
    for (const pattern of MEDIUM_RISK_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) {
        matched.push(pattern)
        if (RISK_ORDER[level] < RISK_ORDER.medium) level = 'medium'
      }
    }
    for (const pattern of LOW_RISK_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) {
        matched.push(pattern)
        if (RISK_ORDER[level] < RISK_ORDER.low) level = 'low'
      }
    }
  }

  return { level, matched: Array.from(new Set(matched)) }
}

/**
 * 对自由文本做分级风险筛查。
 */
export function detectTextRiskLevel(texts: string[]): { level: RiskLevel; matched: string[] } {
  return matchLevel(texts.filter((t) => t && t.trim().length > 0))
}

/**
 * 从量表结果中提取风险信号。
 */
export function extractAssessmentSignals(
  results: AssessmentResult[] | undefined
): Pick<RiskSignals, 'phq9Item9Score' | 'phq9Total' | 'gad7Total'> {
  const signals: Pick<RiskSignals, 'phq9Item9Score' | 'phq9Total' | 'gad7Total'> = {}
  for (const result of results ?? []) {
    if (result.scale === 'phq9') {
      const answers = result.answers
      const crisisIndex = 8
      const item9 = answers[crisisIndex] ?? 0
      // 取前后测中更严重的一次
      if (signals.phq9Item9Score === undefined || item9 > signals.phq9Item9Score) {
        signals.phq9Item9Score = item9
      }
      if (signals.phq9Total === undefined || result.totalScore > signals.phq9Total) {
        signals.phq9Total = result.totalScore
      }
    }
    if (result.scale === 'gad7') {
      if (signals.gad7Total === undefined || result.totalScore > signals.gad7Total) {
        signals.gad7Total = result.totalScore
      }
    }
  }
  return signals
}

function raise(current: RiskLevel, next: RiskLevel): RiskLevel {
  return RISK_ORDER[next] > RISK_ORDER[current] ? next : current
}

/**
 * 综合分级：自由文本 + 量表 + 近期低谷密度。
 *
 * 分级含义：
 * - high   需要硬中断叙事，转入危机支持界面
 * - medium 叙事继续，但必须附加求助信息
 * - low    叙事继续，温和支持
 * - none   正常推进
 */
export function assessRisk(signals: RiskSignals): RiskAssessment {
  const reasons: string[] = []
  let level: RiskLevel = 'none'

  const text = detectTextRiskLevel(signals.freeText ?? [])
  if (text.level !== 'none') {
    reasons.push(`文本命中风险信号：${text.matched.join('、')}`)
    level = raise(level, text.level)
  }

  // PHQ-9 第 9 题为自伤/自杀念头，任一非 0 分即进入高风险
  if (signals.phq9Item9Score !== undefined && signals.phq9Item9Score > 0) {
    reasons.push(`PHQ-9 第 9 题阳性（${signals.phq9Item9Score} 分）`)
    level = raise(level, 'high')
  }

  if (signals.phq9Total !== undefined) {
    if (signals.phq9Total >= 20) {
      reasons.push(`PHQ-9 总分 ${signals.phq9Total}（重度区间）`)
      level = raise(level, 'high')
    } else if (signals.phq9Total >= 15) {
      reasons.push(`PHQ-9 总分 ${signals.phq9Total}（中重度区间）`)
      level = raise(level, 'medium')
    } else if (signals.phq9Total >= 10) {
      reasons.push(`PHQ-9 总分 ${signals.phq9Total}（中度区间）`)
      level = raise(level, 'low')
    }
  }

  if (signals.gad7Total !== undefined) {
    if (signals.gad7Total >= 15) {
      reasons.push(`GAD-7 总分 ${signals.gad7Total}（重度区间）`)
      level = raise(level, 'medium')
    } else if (signals.gad7Total >= 10) {
      reasons.push(`GAD-7 总分 ${signals.gad7Total}（中度区间）`)
      level = raise(level, 'low')
    }
  }

  if (signals.recentLowStreak !== undefined && signals.recentLowStreak >= 3) {
    reasons.push(`连续 ${signals.recentLowStreak} 个低谷事件`)
    level = raise(level, 'medium')
  }

  return {
    level,
    reasons,
    needsSupport: level !== 'none',
    blockNarrative: level === 'high',
  }
}
