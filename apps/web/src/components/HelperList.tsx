import { motion, AnimatePresence } from 'framer-motion'
import type { PlayerState } from '@life-rerun/shared'
import { Users, GraduationCap, HeartHandshake, Sparkles } from 'lucide-react'

interface Props {
  helpers: PlayerState['helpers']
}

const ROLE_ICON: Record<PlayerState['helpers'][number]['role'], typeof GraduationCap> = {
  mentor: GraduationCap,
  friend: HeartHandshake,
  partner: HeartHandshake,
  stranger: Sparkles,
}

const ROLE_LABEL: Record<PlayerState['helpers'][number]['role'], string> = {
  mentor: '导师',
  friend: '挚友',
  partner: '伙伴',
  stranger: '过客',
}

export function HelperList({ helpers }: Props) {
  if (helpers.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-warm-800 flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-hope-500" />
        人生贵人
      </h3>
      <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {helpers.map((helper) => {
            const Icon = ROLE_ICON[helper.role]
            return (
              <motion.div
                key={helper.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-2 bg-hope-50 text-hope-800 rounded-xl text-sm"
                title={helper.description}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{helper.name}</span>
                <span className="text-xs opacity-75">· {ROLE_LABEL[helper.role]}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
