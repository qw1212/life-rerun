import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ENDING_AGE,
  LIFE_STAGES,
  STAGE_HINT,
  THEME_META,
  type PlayerState,
  type GameEvent,
  type StoryOption,
} from '@life-rerun/shared'
import { Download, FolderOpen, Heart, PauseCircle, RotateCcw } from 'lucide-react'
import { AttributePanel } from '../components/AttributePanel.js'
import { EventCard } from '../components/EventCard.js'
import { EpiphanyPage } from './EpiphanyPage.js'
import { LifeTimeline } from '../components/LifeTimeline.js'
import { HelperList } from '../components/HelperList.js'
import { BreathingOverlay } from '../components/BreathingOverlay.js'
import { SavePanel } from '../components/SavePanel.js'
import type { SaveSlotSummary } from '../store/playerStore.js'

interface Props {
  player: PlayerState
  currentEvent: GameEvent | null
  gratitudeInput: string
  loading: boolean
  error: string
  notice: string
  /** 风险分级提示需要附加求助资源（中高风险） */
  supportNeeded: boolean
  slots: SaveSlotSummary[]
  onSelectOption: (option: StoryOption) => void
  onAddGratitude: () => void
  onSetGratitudeInput: (value: string) => void
  onNextYear: () => void
  onSaveSlot: (name: string) => void
  onLoadSlot: (name: string) => void
  onDeleteSlot: (name: string) => void
  onImportFile: (file: File) => void
  onExport: () => void
  onReset: () => void
}

export function MainGamePage({
  player,
  currentEvent,
  gratitudeInput,
  loading,
  error,
  notice,
  supportNeeded,
  slots,
  onSelectOption,
  onAddGratitude,
  onSetGratitudeInput,
  onNextYear,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onImportFile,
  onExport,
  onReset,
}: Props) {
  const [showBreathing, setShowBreathing] = useState(false)
  const [showSavePanel, setShowSavePanel] = useState(false)

  const stageMeta = LIFE_STAGES[player.stage]
  // 老年阶段名义上到 100 岁，但游戏在 ENDING_AGE 结束，进度条必须按真实终点计算
  const stageEnd = player.stage === 'oldAge' ? ENDING_AGE : stageMeta.range.max
  const stageSpan = Math.max(1, stageEnd - stageMeta.range.min)
  const stageProgress = Math.min(
    100,
    Math.max(0, Math.round(((player.age - stageMeta.range.min) / stageSpan) * 100))
  )
  const themeMeta = THEME_META[player.theme]

  return (
    <main className="min-h-screen p-4 sm:p-6 bg-warm-50">
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-warm-800 truncate">{player.name} 的人生</h1>
              <p className="text-stone-600 text-sm mt-1" title={STAGE_HINT[player.stage]}>
                {player.age} 岁 · {stageMeta.label}
                {player.theme !== 'undecided' && ` · ${themeMeta.label}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowBreathing(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-hope-50 hover:bg-hope-100 text-hope-700 rounded-lg transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
                暂停
              </button>
              <button
                onClick={() => setShowSavePanel(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-warm-100 hover:bg-warm-200 text-warm-800 rounded-lg transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
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
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
              <span title={themeMeta.description}>人生主线：{themeMeta.label}</span>
              <span>
                {stageMeta.label}阶段 {stageProgress}%
              </span>
            </div>
            <div
              className="h-1.5 bg-stone-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={stageProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${stageMeta.label}阶段进度`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stageProgress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-hope-400 rounded-full"
              />
            </div>
          </div>
        </motion.header>

        {supportNeeded && (
          <section
            className="rounded-2xl border border-hope-100 bg-hope-50 p-4 text-sm text-hope-800 leading-relaxed"
            aria-label="心理支持提示"
          >
            如果你此刻感到难以承受，可以拨打心理援助热线{' '}
            <a href="tel:12356" className="font-semibold underline">
              12356
            </a>
            ，或联系身边信任的人。游戏可以随时暂停，也可以先离开。
          </section>
        )}

        <AttributePanel
          attributes={player.attributes}
          perma={player.perma}
          resilience={player.resilience}
        />

        <HelperList helpers={player.helpers} />

        {currentEvent && currentEvent.type === 'insight' && (
          <EpiphanyPage event={currentEvent} player={player} onSelect={onSelectOption} />
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
              <div className="flex items-center gap-3 text-stone-600" role="status">
                <span className="inline-block w-5 h-5 border-2 border-stone-200 border-t-hope-500 rounded-full animate-spin" />
                正在书写下一段人生……
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-stone-700">
                  <Heart className="w-4 h-4 text-hope-500" />
                  <span>这一年结束了。写下值得感恩的小事（可选）：</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={gratitudeInput}
                    maxLength={120}
                    onChange={(event) => onSetGratitudeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && gratitudeInput.trim()) {
                        onAddGratitude()
                      }
                    }}
                    placeholder="例如：今天的阳光、朋友的问候……"
                    aria-label="感恩记录"
                    className="flex-1 min-w-0 px-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-hope-400"
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
                        key={`${item}-${index}`}
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
                  <span className="text-xs text-stone-400">进度会自动保存在本机</span>
                </div>

                {error && (
                  <p className="text-red-500 text-sm" role="alert">
                    {error}
                  </p>
                )}
              </div>
            )}
          </motion.section>
        )}

        <LifeTimeline player={player} />
      </div>

      <BreathingOverlay open={showBreathing} onClose={() => setShowBreathing(false)} />
      <SavePanel
        open={showSavePanel}
        slots={slots}
        onClose={() => setShowSavePanel(false)}
        onSave={onSaveSlot}
        onLoad={onLoadSlot}
        onDelete={onDeleteSlot}
        onImport={onImportFile}
        onExport={onExport}
      />

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-stone-800/95 text-white text-sm shadow-lg max-w-[90vw] text-center"
        >
          {notice}
        </motion.div>
      )}
    </main>
  )
}
