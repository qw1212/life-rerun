import { motion } from 'framer-motion'
import {
  CRISIS_RESOURCES,
  CRISIS_DISCLAIMER,
  CRISIS_HARD_BLOCK_NOTICE,
  type RiskAssessment,
} from '@life-rerun/shared'
import { LifeBuoy, Phone, ExternalLink, LogOut } from 'lucide-react'

interface Props {
  risk: RiskAssessment
  onAcknowledge: () => void
  onExit: () => void
}

const REGION_LABELS: Record<(typeof CRISIS_RESOURCES)[number]['region'], string> = {
  emergency: '紧急情况',
  mainland: '心理援助热线',
  international: '其他地区',
}

const REGION_ORDER: (typeof CRISIS_RESOURCES)[number]['region'][] = [
  'emergency',
  'mainland',
  'international',
]

export function CrisisOverlay({ risk, onAcknowledge, onExit }: Props) {
  const grouped = REGION_ORDER.map((region) => ({
    region,
    items: CRISIS_RESOURCES.filter((r) => r.region === region),
  })).filter((g) => g.items.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-warm-50"
      role="dialog"
      aria-modal="true"
      aria-label="危机支持"
    >
      <div className="min-h-full flex items-start justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 my-4"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-warm-800">
              <LifeBuoy className="w-6 h-6 text-hope-500" />
              <h1 className="text-xl sm:text-2xl font-bold">先停一下，好吗？</h1>
            </div>
            <p className="text-stone-700 leading-relaxed">{CRISIS_HARD_BLOCK_NOTICE}</p>
            <p className="text-sm text-stone-600 leading-relaxed">{CRISIS_DISCLAIMER}</p>
          </div>

          <div
            className="rounded-xl bg-stone-50 border border-stone-100 p-4 space-y-1"
            aria-label="触发提示的依据"
          >
            <p className="text-xs text-stone-500">触发提示的依据</p>
            <ul className="text-sm text-stone-700 space-y-0.5">
              {risk.reasons.map((reason) => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.region} className="space-y-2">
                <h2 className="text-sm font-semibold text-warm-800">
                  {REGION_LABELS[group.region]}
                </h2>
                <div className="space-y-2">
                  {group.items.map((resource) => {
                    const isPhone = /^[\d-]+$/.test(resource.contact)
                    const href = isPhone ? `tel:${resource.contact}` : resource.contact
                    return (
                      <a
                        key={resource.name}
                        href={href}
                        target={isPhone ? undefined : '_blank'}
                        rel={isPhone ? undefined : 'noopener noreferrer'}
                        className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 hover:border-hope-300 hover:bg-hope-50/50 transition-colors"
                      >
                        <span className="mt-0.5 text-hope-500 shrink-0">
                          {isPhone ? <Phone className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium text-stone-800">
                            {resource.name}
                            <span className="ml-2 font-normal text-hope-700">{resource.contact}</span>
                          </span>
                          <span className="block text-xs text-stone-500 mt-0.5">
                            {resource.description}
                            {resource.hours !== '—' && ` · ${resource.hours}`}
                          </span>
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-400 leading-relaxed">
            以上资源由运营方维护，请以当地公布的最新信息为准。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-stone-100">
            <button
              onClick={onAcknowledge}
              className="flex-1 px-5 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl font-medium transition-colors"
            >
              我已了解，仍想继续
            </button>
            <button
              onClick={onExit}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-hope-500 hover:bg-hope-600 text-white rounded-xl font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              先离开，去照顾自己
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
