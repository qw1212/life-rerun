import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Heart } from 'lucide-react'
import {
  ATTRIBUTE_META,
  drawTalents,
  type AttributeKey,
  type Talent,
} from '@life-rerun/shared'
import {
  applyTalentEffects,
  getInitialAttributes,
  getInitialResilience,
} from '../utils/balance.js'

interface Props {
  onCreate: (name: string, talents: Talent[], mood: string) => void
}

const MOODS = ['期待', '平静', '焦虑', '喜悦', '感恩']

export function CharacterCreationPage({ onCreate }: Props) {
  const [name, setName] = useState('')
  const [talents, setTalents] = useState<Talent[]>(() => drawTalents(3))
  const [mood, setMood] = useState('期待')
  const [error, setError] = useState('')

  const attributes = useMemo(
    () => applyTalentEffects(getInitialAttributes(), talents),
    [talents]
  )
  const resilience = useMemo(() => getInitialResilience(talents), [talents])

  function rerollTalents() {
    setTalents(drawTalents(3))
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError('请给角色取一个名字')
      return
    }
    onCreate(name.trim(), talents, mood)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-warm-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        <h1 className="text-2xl font-bold text-warm-800 text-center">创建你的角色</h1>

        <div>
          <label htmlFor="player-name" className="block text-sm font-medium text-stone-700 mb-2">
            角色名字
          </label>
          <input
            id="player-name"
            type="text"
            value={name}
            maxLength={24}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSubmit()
            }}
            placeholder="例如：小安"
            className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-hope-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-700">随机天赋</span>
            <button
              onClick={rerollTalents}
              className="flex items-center gap-1 text-xs text-hope-600 hover:text-hope-700"
            >
              <Shuffle className="w-3 h-3" />
              重新抽取
            </button>
          </div>
          <div className="space-y-3">
            {talents.map((talent) => (
              <div key={talent.id} className="p-4 rounded-xl bg-warm-50 border border-warm-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-warm-800">{talent.name}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-stone-500 shrink-0">
                    {talent.type === 'special'
                      ? '特殊'
                      : talent.type === 'psychology'
                        ? '心理'
                        : '普通'}
                  </span>
                </div>
                <div className="text-sm text-stone-600 mt-1">{talent.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-stone-700 mb-2">此刻心情</span>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((option) => (
              <button
                key={option}
                onClick={() => setMood(option)}
                aria-pressed={mood === option}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  mood === option
                    ? 'bg-hope-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-hope-500" />
            <span className="text-sm font-medium">初始状态（已计入天赋）</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(Object.keys(ATTRIBUTE_META) as AttributeKey[]).map((key) => (
              <div key={key} className="bg-white rounded-lg py-2">
                <div className="text-xs text-stone-500">{ATTRIBUTE_META[key].label}</div>
                <div className="text-base font-bold text-warm-700">{attributes[key]}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-stone-500 text-center">
            初始心理韧性 {resilience} · 属性会随着你的选择继续变化
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-hope-500 hover:bg-hope-600 text-white rounded-xl font-medium transition-colors"
        >
          确认，开始人生
        </button>
      </motion.div>
    </main>
  )
}
