import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'
import { createAIProvider } from './provider.js'
import { generateFallbackNarrative } from './fallback.js'
import { getCachedNarrative, setCachedNarrative } from './cache.js'
import { checkInputSafety, checkOutputSafety } from './safety.js'

export async function generateNarrative(player: PlayerState): Promise<NarrativeResponse> {
  // 1. 输入安全检查
  const historyText = player.history.map((h) => h.eventTitle).join(' ')
  const inputCheck = checkInputSafety(historyText)
  if (!inputCheck.safe) {
    return generateFallbackNarrative(player)
  }

  // 2. 读取缓存
  const cached = getCachedNarrative(player)
  if (cached) return cached

  // 3. 尝试 AI 生成
  const provider = createAIProvider()
  if (provider) {
    try {
      const response = await provider.generateNarrative(player)
      const outputCheck = checkOutputSafety(response.story)
      if (!outputCheck.safe) {
        console.warn('AI output failed safety check:', outputCheck.reason)
        return generateFallbackNarrative(player)
      }
      setCachedNarrative(player, response)
      return response
    } catch (error) {
      console.error('AI generation failed, falling back:', error)
    }
  }

  // 4. 降级到模板事件库
  return generateFallbackNarrative(player)
}

export * from './provider.js'
export * from './fallback.js'
export * from './cache.js'
export * from './safety.js'
