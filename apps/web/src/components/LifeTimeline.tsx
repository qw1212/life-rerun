import { motion } from 'framer-motion'
import type { PlayerState, HistoryRecord } from '@life-rerun/shared'
import { Baby, Footprints, GraduationCap, Briefcase, Heart, Award, Star } from 'lucide-react'

interface Props {
  player: PlayerState
}

const STAGE_ICONS: Record<PlayerState['stage'], typeof Baby> = {
  childhood: Baby,
  adolescence: Footprints,
  youth: GraduationCap,
  middleAge: Briefcase,
  oldAge: Heart,
}

function stageForAge(age: number): PlayerState['stage'] {
  if (age <= 12) return 'childhood'
  if (age <= 18) return 'adolescence'
  if (age <= 35) return 'youth'
  if (age <= 55) return 'middleAge'
  return 'oldAge'
}

function formatChanges(record: HistoryRecord): string {
  const entries = Object.entries(record.attributeChanges)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => {
      const sign = (value as number) > 0 ? '+' : ''
      const label = ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS]
      return `${label}${sign}${value}`
    })
  return entries.join(' · ') || '平稳前行'
}

const ATTRIBUTE_LABELS = {
  intelligence: '智力',
  physique: '体质',
  charm: '魅力',
  wealth: '家境',
  luck: '运气',
  resilience: '韧性',
}

function isBraveChoice(record: HistoryRecord): boolean {
  const resilienceChange = record.attributeChanges.resilience || 0
  const positiveChanges = Object.values(record.attributeChanges).filter((v) => (v || 0) > 0).length
  return resilienceChange > 0 || positiveChanges >= 2
}

export function LifeTimeline({ player }: Props) {
  const records = player.history
  if (records.length === 0) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-sm text-center text-stone-500">
        你的人生故事才刚刚展开，未来会在这里留下足迹。
      </section>
    )
  }

  const grouped: Record<number, HistoryRecord[]> = {}
  for (const record of records) {
    grouped[record.age] = grouped[record.age] || []
    grouped[record.age].push(record)
  }
  const ages = Object.keys(grouped)
    .map((a) => Number(a))
    .sort((a, b) => a - b)

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <Award className="w-4 h-4" />
        人生足迹
      </h3>

      <div className="relative pl-4">
        <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-stone-100" />

        <div className="space-y-6">
          {ages.map((age, ageIndex) => {
            const StageIcon = STAGE_ICONS[stageForAge(age)]
            return (
              <motion.div
                key={age}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ageIndex * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative z-10 w-9 h-9 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center border-4 border-white shadow-sm">
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-warm-800">{age} 岁</span>
                </div>

                <div className="ml-12 space-y-3">
                  {grouped[age].map((record, index) => (
                    <motion.div
                      key={`${record.age}-${record.eventId}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ageIndex * 0.05 + index * 0.05 }}
                      className={`rounded-xl border p-4 ${
                        isBraveChoice(record)
                          ? 'bg-hope-50/60 border-hope-200'
                          : 'bg-warm-50/50 border-stone-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-stone-800">{record.eventTitle}</div>
                        {isBraveChoice(record) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-hope-100 text-hope-700 shrink-0">
                            <Star className="w-3 h-3" />
                            勇敢选择
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-stone-600 mt-1">
                        选择：{record.selectedOptionText}
                      </div>
                      <div className="text-xs text-stone-500 mt-2">{formatChanges(record)}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
