import {
  EVENTS,
  getEventsByStage,
  isStandardEvent,
  pickEventForPlayer,
  type GameEvent,
  type NarrativeResponse,
  type PlayerState,
} from '@life-rerun/shared'
import { checkOutputSafety, sanitizeStory, SUPPORT_MESSAGE } from './safety.js'

/**
 * 最后兜底事件：即使所有模板条件都不满足，也不能让玩家停在空白页面上。
 */
const LAST_RESORT_EVENT: GameEvent = {
  id: 'event-quiet-moment',
  type: 'breather',
  stage: 'any',
  title: '安静的一刻',
  story:
    '今天没有发生什么大事。你给自己倒了一杯温水，坐在窗边发了一会儿呆，让紧绷的肩膀慢慢放松下来。',
  options: [
    {
      id: 'opt-rest',
      text: '允许自己就这样待一会儿',
      type: 'acceptance',
      effect: { attributes: { resilience: 1 }, perma: { positive: 1 } },
    },
    {
      id: 'opt-note',
      text: '记下此刻心里最真实的一句话',
      type: 'growth',
      effect: { attributes: { intelligence: 1, resilience: 1 }, perma: { meaning: 1 } },
    },
    {
      id: 'opt-connect',
      text: '给一个信任的人发条消息',
      type: 'relationship',
      effect: { attributes: { charm: 1 }, perma: { relationships: 1 } },
    },
  ],
  psychologyHint: '平凡的一天，也值得被好好度过。',
}

function pickFallbackEvent(player: PlayerState): GameEvent {
  // 顿悟/喘息只走心理急救链路，普通推进不能抽到它们
  const standardEvents = getEventsByStage(player.stage).filter(isStandardEvent)
  // 优先挑选尚未经历过的同阶段事件，其次才允许重复
  return (
    pickEventForPlayer(player, standardEvents) ??
    pickEventForPlayer(
      player,
      EVENTS.filter(isStandardEvent),
      { allowRepeats: true }
    ) ??
    LAST_RESORT_EVENT
  )
}

export function generateFallbackNarrative(
  player: PlayerState,
  needsSupport = false
): NarrativeResponse {
  const event = pickFallbackEvent(player)
  const story = sanitizeStory(event.story).replace(/\$\{age\}/g, String(player.age))

  const safety = checkOutputSafety(story)
  const psychologyHint =
    needsSupport || safety.needsSupport
      ? `${event.psychologyHint} ${SUPPORT_MESSAGE}`
      : event.psychologyHint

  return {
    story,
    options: event.options.map((option) => ({
      ...option,
      effect: {
        ...option.effect,
        attributes: option.effect.attributes || {},
        perma: option.effect.perma || {},
        resilience: option.effect.resilience || 0,
      },
    })),
    psychologyHint,
    // 回传原始事件元数据：否则客户端的低谷/顿悟/喘息节奏会被降级成普通事件，
    // 后续的心理急救判断与结局统计都会失真。
    eventId: event.id,
    eventTitle: event.title,
    eventType: event.type,
    permaTags: event.permaTags || {},
    attributeChanges: {},
  }
}
