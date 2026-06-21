import { motion } from 'framer-motion'
import type { Attributes, Perma } from '@life-rerun/shared'

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  intelligence: '智力',
  physique: '体质',
  charm: '魅力',
  wealth: '家境',
  luck: '运气',
  resilience: '韧性',
}

const PERMA_LABELS: Record<keyof Perma, string> = {
  positive: '积极',
  engagement: '投入',
  relationships: '关系',
  meaning: '意义',
  achievement: '成就',
}

interface Props {
  attributes: Attributes
  perma: Perma
  resilience: number
}

export function AttributePanel({ attributes, perma, resilience }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm"
      aria-label="人物属性面板"
    >
      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">人物属性</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {Object.entries(attributes).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-stone-600 mb-1">
              <span>{ATTRIBUTE_LABELS[key as keyof Attributes]}</span>
              <span aria-label={`${ATTRIBUTE_LABELS[key as keyof Attributes]} ${value}`}>{value}</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-hope-400 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">PERMA 五维</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(perma).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-xs text-stone-500 mb-1">{PERMA_LABELS[key as keyof Perma]}</div>
            <div className="text-lg font-bold text-warm-700" aria-label={`${PERMA_LABELS[key as keyof Perma]} ${value}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
        <span className="text-sm text-stone-600">心理韧性</span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={resilience} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${resilience}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-warm-500 rounded-full"
            />
          </div>
          <span className="text-sm font-semibold text-warm-700" aria-label={`心理韧性 ${resilience}`}>{resilience}</span>
        </div>
      </div>
    </motion.section>
  )
}
