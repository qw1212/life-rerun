import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'
import { buildSystemPrompt, buildUserPrompt, SAFETY_PROMPT_SUFFIX } from './prompts.js'

export interface AIProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AIProvider {
  generateNarrative(player: PlayerState): Promise<NarrativeResponse>
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(private config: AIProviderConfig) {}

  async generateNarrative(player: PlayerState): Promise<NarrativeResponse> {
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(player) + SAFETY_PROMPT_SUFFIX },
    ]

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`AI API error: ${response.status} ${text}`)
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
    }

    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('AI response is empty')
    }

    return parseNarrativeResponse(content)
  }
}

export function parseNarrativeResponse(content: string): NarrativeResponse {
  try {
    const parsed = JSON.parse(content) as NarrativeResponse
    if (!parsed.story || !Array.isArray(parsed.options) || !parsed.psychologyHint) {
      throw new Error('Invalid narrative response structure')
    }
    return parsed
  } catch (error) {
    console.error('Failed to parse AI response:', content)
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function createAIProvider(): AIProvider | null {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey || apiKey === 'your_openai_api_key') {
    return null
  }

  return new OpenAICompatibleProvider({ apiKey, baseUrl, model })
}
