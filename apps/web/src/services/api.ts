import type { AssessmentResult, NarrativeResponse, PlayerState } from '@life-rerun/shared'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 客户端超时必须长于服务端模型超时（25s），
 * 否则服务端还在等模型返回，客户端已经放弃并降级到模板事件，白白浪费一次生成。
 */
const REQUEST_TIMEOUT_MS = 30_000

export async function generateNarrative(
  player: PlayerState,
  assessments?: AssessmentResult[]
): Promise<NarrativeResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE}/narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...player, assessments }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Failed to generate narrative: ${response.status} ${text}`)
    }

    const data = (await response.json()) as NarrativeResponse
    if (
      typeof data.story !== 'string' ||
      !Array.isArray(data.options) ||
      typeof data.psychologyHint !== 'string'
    ) {
      throw new Error('Unexpected narrative response shape')
    }

    return data
  } finally {
    clearTimeout(timeoutId)
  }
}
