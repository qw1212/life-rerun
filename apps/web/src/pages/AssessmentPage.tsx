import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getAssessmentScale,
  isAssessmentComplete,
  scoreAssessment,
  CRISIS_DISCLAIMER,
  type AssessmentPhase,
  type AssessmentResult,
  type AssessmentScaleId,
} from '@life-rerun/shared'
import { ShieldCheck, ClipboardList, ArrowRight, Info } from 'lucide-react'

interface Props {
  phase: AssessmentPhase
  scales: AssessmentScaleId[]
  onComplete: (results: AssessmentResult[]) => void
  /** 问卷完全自愿，必须允许跳过；不传则不显示跳过入口 */
  onSkip?: () => void
}

const PHASE_COPY: Record<AssessmentPhase, { title: string; subtitle: string }> = {
  pre: {
    title: '开始前，先花两分钟了解此刻的自己',
    subtitle: '这两份问卷会帮助你在旅程结束后，看到自己的变化。',
  },
  post: {
    title: '旅程结束，再看看现在的你',
    subtitle: '同样的两份问卷，用来自我对照，不代表任何诊断结论。',
  },
}

export function AssessmentPage({ phase, scales, onComplete, onSkip }: Props) {
  // 前测需要阅读知情同意；后测是玩家自己点进来的重复填写，不再重复拦截
  const [consented, setConsented] = useState(phase !== 'pre')
  const [scaleIndex, setScaleIndex] = useState(0)
  const [current, setCurrent] = useState<number[]>([])
  const [collected, setCollected] = useState<AssessmentResult[]>([])

  const scaleId = scales[scaleIndex]
  const scale = useMemo(() => getAssessmentScale(scaleId), [scaleId])
  const copy = PHASE_COPY[phase]
  const complete = isAssessmentComplete(scaleId, current)
  const answeredCount = current.filter((a) => a !== undefined).length
  const crisisItemPositive = scale.crisisItemIndex !== undefined && (current[scale.crisisItemIndex] ?? 0) > 0

  function setAnswer(index: number, value: number) {
    setCurrent((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function handleSubmit() {
    if (!complete) return
    const score = scoreAssessment(scaleId, current)
    const result: AssessmentResult = {
      scale: scaleId,
      phase,
      answers: current,
      completedAt: new Date().toISOString(),
      ...score,
    }
    const next = [...collected, result]

    if (scaleIndex + 1 < scales.length) {
      setCollected(next)
      setScaleIndex(scaleIndex + 1)
      setCurrent([])
      window.scrollTo({ top: 0 })
      return
    }

    onComplete(next)
  }

  if (!consented) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-warm-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-3 text-warm-800">
            <ShieldCheck className="w-6 h-6 text-hope-500" />
            <h1 className="text-xl sm:text-2xl font-bold">知情同意与重要说明</h1>
          </div>

          <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
            <p>
              接下来你会填写两份公开的心理健康自评问卷（PHQ-9 与 GAD-7）。它们可以帮助你了解最近两周的情绪状态，
              但<strong className="text-warm-800">结果不是诊断</strong>，也不能替代精神科医生或心理治疗师的专业评估。
            </p>
            <p>
              你的作答仅保存在你自己的设备上（浏览器本地存储），不会用于任何诊断用途。
              你可以在任何时候退出，不需要填写任何理由。
            </p>
            <p className="text-stone-600">{CRISIS_DISCLAIMER}</p>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-hope-50 border border-hope-100">
            <Info className="w-5 h-5 text-hope-500 mt-0.5 shrink-0" />
            <p className="text-sm text-hope-800 leading-relaxed">
              若问卷提示你可能需要支持，我们会向你展示专业求助资源。是否继续使用本产品，始终由你自己决定。
            </p>
          </div>

          <button
            onClick={() => setConsented(true)}
            className="w-full px-6 py-3.5 bg-hope-500 hover:bg-hope-600 text-white rounded-xl font-medium transition-colors"
          >
            我已阅读并理解，开始填写
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full px-6 py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              暂不填写，直接开始
            </button>
          )}
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 bg-warm-50">
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-hope-600 text-sm font-medium">
              <ClipboardList className="w-4 h-4" />
              {phase === 'pre' ? '开始前的自我了解' : '结束后的自我对照'}
              {scales.length > 1 && (
                <span className="text-stone-400 font-normal">
                  （第 {scaleIndex + 1} / {scales.length} 份）
                </span>
              )}
            </div>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-xs text-stone-500 hover:text-stone-700 underline shrink-0"
              >
                跳过评估
              </button>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-warm-800">{copy.title}</h1>
          <p className="text-sm text-stone-600">{copy.subtitle}</p>
        </motion.header>

        <motion.section
          key={scaleId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-5"
        >
          <div className="space-y-1">
            <h2 className="font-bold text-warm-800">
              {scale.name}
              <span className="font-normal text-stone-500 text-sm ml-2">{scale.fullName}</span>
            </h2>
            <p className="text-sm text-stone-600">{scale.instruction}</p>
          </div>

          <div className="space-y-4">
            {scale.items.map((item, index) => {
              const selected = current[index]
              return (
                <div key={index} className="space-y-2">
                  <p className="text-sm text-stone-800 leading-relaxed">
                    {index + 1}. {item}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {scale.options.map((option) => {
                      const active = selected === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAnswer(index, option.value)}
                          aria-pressed={active}
                          className={`px-3 py-2 rounded-lg text-xs sm:text-sm border transition-colors ${
                            active
                              ? 'bg-hope-500 border-hope-500 text-white'
                              : 'bg-white border-stone-200 text-stone-700 hover:border-hope-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  {scale.crisisItemIndex === index && selected !== undefined && selected > 0 && (
                    <p className="text-xs text-warm-700 bg-warm-50 border border-warm-100 rounded-lg p-3 leading-relaxed">
                      谢谢你写下这一点。这种念头本身往往意味着痛苦已经很难独自承受了，
                      它值得被认真对待，也值得有人陪着你一起面对。
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <AnimatePresence>
            {crisisItemPositive && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-stone-500"
              >
                提交后我们会为你展示专业的求助资源。
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-500">
              已完成 {answeredCount} / {scale.itemCount} 题
            </span>
            <button
              onClick={handleSubmit}
              disabled={!complete}
              className="flex items-center gap-2 px-6 py-2.5 bg-hope-500 hover:bg-hope-600 text-white rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scaleIndex + 1 < scales.length ? '下一份问卷' : '提交'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.section>

        <p className="text-xs text-stone-400 text-center leading-relaxed px-4">
          {scale.source}
        </p>
      </div>
    </main>
  )
}
