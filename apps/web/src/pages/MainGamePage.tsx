import { useState } from 'react'
import { motion } from 'framer-motion'
import type { PlayerState, GameEvent, StoryOption } from '@life-rerun/shared'
import { Save, Download, RotateCcw, Heart, PauseCircle } from 'lucide-react'
import { AttributePanel } from '../components/AttributePanel.js'
import { EventCard } from '../components/EventCard.js'
import { EpiphanyPage } from './EpiphanyPage.js'
import { LifeTimeline } from '../components/LifeTimeline.js'
import { HelperList } from '../components/HelperList.js'
import { BreathingOverlay } from '../components/BreathingOverlay.js'

interface Props {
  player: PlayerState
  currentEvent: GameEvent | null
  gratitudeInput: string
  loading: boolean
  error: string
  onSelectOption: (option: StoryOption) => void
  onAddGratitude: () => void
  onSetGratitudeInput: (value: string) => void
  onNextYear: () => void
  onSave: () => void
  onExport: () => void
  onReset: () => void
}

const STAGE_LABELS: Record<PlayerState['stage'], string> = {
  childhood: '童年',
  adolescence: '青少年',
  youth: '青年',
  middleAge: '中年',
  oldAge: '老年',
}

const THEME_LABELS: Record<PlayerState['theme'], string> = {
  academic: '学术探索',
  startup: '创业征程',
  art: '艺术人生',
  social: '社会服务',
  ordinary: '平凡幸福',
  undecided: '主线未定',
}

export function MainGamePage({
  player,
  currentEvent,
  gratitudeInput,
  loading,
  error,
  onSelectOption,
  onAddGratitude,
  onSetGratitudeInput,
  onNextYear,
  onSave,
  onExport,
  onReset,
}: Props) {
  const [showBreathing, setShowBreathing] = useState(false)

  return (
    <main className="min-h-screen p-4 sm:p-6 bg-warm-50">
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-5 shadow-sm"
        >
          <div>
            <h1 className="text-2xl font-bold text-warm-800">{player.name} 的人生</h1>
            <p className="text-stone-600 text-sm mt-1">
              {player.age} 岁 · {STAGE_LABELS[player.stage]}
              {player.theme !== 'undecided' && ` · ${THEME_LABELS[player.theme]}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBreathing(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-hope-50 hover:bg-hope-100 text-hope-700 rounded-lg transition-colors"
            >
              <PauseCircle className="w-4 h-4" />
              暂停
            </button>
            <button
              onClick={onSave}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-warm-100 hover:bg-warm-200 text-warm-800 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              存档
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-warm-100 hover:bg-warm-200 text-warm-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重开
            </button>
          </div>
        </motion.header>

        <AttributePanel
          attributes={player.attributes}
          perma={player.perma}
          resilience={player.resilience}
        />

        <HelperList helpers={player.helpers} />

        {currentEvent && currentEvent.type === 'insight' && (
          <EpiphanyPage event={currentEvent} onSelect={onSelectOption} />
        )}

        {currentEvent && currentEvent.type !== 'insight' && (
          <EventCard event={currentEvent} player={player} onSelect={onSelectOption} />
        )}

        {!currentEvent && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            {loading ? (
              <div className="flex items-center gap-3 text-stone-600">
                <span className="inline-block w-5 h-5 border-2 border-stone-200 border-t-hope-500 rounded-full animate-spin" />
                正在书写下一段人生……
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-stone-700">
                  <Heart className="w-4 h-4 text-hope-500" />
                  <span>这一年结束了。写下 1~3 件值得感恩的事（可选）：</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={gratitudeInput}
                    onChange={(e) => onSetGratitudeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && gratitudeInput.trim()) {
                        onAddGratitude()
                      }
                    }}
                    placeholder="例如：今天的阳光、朋友的问候……"
                    className="flex-1 px-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-hope-400"
                  />
                  <button
                    onClick={onAddGratitude}
                    disabled={!gratitudeInput.trim()}
                    className="px-4 py-2 bg-warm-100 hover:bg-warm-200 text-warm-800 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    记录感恩
                  </button>
                </div>

                {player.gratitudeLog.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {player.gratitudeLog.slice(-5).map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-hope-50 text-hope-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={onNextYear}
                    className="px-6 py-2.5 bg-hope-500 hover:bg-hope-600 text-white rounded-xl font-medium transition-colors"
                  >
                    进入下一年
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            )}
          </motion.section>
        )}

        <LifeTimeline player={player} />
      </div>

      <BreathingOverlay open={showBreathing} onClose={() => setShowBreathing(false)} />
    </main>
  )
}
