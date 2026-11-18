import type {
  AssessmentScale,
  AssessmentScaleId,
  AssessmentScore,
  AssessmentSeverity,
} from '../types/assessment.js'

/**
 * 频次选项：完全不会 / 好几天 / 一半以上的天数 / 几乎每天
 */
const FREQUENCY_OPTIONS = [
  { value: 0, label: '完全不会' },
  { value: 1, label: '好几天' },
  { value: 2, label: '一半以上的天数' },
  { value: 3, label: '几乎每天' },
]

const RECALL_WINDOW = '过去两周'

export const ASSESSMENT_SCALES: Record<AssessmentScaleId, AssessmentScale> = {
  phq9: {
    id: 'phq9',
    name: 'PHQ-9',
    fullName: '病人健康问卷抑郁量表',
    instruction: `在${RECALL_WINDOW}内，你有多长时间受到以下问题困扰？`,
    recallWindow: RECALL_WINDOW,
    itemCount: 9,
    maxItemScore: 3,
    options: FREQUENCY_OPTIONS,
    items: [
      '做事时提不起劲或没有兴趣',
      '感到心情低落、沮丧或绝望',
      '入睡困难、睡不安稳或睡眠过多',
      '感觉疲倦或没有活力',
      '食欲不振或吃得太多',
      '觉得自己很糟，或觉得自己很失败，或让自己或家人失望',
      '对事物专注有困难，例如阅读报纸或看电视时',
      '动作或说话速度缓慢到别人已经察觉，或正好相反——烦躁不安、动来动去的情况比平常更严重',
      '有不如死掉或用某种方式伤害自己的念头',
    ],
    crisisItemIndex: 8,
    source:
      '题目源自 Kroenke, Spitzer & Williams (2001) 公开发表的 PHQ-9。该量表公开可用，无需申请授权；中文版使用请注明出处。',
  },
  gad7: {
    id: 'gad7',
    name: 'GAD-7',
    fullName: '广泛性焦虑障碍量表',
    instruction: `在${RECALL_WINDOW}内，你有多长时间受到以下问题困扰？`,
    recallWindow: RECALL_WINDOW,
    itemCount: 7,
    maxItemScore: 3,
    options: FREQUENCY_OPTIONS,
    items: [
      '感到紧张、焦虑或急切',
      '不能停止或控制担忧',
      '对各种各样的事情担忧过多',
      '很难放松下来',
      '由于不安而无法静坐',
      '变得容易烦恼或急躁',
      '感到似乎将有可怕的事情发生而害怕',
    ],
    source:
      '题目源自 Spitzer, Kroenke, Williams & Löwe (2006) 公开发表的 GAD-7。该量表公开可用，无需申请授权；中文版使用请注明出处。',
  },
}

interface SeverityBand {
  min: number
  max: number
  severity: AssessmentSeverity
  label: string
}

/**
 * 分级区间（公开发表的分界值）。
 */
const SEVERITY_BANDS: Record<AssessmentScaleId, SeverityBand[]> = {
  phq9: [
    { min: 0, max: 4, severity: 'minimal', label: '无或极轻微' },
    { min: 5, max: 9, severity: 'mild', label: '轻度' },
    { min: 10, max: 14, severity: 'moderate', label: '中度' },
    { min: 15, max: 19, severity: 'moderatelySevere', label: '中重度' },
    { min: 20, max: 27, severity: 'severe', label: '重度' },
  ],
  gad7: [
    { min: 0, max: 4, severity: 'minimal', label: '无或极轻微' },
    { min: 5, max: 9, severity: 'mild', label: '轻度' },
    { min: 10, max: 14, severity: 'moderate', label: '中度' },
    { min: 15, max: 21, severity: 'severe', label: '重度' },
  ],
}

export function getAssessmentScale(id: AssessmentScaleId): AssessmentScale {
  return ASSESSMENT_SCALES[id]
}

export function isAssessmentComplete(id: AssessmentScaleId, answers: number[]): boolean {
  const scale = ASSESSMENT_SCALES[id]
  if (!Array.isArray(answers) || answers.length !== scale.itemCount) return false

  /**
   * 必须按下标逐个检查，不能用 `answers.every(...)`：
   * 答题页是从空数组按下标写入的（先答第 9 题就会得到 length=9 的稀疏数组），
   * 而 `every` / `reduce` 都会**跳过空位**——只答一题也会被判成「已完成」，
   * 总分还会少算掉未答的题。这是会让用户拿到错误分数的真实缺陷。
   */
  for (let i = 0; i < scale.itemCount; i += 1) {
    const a = answers[i]
    if (!Number.isInteger(a) || a < 0 || a > scale.maxItemScore) return false
  }
  return true
}

/**
 * 量表计分。返回总分、分级与关键题（危机）标记。
 */
export function scoreAssessment(id: AssessmentScaleId, answers: number[]): AssessmentScore {
  const scale = ASSESSMENT_SCALES[id]

  /**
   * 按下标累加，不用 `reduce`：稀疏数组的空位会被 reduce 跳过，
   * 未答题若混进来会静默少算总分（调用方必须先用 isAssessmentComplete 把关）。
   */
  let totalScore = 0
  for (let i = 0; i < scale.itemCount; i += 1) {
    const a = answers[i]
    totalScore += Number.isInteger(a) && a >= 0 && a <= scale.maxItemScore ? a : 0
  }
  const band = SEVERITY_BANDS[id].find((b) => totalScore >= b.min && totalScore <= b.max)
  const crisisFlag =
    scale.crisisItemIndex !== undefined && (answers[scale.crisisItemIndex] ?? 0) > 0

  return {
    totalScore,
    maxScore: scale.itemCount * scale.maxItemScore,
    severity: band?.severity ?? 'minimal',
    severityLabel: band?.label ?? '无或极轻微',
    crisisFlag,
  }
}
