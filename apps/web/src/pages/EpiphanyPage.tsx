import { motion } from 'framer-motion'
import type { GameEvent, StoryOption } from '@life-rerun/shared'
import { Lightbulb, Sparkles } from 'lucide-react'

interface Props {
  event: GameEvent
  onSelect: (option: StoryOption) => void
}

export function EpiphanyPage({ event, onSelect }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 shadow-sm border border-purple-100"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          顿悟
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-warm-800">{event.title}</h2>
      </div>

      <div className="bg-white/70 rounded-xl p-4 mb-6">
        <p className="text-stone-700 leading-relaxed text-base sm:text-lg">{event.story}</p>
      </div>

      <div className="flex items-start gap-3 mb-8 p-4 rounded-xl bg-purple-50/70 border border-purple-100">
        <Lightbulb className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800 leading-relaxed">
          叙事疗法提醒我们：刚才的经历只是一个正在面对的挑战，而不是你的定义。你依然可以重新书写自己的故事。
        </p>
      </div>

      <div className="space-y-3">
        {event.options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(option)}
            className="group w-full text-left px-5 py-4 rounded-xl border border-purple-100 bg-white hover:border-purple-300 hover:bg-purple-50 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-stone-800 group-hover:text-purple-800 transition-colors">
                  {option.text}
                </div>
                {option.preview && (
                  <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {option.preview}
                  </div>
                )}
              </div>
              <div className="text-xs text-stone-400 capitalize shrink-0">{option.type}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-sm text-purple-600 italic flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {event.psychologyHint}
      </motion.p>
    </motion.article>
  )
}
