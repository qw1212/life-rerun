import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wind } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const AFFIRMATIONS = [
  '我在这里，我是安全的。',
  '每一次呼吸，都是一次新的开始。',
  '感受此刻，放下对过去的责备。',
  '我的价值不取决于任何一次选择。',
  '允许自己慢慢来。',
]

export function BreathingOverlay({ open, onClose }: Props) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!open) return
    const cycle = [
      { phase: 'inhale' as const, duration: 4000 },
      { phase: 'hold' as const, duration: 2000 },
      { phase: 'exhale' as const, duration: 4000 },
    ]
    let step = 0
    let mounted = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    function next() {
      if (!mounted) return
      const current = cycle[step % cycle.length]
      setPhase(current.phase)
      step += 1
      timeoutId = setTimeout(next, current.duration)
    }

    next()
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % AFFIRMATIONS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-warm-50/95 backdrop-blur-sm p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white shadow-sm text-stone-600 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-8 max-w-md w-full">
            <div className="flex items-center justify-center gap-2 text-warm-700">
              <Wind className="w-5 h-5" />
              <span className="font-medium">暂停一下，深呼吸</span>
            </div>

            <div className="relative flex items-center justify-center h-56">
              <motion.div
                animate={{
                  scale: phase === 'inhale' ? 1.6 : phase === 'hold' ? 1.6 : 1,
                  opacity: phase === 'hold' ? 0.9 : 0.7,
                }}
                transition={{ duration: phase === 'hold' ? 0.2 : 4, ease: 'easeInOut' }}
                className="absolute w-32 h-32 rounded-full bg-hope-200"
              />
              <motion.div
                animate={{
                  scale: phase === 'inhale' ? 1.35 : phase === 'hold' ? 1.35 : 1,
                  opacity: phase === 'hold' ? 0.85 : 0.6,
                }}
                transition={{ duration: phase === 'hold' ? 0.2 : 4, ease: 'easeInOut' }}
                className="absolute w-32 h-32 rounded-full bg-hope-300"
              />
              <div className="relative z-10 w-32 h-32 rounded-full bg-white shadow-md flex items-center justify-center">
                <span className="text-lg font-medium text-hope-700">
                  {phase === 'inhale' && '吸气'}
                  {phase === 'hold' && '屏息'}
                  {phase === 'exhale' && '呼气'}
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="text-xl text-stone-700 font-medium leading-relaxed"
              >
                {AFFIRMATIONS[index]}
              </motion.p>
            </AnimatePresence>

            <p className="text-sm text-stone-500">
              如果你正经历严重心理困扰，请寻求专业帮助。
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
