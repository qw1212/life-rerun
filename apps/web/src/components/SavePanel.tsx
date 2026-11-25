import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FolderOpen, HardDriveDownload, Save, Trash2, Upload, X } from 'lucide-react'
import type { SaveSlotSummary } from '../store/playerStore.js'

interface Props {
  open: boolean
  slots: SaveSlotSummary[]
  onClose: () => void
  onSave: (name: string) => void
  onLoad: (name: string) => void
  onDelete: (name: string) => void
  onImport: (file: File) => void
  onExport: () => void
}

const DEFAULT_SLOT_NAME = '手动存档'

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return date.toLocaleString('zh-CN', { hour12: false })
}

export function SavePanel({
  open,
  slots,
  onClose,
  onSave,
  onLoad,
  onDelete,
  onImport,
  onExport,
}: Props) {
  const [slotName, setSlotName] = useState(DEFAULT_SLOT_NAME)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  function handleSave() {
    const name = slotName.trim()
    if (!name) return
    if (slots.some((slot) => slot.name === name)) {
      const overwrite = window.confirm(`「${name}」已存在，确定覆盖吗？`)
      if (!overwrite) return
    }
    onSave(name)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-panel-title"
            className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 shadow-xl my-8 space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="save-panel-title" className="text-lg font-bold text-warm-800 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-hope-500" />
                  存档与人生之书
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  存档保存在当前浏览器中；换设备或清理浏览器数据前，请先导出备份。
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="关闭存档面板"
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={slotName}
                maxLength={20}
                onChange={(event) => setSlotName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSave()
                }}
                aria-label="存档名称"
                className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-hope-400"
                placeholder="给这段人生起个名字"
              />
              <button
                onClick={handleSave}
                disabled={!slotName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-hope-500 hover:bg-hope-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>

            <div className="space-y-2" aria-label="存档列表">
              {slots.length === 0 ? (
                <p className="text-sm text-stone-500 bg-stone-50 rounded-xl p-4 text-center">
                  还没有手动存档。先给当前人生保存一份吧。
                </p>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.name}
                    className="flex items-center gap-3 p-3 rounded-xl border border-stone-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate">{slot.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {slot.playerName} · {slot.age} 岁 · {formatTime(slot.savedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => onLoad(slot.name)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-hope-50 text-hope-700 hover:bg-hope-100 transition-colors"
                    >
                      读取
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`确定删除存档「${slot.name}」吗？此操作无法撤销。`)) {
                          onDelete(slot.name)
                        }
                      }}
                      aria-label={`删除存档 ${slot.name}`}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  导入人生之书
                </button>
                <button
                  onClick={onExport}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出人生之书
                </button>
              </div>
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
              <p className="text-xs text-stone-400 flex items-start gap-1.5 leading-relaxed">
                <HardDriveDownload className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                导入会覆盖当前进度；旧的 JSON 存档（直接导出角色数据的格式）也能识别。
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
