import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'
import { createAIProvider } from './provider.js'
import { generateFallbackNarrative } from './fallback.js'
import { getCachedNarrative, setCachedNarrative } from './cache.js'
import { checkInputSafety, checkOutputSafety, SUPPORT_MESSAGE } from './safety.js'

export interface GenerateNarrativeOptions {
  /** 风险分级认为需要在叙事中附加求助信息 */
  needsSupport?: boolean
}

/** 中高风险时强制在心理提示里带上求助资源，避免支持信号被叙事盖过去 */
function withSupport(response: NarrativeResponse, needsSupport: boolean): NarrativeResponse {
  if (!needsSupport || response.psychologyHint.includes('12356')) return response
  return {
    ...response,
    psychologyHint: `${response.psychologyHint} ${SUPPORT_MESSAGE}`.trim(),
  }
}

export async function generateNarrative(
  player: PlayerState,
  options: GenerateNarrativeOptions = {}
): Promise<NarrativeResponse> {
  const needsSupport = options.needsSupport ?? false

  // 1. 输入安全检查：历史标题与玩家自由文本都要过一遍
  const inputText = [
    ...player.history.map((record) => record.eventTitle),
    ...player.gratitudeLog,
  ].join(' ')
  const inputCheck = checkInputSafety(inputText)
  if (!inputCheck.safe) {
    return generateFallbackNarrative(player, needsSupport || inputCheck.needsSupport)
  }

  // 2. 读取缓存
  const cached = getCachedNarrative(player)
  if (cached) return withSupport(cached, needsSupport)

  // 3. 尝试 AI 生成
  const provider = createAIProvider()
  if (provider) {
    try {
      const response = await provider.generateNarrative(player)
      // 故事、选项与心理提示都可能被渲染给玩家，任何一处不安全都要降级
      const outputCheck = checkOutputSafety(
        [response.story, response.psychologyHint, ...response.options.map((option) => option.text)].join(
          ' '
        )
      )
      if (!outputCheck.safe) {
        console.warn('AI output failed safety check:', outputCheck.reason)
        return generateFallbackNarrative(player, needsSupport || outputCheck.needsSupport)
      }
      const supported = withSupport(response, needsSupport || outputCheck.needsSupport)
      setCachedNarrative(player, supported)
      return supported
    } catch (error) {
      console.error('AI generation failed, falling back:', error)
    }
  }

  // 4. 降级到模板事件库
  return generateFallbackNarrative(player, needsSupport || inputCheck.needsSupport)
}

export * from './provider.js'
export * from './fallback.js'
export * from './cache.js'
export * from './safety.js'
