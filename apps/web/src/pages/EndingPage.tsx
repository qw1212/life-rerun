import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  getAssessmentScale,
  type AssessmentResult,
  type PlayerState,
  type Perma,
} from '@life-rerun/shared'
import { BookOpen, RotateCcw, Download, Heart, ClipboardList } from 'lucide-react'

interface Props {
  player: PlayerState
  assessments: AssessmentResult[]
  onExport: () => void
  onReset: () => void
  onStartPostAssessment: () => void
}

const PERMA_LABELS: Record<keyof Perma, string> = {
  positive: '积极情绪',
  engagement: '投入',
  relationships: '关系',
  meaning: '意义',
  achievement: '成就',
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  intelligence: '智慧',
  physique: '健康',
  charm: '善意',
  wealth: '丰盈',
  luck: '勇气',
  resilience: '韧性',
}

function getKeptQualityOptions(player: PlayerState): string[] {
  const entries = Object.entries(player.attributes)
    .filter(([key]) => key !== 'wealth' && key !== 'luck')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => ATTRIBUTE_LABELS[key] || key)
  const permaEntries = Object.entries(player.perma)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => PERMA_LABELS[key as keyof Perma])
  return Array.from(new Set([...entries, ...permaEntries, '爱', '希望']))
}

function generateEndingTitle(player: PlayerState): string {
  const { theme } = player
  if (theme === 'academic') return '求知的守望者'
  if (theme === 'startup') return '创造价值的旅人'
  if (theme === 'art') return '用心感光的艺术家'
  if (theme === 'social') return '点亮他人的火炬手'
  if (theme === 'ordinary') return '平凡日子的收藏家'
  return '独一无二的人生书写者'
}

function generateSummary(player: PlayerState): string {
  const lowCount = player.history.filter((h) => h.eventType === 'low').length
  const growthCount = player.history.filter((h) => h.selectedOptionType === 'growth').length
  return `${player.name} 走过了 ${player.age} 年的人生，经历过 ${player.history.length} 个重要时刻。${
    lowCount > 0
      ? `其中有 ${lowCount} 段低谷，但每一次都成为了成长的入口。`
      : '这一路平稳而温暖，积累了足够的内在力量。'
  }${growthCount > 0 ? `你做出了 ${growthCount} 次指向成长的选择，这些选择定义了你是谁。` : ''}`
}

function generateGrowthReport(player: PlayerState): string {
  const resilience = player.resilience
  if (resilience >= 80) return '你的心理韧性令人钦佩，已经能够把挑战转化为资源。'
  if (resilience >= 60) return '你拥有不错的心理韧性，未来也能继续稳步成长。'
  if (resilience >= 40) return '你正在学习照顾自己，允许自己慢慢来。'
  return '请记得，人生价值从不取决于属性数值，你依然值得被温柔以待。'
}

function generateAchievement(player: PlayerState): string {
  const maxAttr = Object.entries(player.attributes).sort((a, b) => b[1] - a[1])[0]
  const maxPerma = Object.entries(player.perma).sort((a, b) => b[1] - a[1])[0]
  return `最高属性：${ATTRIBUTE_LABELS[maxAttr[0]] || maxAttr[0]} ${maxAttr[1]}；最突出的 PERMA 维度：${
    PERMA_LABELS[maxPerma[0] as keyof Perma]
  } ${maxPerma[1]}。`
}

function RadarChart({ perma }: { perma: Perma }) {
  const keys = Object.keys(perma) as (keyof Perma)[]
  const count = keys.length
  const radius = 70
  const center = 90
  const angleFor = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]
  const points = keys.map((key, i) => {
    const value = perma[key] / 100
    const angle = angleFor(i)
    return {
      x: center + radius * value * Math.cos(angle),
      y: center + radius * value * Math.sin(angle),
      labelX: center + (radius + 24) * Math.cos(angle),
      labelY: center + (radius + 24) * Math.sin(angle),
      label: PERMA_LABELS[key],
      value: perma[key],
    }
  })

  return (
    <svg viewBox="0 0 180 180" className="w-full max-w-[240px] mx-auto">
      {gridLevels.map((level) => {
        const r = radius * level
        const polygonPoints = keys
          .map((_, i) => {
            const angle = angleFor(i)
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
          })
          .join(' ')
        return (
          <polygon
            key={level}
            points={polygonPoints}
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="1"
          />
        )
      })}
      {points.map((p, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={p.labelX}
          y2={p.labelY}
          stroke="#e7e5e4"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(34, 197, 94, 0.2)"
        stroke="#22c55e"
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#22c55e" />
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-stone-600"
          >
            {p.label}
          </text>
          <text
            x={p.labelX}
            y={p.labelY + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] fill-stone-400"
          >
            {p.value}
          </text>
        </g>
      ))}
    </svg>
  )
}

function AssessmentComparison({ assessments }: { assessments: AssessmentResult[] }) {
  const rows = useMemo(() => {
    const ids = Array.from(new Set(assessments.map((a) => a.scale)))
    return ids
      .map((id) => ({
        meta: getAssessmentScale(id),
        pre: assessments.find((a) => a.scale === id && a.phase === 'pre'),
        post: assessments.find((a) => a.scale === id && a.phase === 'post'),
      }))
      .filter((row): row is { meta: ReturnType<typeof getAssessmentScale>; pre: AssessmentResult; post: AssessmentResult } =>
        Boolean(row.pre && row.post)
      )
  }, [assessments])

  if (rows.length === 0) return null

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const delta = row.post.totalScore - row.pre.totalScore
        return (
          <div key={row.meta.id} className="rounded-xl border border-stone-200 p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-stone-800">{row.meta.name}</span>
              <span
                className={`text-sm font-medium ${
                  delta < 0 ? 'text-hope-600' : delta > 0 ? 'text-warm-700' : 'text-stone-500'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-stone-600">
                前测：<span className="text-stone-800 font-medium">{row.pre.totalScore}</span> 分
                <span className="block text-xs text-stone-500 mt-0.5">{row.pre.severityLabel}</span>
              </div>
              <div className="text-stone-600">
                后测：<span className="text-stone-800 font-medium">{row.post.totalScore}</span> 分
                <span className="block text-xs text-stone-500 mt-0.5">{row.post.severityLabel}</span>
              </div>
            </div>
          </div>
        )
      })}
      <p className="text-xs text-stone-400 leading-relaxed">
        分数变化会受很多因素影响（当天状态、作答时间点、对题目的理解等），
        它只反映你两次自评的差异，不能用来证明本产品具有任何疗效。
        若分数落在中度及以上区间，建议寻求专业评估。
      </p>
    </div>
  )
}

export function EndingPage({
  player,
  assessments,
  onExport,
  onReset,
  onStartPostAssessment,
}: Props) {
  const [keptQuality, setKeptQuality] = useState<string | null>(null)
  const qualityOptions = useMemo(() => getKeptQualityOptions(player), [player])
  const hasPostAssessment = assessments.some((a) => a.phase === 'post')

  return (
    <main className="min-h-screen p-4 sm:p-6 bg-warm-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex justify-center">
            <BookOpen className="w-12 h-12 text-hope-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-warm-800">{generateEndingTitle(player)}</h1>
          <p className="text-stone-600">{player.name} 的人生之书已写完</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-warm-800">人生总结</h2>
          <p className="text-stone-700 leading-relaxed">{generateSummary(player)}</p>
          <p className="text-sm text-stone-500">{generateAchievement(player)}</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-warm-800">PERMA 五维雷达</h2>
          <RadarChart perma={player.perma} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-warm-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-hope-500" />
            心理成长报告
          </h2>
          <p className="text-stone-700 leading-relaxed">{generateGrowthReport(player)}</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-warm-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-hope-500" />
            情绪自评对照
          </h2>
          {hasPostAssessment ? (
            <AssessmentComparison assessments={assessments} />
          ) : (
            <>
              <p className="text-sm text-stone-600 leading-relaxed">
                再花两分钟填写一次开始时的两份问卷，可以看到自己在这段旅程前后的自评差异。
                这不是疗效证明，只是一次自我对照。
              </p>
              <button
                onClick={onStartPostAssessment}
                className="px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-sm font-medium transition-colors"
              >
                填写结束评估
              </button>
            </>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-warm-800">你最想保留的品质</h2>
          <p className="text-sm text-stone-600">
            叙事疗法说：我们可以选择让哪些品质继续定义自己。请选择一个你最想带走的力量。
          </p>
          <div className="flex flex-wrap gap-2">
            {qualityOptions.map((quality) => (
              <button
                key={quality}
                onClick={() => setKeptQuality(quality)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  keptQuality === quality
                    ? 'bg-hope-500 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
          {keptQuality && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-hope-700 text-sm"
            >
              你选择了「{keptQuality}」。愿它在你接下来真实的人生里继续发光。
            </motion.p>
          )}
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-hope-500 hover:bg-hope-600 text-white rounded-full font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            导出人生之书
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-full font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            再活一次
          </button>
        </motion.div>
      </div>
    </main>
  )
}
