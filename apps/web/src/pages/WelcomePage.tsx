import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Shield, FolderOpen, Upload } from 'lucide-react'
import type { SaveSlotSummary } from '../store/playerStore.js'

interface Props {
  onStart: () => void
  slots: SaveSlotSummary[]
  onLoadSlot: (name: string) => void
  onImport: (file: File) => void
}

export function WelcomePage({ onStart, slots, onLoadSlot, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-warm-50">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <div className="flex justify-center gap-4 text-hope-500" aria-hidden="true">
          <Sparkles className="w-8 h-8" />
          <Heart className="w-8 h-8" />
          <Shield className="w-8 h-8" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-warm-800 leading-tight">
          人生模拟器
          <span className="block text-2xl sm:text-3xl font-normal text-stone-600 mt-2">
            美好人生叙事之旅
          </span>
        </h1>

        <p className="text-lg text-stone-600 leading-relaxed">
          一款结合 AI 动态叙事、积极心理学与叙事疗法的互动人生模拟游戏。
          在这里，每一次选择都在书写你独特的人生故事。
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-sm text-left space-y-3">
          <h2 className="font-semibold text-warm-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-hope-500" aria-hidden="true" />
            心理安全提示
          </h2>
          <p className="text-sm text-stone-600">
            本产品是心理自助与娱乐工具，不具备诊断或治疗功能。游戏中所有低谷事件都会指向成长与希望。
            如果你正在经历严重心理困扰，请寻求专业帮助。
            <a href="tel:12356" className="text-hope-600 hover:underline ml-1">
              拨打心理援助热线 12356
            </a>
            ，紧急情况请拨打 120。
          </p>
        </div>

        {slots.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm text-left space-y-3">
            <h2 className="font-semibold text-warm-800 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-hope-500" />
              继续之前的人生
            </h2>
            <div className="space-y-2">
              {slots.slice(0, 3).map((slot) => (
                <div
                  key={slot.name}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-stone-200"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">
                      {slot.playerName} · {slot.age} 岁
                    </div>
                    <div className="text-xs text-stone-500 truncate">存档：{slot.name}</div>
                  </div>
                  <button
                    onClick={() => onLoadSlot(slot.name)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-hope-50 text-hope-700 hover:bg-hope-100 transition-colors"
                  >
                    读取
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            aria-label="开始新的人生模拟游戏"
            className="px-10 py-4 bg-hope-500 hover:bg-hope-600 text-white rounded-full font-medium text-lg shadow-lg shadow-hope-200 transition-colors"
          >
            开始新人生
          </motion.button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            导入人生之书
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImport(file)
              event.target.value = ''
            }}
          />
        </div>
      </motion.div>
    </main>
  )
}
