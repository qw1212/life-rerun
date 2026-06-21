import type { NarrativeResponse, PlayerState } from '@life-rerun/shared'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function generateNarrative(player: PlayerState): Promise<NarrativeResponse> {
  const response = await fetch(`${API_BASE}/narrative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to generate narrative: ${response.status} ${text}`)
  }

  return response.json() as Promise<NarrativeResponse>
}
