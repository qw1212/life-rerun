import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  EVENT_TYPE_META,
  getLifeStage,
  type PlayerState,
  type HistoryRecord,
} from '@life-rerun/shared'
import {
  Baby,
  Footprints,
  GraduationCap,
  Briefcase,
  Heart,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Props {
  player: PlayerState
  /** 初始展示的最近记录数量，其余收进「展开」 */
  initialCount?: number
}

const STAGE_ICONS: Record<PlayerState['stage'], typeof Baby> = {
  childhood: Baby,
  adolescence: Footprints,
  youth: GraduationCap,
  middleAge: Briefcase,
  oldAge: Heart,
}

const TYPE_BADGE: Record<HistoryRecord['eventType'], string> = {
  normal: 'bg-stone-100 text-stone-600',
  highlight: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
  insight: 'bg-purple-100 text-purple-700',
  breather: 'bg-green-100 text-green-700',
  milestone: 'bg-warm-200 text-warm-800',
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  intelligence: '智力',
  physique: '体质',
  charm: '魅力',
  wealth: '家境',
  luck: '运气',
  resilience: '韧性',
}

function formatChanges(record: HistoryRecord): string {
  const entries = Object.entries(record.attributeChanges)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => {
      const sign = (value as number) > 0 ? '+' : ''
      const label = ATTRIBUTE_LABELS[key] || key
      return `${label}${sign}${value}`
    })
  return entries.join(' · ') || '平稳前行'
}

function isBraveChoice(record: HistoryRecord): boolean {
  const resilienceChange = record.attributeChanges.resilience || 0
  const positiveChanges = Object.values(record.attributeChanges).filter((v) => (v || 0) > 0).length
  return resilienceChange > 0 || positiveChanges >= 2
}

export function LifeTimeline({ player, initialCount = 6 }: Props) {
  const [expanded, setExpanded] = useState(false)
  const records = player.history

  if (records.length === 0) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-sm text-center text-stone-500">
        你的人生故事才刚刚展开，未来会在这里留下足迹。
      </section>
    )
  }

  const displayed = expanded ? records : records.slice(-initialCount)
  const grouped = new Map<number, HistoryRecord[]>()
  for (const record of displayed) {
    const bucket = grouped.get(record.age)
    if (bucket) bucket.push(record)
    else grouped.set(record.age, [record])
  }
  const ages = Array.from(grouped.keys()).sort((a, b) => a - b)
  const hiddenCount = records.length - displayed.length

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4" />
          人生足迹
          <span className="font-normal normal-case text-stone-400">共 {records.length} 个时刻</span>
        </h3>
        {records.length > initialCount && (
          <button
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-1 text-xs text-hope-600 hover:text-hope-700 transition-colors"
          >
            {expanded ? (
              <>
                收起 <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                展开全部（{hiddenCount}） <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative pl-4">
        <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-stone-100" />

        <div className="space-y-6">
          {ages.map((age, ageIndex) => {
            const StageIcon = STAGE_ICONS[getLifeStage(age)]
            return (
              <motion.div
                key={age}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(ageIndex, 6) * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative z-10 w-9 h-9 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center border-4 border-white shadow-sm">
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-warm-800">{age} 岁</span>
                </div>

                <div className="ml-12 space-y-3">
                  {grouped.get(age)?.map((record, index) => {
                    const typeMeta = EVENT_TYPE_META[record.eventType]
                    return (
                      <motion.div
                        key={`${record.age}-${record.eventId}-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(ageIndex, 6) * 0.05 + index * 0.05 }}
                        className={`rounded-xl border p-4 ${
                          isBraveChoice(record)
                            ? 'bg-hope-50/60 border-hope-200'
                            : 'bg-warm-50/50 border-stone-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span
                              title={typeMeta.description}
                              className={`mr-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_BADGE[record.eventType]}`}
                            >
                              {typeMeta.label}
                            </span>
                            <span className="font-medium text-stone-800">{record.eventTitle}</span>
                          </div>
                          {isBraveChoice(record) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-hope-100 text-hope-700 shrink-0">
                              <Star className="w-3 h-3" />
                              勇敢选择
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-stone-600 mt-1.5">
                          选择：{record.selectedOptionText}
                        </div>
                        <div className="text-xs text-stone-500 mt-2">{formatChanges(record)}</div>
                        {record.psychologyHint && (
                          <div className="text-xs text-hope-600/80 mt-1.5 italic">
                            {record.psychologyHint}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
