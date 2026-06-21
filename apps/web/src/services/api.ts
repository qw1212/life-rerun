import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function generateNarrative(player: PlayerState): Promise<NarrativeResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(`${API_BASE}/narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to generate narrative: ${response.status} ${text}`)
    }

    return response.json() as Promise<NarrativeResponse>
  } finally {
    clearTimeout(timeoutId)
  }
}
