import { EVENTS, getEventsByStage, canTriggerEvent, calcEventWeight, pickWeightedEvent, type NarrativeResponse, type PlayerState, type GameEvent } from '@life-rerun/shared'
import { checkOutputSafety, sanitizeStory, SUPPORT_MESSAGE } from './safety.js'

function pickFallbackEvent(player: PlayerState): GameEvent {
  const stageEvents = getEventsByStage(player.stage)
  const candidates = stageEvents.filter((e) => canTriggerEvent(player, e))

  if (candidates.length === 0) {
    // 没有任何可触发事件时，返回一个通用的人生节点事件
    return EVENTS.find((e) => e.id === 'event-random-kindness')!
  }

  const weights = candidates.map((e) => calcEventWeight(player, e))
  return pickWeightedEvent(candidates, weights) || candidates[0]
}

export function generateFallbackNarrative(player: PlayerState, needsSupport = false): NarrativeResponse {
  const event = pickFallbackEvent(player)
  const story = sanitizeStory(event.story)
    .replace(/你/g, `${player.name || '你'}`)
    .replace(/\$\{age\}/g, String(player.age))

  const safety = checkOutputSafety(story)
  const psychologyHint = needsSupport || safety.needsSupport
    ? `${event.psychologyHint} ${SUPPORT_MESSAGE}`
    : event.psychologyHint

  return {
    story,
    options: event.options.map((o) => ({
      ...o,
      effect: {
        attributes: o.effect.attributes || {},
        perma: o.effect.perma || {},
        resilience: o.effect.resilience || 0,
        ...o.effect,
      },
    })),
    psychologyHint,
    attributeChanges: {},
    permaChanges: event.permaTags || {},
  }
}
