const BLOCKED_KEYWORDS = [
  '自杀',
  '自残',
  '自伤',
  '跳楼',
  '割腕',
  '杀人',
  '暴力',
  '虐待',
  '强奸',
  '色情',
  '种族歧视',
  '性别歧视',
  '去死',
  '活着没意思',
]

const LOW_MOOD_KEYWORDS = ['失落', '绝望', '崩溃', '痛苦', '孤独', '焦虑', '抑郁']

export interface SafetyCheckResult {
  safe: boolean
  reason?: string
  needsSupport: boolean
}

export function checkInputSafety(text: string): SafetyCheckResult {
  const lower = text.toLowerCase()
  const found = BLOCKED_KEYWORDS.find((k) => lower.includes(k.toLowerCase()))
  if (found) {
    return {
      safe: false,
      reason: `输入包含敏感内容：${found}`,
      needsSupport: true,
    }
  }
  return { safe: true, needsSupport: false }
}

export function checkOutputSafety(content: string): SafetyCheckResult {
  const lower = content.toLowerCase()
  const blocked = BLOCKED_KEYWORDS.find((k) => lower.includes(k.toLowerCase()))
  if (blocked) {
    return {
      safe: false,
      reason: `输出包含敏感内容：${blocked}`,
      needsSupport: true,
    }
  }
  const needsSupport = LOW_MOOD_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))
  return { safe: true, needsSupport }
}

export function sanitizeStory(story: string): string {
  return story.replace(/<[^>]*>/g, '').trim()
}
