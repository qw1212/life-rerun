/**
 * 心理评估与风险分级类型。
 *
 * 重要：本模块所有结果仅用于玩家自我觉察与产品安全兜底，
 * 不构成任何临床诊断，也不能替代专业评估。
 */

export type AssessmentScaleId = 'phq9' | 'gad7'

export type AssessmentPhase = 'pre' | 'post'

export type AssessmentSeverity =
  | 'minimal'
  | 'mild'
  | 'moderate'
  | 'moderatelySevere'
  | 'severe'

export interface AssessmentScaleOption {
  value: number
  label: string
}

export interface AssessmentScale {
  id: AssessmentScaleId
  name: string
  fullName: string
  /** 指导语 */
  instruction: string
  /** 回忆窗口，例如「最近两周」 */
  recallWindow: string
  itemCount: number
  maxItemScore: number
  options: AssessmentScaleOption[]
  items: string[]
  /** 危机筛查关键题（0 基下标），PHQ-9 为第 9 题 */
  crisisItemIndex?: number
  /** 题目来源与授权说明 */
  source: string
}

export interface AssessmentScore {
  totalScore: number
  maxScore: number
  severity: AssessmentSeverity
  severityLabel: string
  /** 危机筛查关键题是否阳性 */
  crisisFlag: boolean
}

export interface AssessmentResult extends AssessmentScore {
  scale: AssessmentScaleId
  phase: AssessmentPhase
  answers: number[]
  completedAt: string
}

export type RiskLevel = 'none' | 'low' | 'medium' | 'high'

export interface RiskSignals {
  /** 玩家自由输入文本，例如感恩记录、反思内容 */
  freeText?: string[]
  /** PHQ-9 第 9 题得分（0-3） */
  phq9Item9Score?: number
  /** PHQ-9 总分（0-27） */
  phq9Total?: number
  /** GAD-7 总分（0-21） */
  gad7Total?: number
  /** 近期连续低谷事件数 */
  recentLowStreak?: number
}

export interface RiskAssessment {
  level: RiskLevel
  /** 命中的风险依据，便于运营复盘 */
  reasons: string[]
  /** 是否需要在叙事中附加求助信息 */
  needsSupport: boolean
  /** 是否需要硬中断叙事流程并转入危机干预界面 */
  blockNarrative: boolean
}
