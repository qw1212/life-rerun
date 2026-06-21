import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type PlayerState,
  type HistoryRecord,
  type StoryOption,
  type GameEvent,
  type Talent,
  type EmotionTag,
  getLifeStage,
  detectTheme,
  drawTalents,
} from '@life-rerun/shared'
import {
  clamp,
  applyAttributeChanges,
  applyPermaChanges,
  calcResilienceRecovery,
  applyTalentEffects,
  getInitialResilience,
  getInitialAttributes,
  getInitialPerma,
} from '../utils/balance.js'

interface PlayerStore {
  player: PlayerState | null
  currentEvent: GameEvent | null
  gratitudeInput: string
  isGameOver: boolean

  // 角色创建
  createPlayer: (name: string, selectedTalents?: Talent[], initialMood?: string) => void

  // 游戏推进
  setCurrentEvent: (event: GameEvent | null) => void
  selectOption: (option: StoryOption, event: GameEvent) => void
  addGratitude: () => void
  setGratitudeInput: (value: string) => void
  nextYear: () => void

  // 存档
  saveSlot: (slotName: string) => void
  loadSlot: (savedPlayer: PlayerState) => void
  exportLifeBook: () => string
  resetGame: () => void
}

const STORAGE_KEY = 'life-rerun-player'

function createInitialPlayer(name: string, talents: Talent[], initialMood?: string): PlayerState {
  const now = new Date().toISOString()
  const attributes = applyTalentEffects(getInitialAttributes(), talents)
  return {
    id: crypto.randomUUID(),
    name,
    age: 6,
    stage: 'childhood',
    attributes,
    perma: getInitialPerma(),
    resilience: getInitialResilience(talents),
    emotionTags: [(initialMood || '期待') as EmotionTag],
    talents,
    theme: 'undecided',
    helpers: [],
    history: [],
    gratitudeLog: [],
    createdAt: now,
    updatedAt: now,
  }
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      player: null,
      currentEvent: null,
      gratitudeInput: '',
      isGameOver: false,

      createPlayer: (name, selectedTalents, initialMood) => {
        const talents = selectedTalents && selectedTalents.length > 0 ? selectedTalents : drawTalents(3)
        const player = createInitialPlayer(name, talents, initialMood)
        set({ player, currentEvent: null, isGameOver: false, gratitudeInput: '' })
      },

      setCurrentEvent: (event) => set({ currentEvent: event }),

      selectOption: (option, event) => {
        const { player } = get()
        if (!player) return

        const effect = option.effect
        const attributeChanges = effect.attributes || {}
        const permaChanges = effect.perma || {}
        const resilienceChange = effect.resilience || 0

        const nextAttributes = applyAttributeChanges(player.attributes, attributeChanges)
        const nextPerma = applyPermaChanges(player.perma, permaChanges)
        const nextResilience = clamp(
          player.resilience + resilienceChange + calcResilienceRecovery(player),
          0,
          100
        )

        // 情绪标签更新
        const nextEmotionTags = [...player.emotionTags]
        if (effect.removeTag) {
          const idx = nextEmotionTags.indexOf(effect.removeTag)
          if (idx >= 0) nextEmotionTags.splice(idx, 1)
        }
        if (effect.addTag && !nextEmotionTags.includes(effect.addTag)) {
          nextEmotionTags.push(effect.addTag)
        }

        // 主线检测
        const tempPlayer: PlayerState = {
          ...player,
          history: [
            ...player.history,
            {
              age: player.age,
              eventId: event.id,
              eventTitle: event.title,
              eventType: event.type,
              selectedOptionId: option.id,
              selectedOptionText: option.text,
              attributeChanges,
              psychologyHint: event.psychologyHint,
            },
          ],
        }
        const nextTheme = detectTheme(tempPlayer)

        const record: HistoryRecord = {
          age: player.age,
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.type,
          selectedOptionId: option.id,
          selectedOptionText: option.text,
          selectedOptionType: option.type,
          attributeChanges,
          psychologyHint: event.psychologyHint,
        }

        const nextHelpers = effect.addHelper
          ? [...player.helpers.filter((h) => h.id !== effect.addHelper!.id), effect.addHelper]
          : player.helpers

        set({
          player: {
            ...player,
            attributes: nextAttributes,
            perma: nextPerma,
            resilience: nextResilience,
            emotionTags: nextEmotionTags.slice(0, 3),
            theme: effect.theme || nextTheme,
            helpers: nextHelpers,
            history: [...player.history, record],
            updatedAt: new Date().toISOString(),
          },
          currentEvent: null,
        })
      },

      addGratitude: () => {
        const { player, gratitudeInput } = get()
        if (!player || !gratitudeInput.trim()) return
        set({
          player: {
            ...player,
            gratitudeLog: [...player.gratitudeLog, gratitudeInput.trim()].slice(-20),
            updatedAt: new Date().toISOString(),
          },
          gratitudeInput: '',
        })
      },

      setGratitudeInput: (value) => set({ gratitudeInput: value }),

      nextYear: () => {
        const { player } = get()
        if (!player) return

        const paceMap: Record<PlayerState['stage'], number> = {
          childhood: 2,
          adolescence: 1,
          youth: 1,
          middleAge: 2,
          oldAge: 3,
        }

        const nextAge = player.age + paceMap[player.stage]
        const nextStage = getLifeStage(nextAge)
        const isGameOver = nextAge >= 80

        set({
          player: {
            ...player,
            age: nextAge,
            stage: nextStage,
            resilience: clamp(player.resilience + calcResilienceRecovery(player), 0, 100),
            updatedAt: new Date().toISOString(),
          },
          isGameOver,
        })
      },

      saveSlot: (slotName) => {
        const { player } = get()
        if (!player) return
        const slots = JSON.parse(localStorage.getItem('life-rerun-slots') || '{}') as Record<string, PlayerState>
        slots[slotName] = { ...player }
        localStorage.setItem('life-rerun-slots', JSON.stringify(slots))
      },

      loadSlot: (savedPlayer) => {
        set({
          player: savedPlayer,
          currentEvent: null,
          isGameOver: savedPlayer.age >= 80,
          gratitudeInput: '',
        })
      },

      exportLifeBook: () => {
        const { player } = get()
        if (!player) return ''
        return JSON.stringify(player, null, 2)
      },

      resetGame: () => {
        set({ player: null, currentEvent: null, isGameOver: false, gratitudeInput: '' })
        localStorage.removeItem(STORAGE_KEY)
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ player: state.player }),
    }
  )
)
