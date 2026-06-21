import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Heart } from 'lucide-react'
import { drawTalents, type Talent } from '@life-rerun/shared'

interface Props {
  onCreate: (name: string, talents: Talent[], mood: string) => void
}

const MOODS = ['期待', '平静', '焦虑', '喜悦', '感恩']

export function CharacterCreationPage({ onCreate }: Props) {
  const [name, setName] = useState('')
  const [talents, setTalents] = useState<Talent[]>(() => drawTalents(3))
  const [mood, setMood] = useState('期待')
  const [error, setError] = useState('')

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
        className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-sm space-y-6"
      >
        <h1 className="text-2xl font-bold text-warm-800 text-center">创建你的角色</h1>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">角色名字</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：小安"
            className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-hope-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-stone-700">随机天赋</label>
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
                <div className="font-medium text-warm-800">{talent.name}</div>
                <div className="text-sm text-stone-600 mt-1">{talent.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">此刻心情</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  mood === m
                    ? 'bg-hope-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-hope-500" />
            <span className="font-medium">初始属性</span>
          </div>
          所有属性初始为 50，你的选择会逐步塑造独特的人生。
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

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
