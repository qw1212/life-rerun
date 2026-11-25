import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ATTRIBUTE_META,
  PERMA_META,
  getAssessmentScale,
  type AssessmentResult,
  type AttributeKey,
  type Perma,
  type PlayerState,
} from '@life-rerun/shared'
import { BookOpen, ClipboardList, Download, Heart, RotateCcw } from 'lucide-react'
import { LifeTimeline } from '../components/LifeTimeline.js'

interface Props {
  player: PlayerState
  assessments: AssessmentResult[]
  keptQuality: string | null
  onSelectQuality: (quality: string) => void
  onExport: () => void
  onReset: () => void
  onStartPostAssessment: () => void
}

const PERMA_KEYS = Object.keys(PERMA_META) as (keyof Perma)[]

function topPerma(player: PlayerState): keyof Perma {
  return PERMA_KEYS.reduce((best, key) =>
    player.perma[key] > player.perma[best] ? key : best
  )
}

function getKeptQualityOptions(player: PlayerState): string[] {
  const attributeOptions = (Object.keys(ATTRIBUTE_META) as AttributeKey[])
    .filter((key) => key !== 'wealth' && key !== 'luck')
    .sort((a, b) => player.attributes[b] - player.attributes[a])
    .slice(0, 2)
    .map((key) => ATTRIBUTE_META[key].label)

  const permaOptions = [...PERMA_KEYS]
    .sort((a, b) => player.perma[b] - player.perma[a])
    .slice(0, 2)
    .map((key) => PERMA_META[key].label)

  return Array.from(new Set([...permaOptions, ...attributeOptions, '爱', '希望', '勇气']))
}

function generateEndingTitle(player: PlayerState): string {
  const themeTitles: Record<PlayerState['theme'], string> = {
    academic: '求知的守望者',
    startup: '创造价值的旅人',
    art: '用心感光的艺术家',
    social: '点亮他人的火炬手',
    ordinary: '平凡日子的收藏家',
    undecided: '独一无二的人生书写者',
  }
  if (player.theme !== 'undecided') return themeTitles[player.theme]

  const permaTitles: Record<keyof Perma, string> = {
    positive: '温柔的感受者',
    engagement: '沉浸的专注者',
    relationships: '彼此照亮的人',
    meaning: '寻找意义的行者',
    achievement: '踏实的前行者',
  }
  return permaTitles[topPerma(player)]
}

function generateSummary(player: PlayerState): string {
  const lowCount = player.history.filter((record) => record.eventType === 'low').length
  const growthCount = player.history.filter(
    (record) => record.selectedOptionType === 'growth'
  ).length
  const relationshipCount = player.history.filter(
    (record) => record.selectedOptionType === 'relationship'
  ).length

  const parts = [
    `${player.name} 走过了 ${player.age} 年的人生，留下了 ${player.history.length} 个重要时刻。`,
  ]

  if (lowCount > 0) {
    parts.push(`其中有 ${lowCount} 段低谷，但每一次都成为了重新理解自己的入口。`)
  } else {
    parts.push('这一路平稳而温暖，你积累了足够的内在力量。')
  }

  if (growthCount > 0) {
    parts.push(`你做出了 ${growthCount} 次指向成长的选择，这些选择一点点塑造了你是谁。`)
  }
  if (relationshipCount > 0) {
    parts.push(`你也有 ${relationshipCount} 次把身边的人放在前面，关系因此有了重量。`)
  }
  if (player.helpers.length > 0) {
    parts.push(
      `一路上，${player.helpers.map((helper) => helper.name).join('、')} 曾与你同行。`
    )
  }
  if (player.gratitudeLog.length > 0) {
    parts.push(`你记下了 ${player.gratitudeLog.length} 件微小而具体的美好。`)
  }

  return parts.join('')
}

function generateGrowthReport(player: PlayerState): string {
  const resilience = player.resilience
  const top = PERMA_META[topPerma(player)]

  const base =
    resilience >= 80
      ? '你的心理韧性令人钦佩，已经能够把挑战转化为资源。'
      : resilience >= 60
        ? '你拥有不错的心理韧性，未来也能继续稳步成长。'
        : resilience >= 40
          ? '你正在学习照顾自己，允许自己慢慢来。'
          : '请记得，人生价值从不取决于属性数值，你依然值得被温柔以待。'

  return `${base}这一生里，你最容易获得力量的地方是「${top.label}」——${top.description}。`
}

function generateAchievement(player: PlayerState): string {
  const maxAttribute = (Object.keys(ATTRIBUTE_META) as AttributeKey[]).sort(
    (a, b) => player.attributes[b] - player.attributes[a]
  )[0]
  const top = topPerma(player)
  return `最突出的品质：${ATTRIBUTE_META[maxAttribute].label} ${player.attributes[maxAttribute]}；最充盈的 PERMA 维度：${PERMA_META[top].label} ${player.perma[top]}。`
}

function RadarChart({ perma }: { perma: Perma }) {
  const keys = PERMA_KEYS
  const count = keys.length
  const radius = 70
  const center = 90
  const angleFor = (index: number) => (Math.PI * 2 * index) / count - Math.PI / 2

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]
  const points = keys.map((key, index) => {
    const value = perma[key] / 100
    const angle = angleFor(index)
    return {
      x: center + radius * value * Math.cos(angle),
      y: center + radius * value * Math.sin(angle),
      labelX: center + (radius + 24) * Math.cos(angle),
      labelY: center + (radius + 24) * Math.sin(angle),
      label: PERMA_META[key].label,
      value: perma[key],
    }
  })

  return (
    <svg viewBox="0 0 180 180" className="w-full max-w-[240px] mx-auto" role="img" aria-label="PERMA 五维雷达图">
      {gridLevels.map((level) => {
        const r = radius * level
        const polygonPoints = keys
          .map((_, index) => {
            const angle = angleFor(index)
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
      {points.map((point, index) => (
        <line
          key={index}
          x1={center}
          y1={center}
          x2={point.labelX}
          y2={point.labelY}
          stroke="#e7e5e4"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        fill="rgba(34, 197, 94, 0.2)"
        stroke="#22c55e"
        strokeWidth="2"
      />
      {points.map((point, index) => (
        <g key={index}>
          <circle cx={point.x} cy={point.y} r="3" fill="#22c55e" />
          <text
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-stone-600"
          >
            {point.label}
          </text>
          <text
            x={point.labelX}
            y={point.labelY + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] fill-stone-400"
          >
            {point.value}
          </text>
        </g>
      ))}
    </svg>
  )
}

type AssessmentRow = {
  meta: ReturnType<typeof getAssessmentScale>
  pre: AssessmentResult
  post: AssessmentResult
}

function AssessmentComparison({ assessments }: { assessments: AssessmentResult[] }) {
  const rows = useMemo<AssessmentRow[]>(() => {
    const ids = Array.from(new Set(assessments.map((result) => result.scale)))
    return ids.flatMap((id) => {
      const pre = assessments.find((result) => result.scale === id && result.phase === 'pre')
      const post = assessments.find((result) => result.scale === id && result.phase === 'post')
      if (!pre || !post) return []
      return [{ meta: getAssessmentScale(id), pre, post }]
    })
  }, [assessments])

  if (rows.length === 0) {
    return (
      <p className="text-sm text-stone-600 leading-relaxed">
        只有同一份问卷的前测与后测都完成时才能对照。你可以重新填写结束评估，或者把这次自评当作一次独立的自我观察。
      </p>
    )
  }

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
        分数变化会受很多因素影响（当天状态、作答时间点、对题目的理解等），它只反映你两次自评的差异，
        不能用来证明本产品具有任何疗效。若分数落在中度及以上区间，建议寻求专业评估。
      </p>
    </div>
  )
}

export function EndingPage({
  player,
  assessments,
  keptQuality,
  onSelectQuality,
  onExport,
  onReset,
  onStartPostAssessment,
}: Props) {
  const qualityOptions = useMemo(() => getKeptQualityOptions(player), [player])
  const hasPostAssessment = assessments.some((result) => result.phase === 'post')

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
          <h1 className="text-3xl sm:text-4xl font-bold text-warm-800">
            {generateEndingTitle(player)}
          </h1>
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
            <>
              <AssessmentComparison assessments={assessments} />
              <button
                onClick={onStartPostAssessment}
                className="text-xs text-stone-500 hover:text-stone-700 underline"
              >
                重新填写结束评估
              </button>
            </>
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
          <div className="flex flex-wrap gap-2" role="group" aria-label="选择想保留的品质">
            {qualityOptions.map((quality) => (
              <button
                key={quality}
                onClick={() => onSelectQuality(quality)}
                aria-pressed={keptQuality === quality}
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

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-bold text-warm-800 px-1">人生之书</h2>
          <LifeTimeline player={player} initialCount={8} />
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pb-6"
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
