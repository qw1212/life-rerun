import { detectTextRiskLevel, type RiskLevel } from '@life-rerun/shared'

/**
 * 内容审核词表：与心理风险无关，但不应出现在生成内容中。
 */
const BLOCKED_CONTENT_KEYWORDS = [
  '暴力',
  '虐待',
  '强奸',
  '色情',
  '种族歧视',
  '性别歧视',
]

export const SUPPORT_MESSAGE =
  '如果你正在经历严重的心理困扰，请寻求专业帮助。全国统一心理援助热线：12356；紧急情况请拨打 120。你并不孤单。'

export interface SafetyCheckResult {
  safe: boolean
  reason?: string
  needsSupport: boolean
}

function toResult(level: RiskLevel, matched: string[]): SafetyCheckResult {
  return {
    safe: level !== 'high',
    reason: matched.length > 0 ? `命中风险信号：${matched.join('、')}` : undefined,
    needsSupport: level !== 'none',
  }
}

function findBlockedContent(text: string): string | undefined {
  const lower = text.toLowerCase()
  return BLOCKED_CONTENT_KEYWORDS.find((k) => lower.includes(k.toLowerCase()))
}

/**
 * 输入安全检查：基于分层风险筛查 + 内容词表。
 */
export function checkInputSafety(text: string): SafetyCheckResult {
  const blocked = findBlockedContent(text)
  if (blocked) {
    return { safe: false, reason: `输入包含不适宜内容：${blocked}`, needsSupport: true }
  }
  const { level, matched } = detectTextRiskLevel([text])
  return toResult(level, matched)
}

/**
 * 输出安全检查：基于分层风险筛查 + 内容词表。
 */
export function checkOutputSafety(content: string): SafetyCheckResult {
  const blocked = findBlockedContent(content)
  if (blocked) {
    return { safe: false, reason: `输出包含不适宜内容：${blocked}`, needsSupport: true }
  }
  const { level, matched } = detectTextRiskLevel([content])
  return toResult(level, matched)
}

export function sanitizeStory(story: string): string {
  return story.replace(/<[^>]*>/g, '').trim()
}

export { detectTextRiskLevel }
