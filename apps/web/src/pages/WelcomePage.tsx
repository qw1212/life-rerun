import { motion } from 'framer-motion'
import { Heart, Sparkles, Shield } from 'lucide-react'

interface Props {
  onStart: () => void
}

export function WelcomePage({ onStart }: Props) {
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
          <span className="block text-2xl sm:text-3xl font-normal text-stone-600 mt-2">美好人生叙事之旅</span>
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
            <a
              href="https://www.crisis.org.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hope-600 hover:underline ml-1"
            >
              心理援助资源
            </a>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          aria-label="开始新的人生模拟游戏"
          className="px-10 py-4 bg-hope-500 hover:bg-hope-600 text-white rounded-full font-medium text-lg shadow-lg shadow-hope-200 transition-colors"
        >
          开始新人生
        </motion.button>
      </motion.div>
    </main>
  )
}
