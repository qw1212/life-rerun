import { motion } from 'framer-motion'
import type { GameEvent, StoryOption, PlayerState } from '@life-rerun/shared'
import { isOptionUnlocked } from '@life-rerun/shared'
import { Sparkles, Lock } from 'lucide-react'

interface Props {
  event: GameEvent
  player: PlayerState
  onSelect: (option: StoryOption) => void
}

const TYPE_BADGE: Record<GameEvent['type'], string> = {
  normal: 'bg-stone-100 text-stone-600',
  highlight: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
  insight: 'bg-purple-100 text-purple-700',
  breather: 'bg-green-100 text-green-700',
  milestone: 'bg-warm-200 text-warm-800',
}

const TYPE_LABEL: Record<GameEvent['type'], string> = {
  normal: '日常',
  highlight: '高光',
  low: '低谷',
  insight: '顿悟',
  breather: '喘息',
  milestone: '节点',
}

const OPTION_TYPE_LABEL: Record<StoryOption['type'], string> = {
  safe: '稳妥',
  adventure: '冒险',
  relationship: '关系',
  growth: '成长',
  acceptance: '接纳',
  meaning: '意义',
}

export function EventCard({ event, player, onSelect }: Props) {
  const visibleOptions = event.options.filter((option) => isOptionUnlocked(player, option))

  return (
    <motion.article
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[event.type]}`}>
          {TYPE_LABEL[event.type]}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-warm-800">{event.title}</h2>
      </div>

      <p className="text-stone-700 leading-relaxed text-base sm:text-lg mb-8">{event.story}</p>

      <div className="space-y-3">
        {visibleOptions.length === 0 ? (
          <p className="text-sm text-stone-500">当前没有可选择的选项，请刷新页面重试。</p>
        ) : (
          visibleOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => onSelect(option)}
              className="group w-full text-left px-5 py-4 rounded-xl border border-warm-200 hover:border-hope-400 hover:bg-hope-50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-stone-800 group-hover:text-hope-800 transition-colors">
                    {option.text}
                  </div>
                  {option.preview && (
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {option.preview}
                    </div>
                  )}
                </div>
                <div className="text-xs text-stone-400 capitalize ml-3 shrink-0">
                  {OPTION_TYPE_LABEL[option.type]}
                </div>
              </div>
            </motion.button>
          ))
        )}

        {event.options.some((option) => option.hidden) && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400 pt-1">
            <Lock className="w-3 h-3" />
            部分隐藏选项将根据你的属性或经历解锁
          </div>
        )}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-sm text-hope-600 italic flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {event.psychologyHint}
      </motion.p>
    </motion.article>
  )
}
