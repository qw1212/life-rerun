import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  usePlayerStore,
  getRiskSignature,
  getSaveSlots,
  type SaveSlotSummary,
} from './store/playerStore.js'
import { generateNarrative } from './services/api.js'
import { WelcomePage } from './pages/WelcomePage.js'
import { CharacterCreationPage } from './pages/CharacterCreationPage.js'
import { MainGamePage } from './pages/MainGamePage.js'
import { EndingPage } from './pages/EndingPage.js'
import { AssessmentPage } from './pages/AssessmentPage.js'
import { CrisisOverlay } from './components/CrisisOverlay.js'
import {
  ENDING_AGE,
  EVENTS,
  assessRisk,
  countRecentLowStreak,
  extractAssessmentSignals,
  getEventsByStage,
  isStandardEvent,
  needsBreather,
  needsInsightAfterLow,
  pickEventForPlayer,
  type AssessmentResult,
  type GameEvent,
  type RiskAssessment,
  type StoryOption,
  type Talent,
} from '@life-rerun/shared'

type OnboardingStep = 'welcome' | 'assessment' | 'creation'

const ASSESSMENT_SCALES = ['phq9', 'gad7'] as const
/** 正常的人生之书只有几十 KB，超过这个大小基本可以确定不是本产品的导出文件 */
const MAX_IMPORT_BYTES = 2 * 1024 * 1024

function App() {
  const {
    player,
    currentEvent,
    gratitudeInput,
    isGameOver,
    assessments,
    keptQuality,
    acknowledgedRiskSignature,
    submitAssessment,
    acknowledgeCrisis,
    createPlayer,
    setCurrentEvent,
    selectOption,
    nextYear,
    addGratitude,
    setGratitudeInput,
    saveSlot,
    loadSlotByName,
    deleteSlot,
    importLifeBook,
    exportLifeBook,
    setKeptQuality,
    resetGame,
  } = usePlayerStore()

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome')
  const [showPostAssessment, setShowPostAssessment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [slots, setSlots] = useState<SaveSlotSummary[]>([])
  /** 服务端判定的高风险（本地信号可能没覆盖到，例如服务端规则更严） */
  const [serverRisk, setServerRisk] = useState<RiskAssessment | null>(null)
  const loadingRef = useRef(false)

  // 危机分级：量表结果 + 玩家自由文本 + 近期低谷密度
  const risk = useMemo(
    () =>
      assessRisk({
        freeText: player?.gratitudeLog ?? [],
        recentLowStreak: player ? countRecentLowStreak(player) : 0,
        ...extractAssessmentSignals(assessments),
      }),
    [player, assessments]
  )

  // 服务端的判定优先：它已经拒绝对这次请求生成叙事，界面必须给出对应解释
  const activeRisk = serverRisk ?? risk
  const isCrisisActive =
    Boolean(player) &&
    activeRisk.blockNarrative &&
    getRiskSignature(activeRisk) !== acknowledgedRiskSignature

  const isEnding = Boolean(player) && (isGameOver || (player?.age ?? 0) >= ENDING_AGE)

  const loadNextEvent = useCallback(async () => {
    if (!player || loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')
    setServerRisk(null)

    try {
      // 心理急救优先：连续低谷后强制喘息，而不是继续推剧情
      if (needsBreather(player)) {
        const breather = pickEventForPlayer(
          player,
          EVENTS.filter((event) => event.type === 'breather'),
          { allowRepeats: true }
        )
        if (breather) {
          setCurrentEvent(breather)
          return
        }
      }

      if (needsInsightAfterLow(player)) {
        const insight = pickEventForPlayer(
          player,
          EVENTS.filter((event) => event.type === 'insight'),
          { allowRepeats: true }
        )
        if (insight) {
          setCurrentEvent(insight)
          return
        }
      }

      // 本地已判定高风险且玩家确认继续：没必要再向服务端要一次「拒绝」，
      // 直接用审核过的模板事件继续，减少一次无意义的往返。
      if (risk.blockNarrative && getRiskSignature(risk) === acknowledgedRiskSignature) {
        const localEvent =
          pickEventForPlayer(player, getEventsByStage(player.stage).filter(isStandardEvent)) ??
          pickEventForPlayer(player, EVENTS.filter(isStandardEvent), { allowRepeats: true })
        if (localEvent) {
          setCurrentEvent(localEvent)
          return
        }
      }

      try {
        const response = await generateNarrative(player, assessments)

        if (response.blocked) {
          const blockedRisk: RiskAssessment = response.risk ?? {
            level: 'high',
            reasons: ['服务端判断当前状态不适合继续推进叙事'],
            needsSupport: true,
            blockNarrative: true,
          }

          // 玩家已经读过同一组提示并主动选择继续：
          // 用经过人工审核的模板事件继续，既不重复弹窗，也不会把玩家锁死在空界面。
          if (getRiskSignature(blockedRisk) === acknowledgedRiskSignature) {
            const localEvent =
              pickEventForPlayer(player, getEventsByStage(player.stage).filter(isStandardEvent)) ??
              pickEventForPlayer(player, EVENTS.filter(isStandardEvent), { allowRepeats: true })
            if (localEvent) {
              setCurrentEvent(localEvent)
              return
            }
          }

          setServerRisk(blockedRisk)
          return
        }

        const event: GameEvent = {
          id: response.eventId || `ai-${Date.now()}`,
          type: response.eventType || 'normal',
          stage: player.stage,
          title: response.eventTitle || `${player.age} 岁的故事`,
          story: response.story,
          options: response.options,
          psychologyHint: response.psychologyHint,
          permaTags: response.permaTags,
        }
        setCurrentEvent(event)
      } catch {
        const localEvent =
          pickEventForPlayer(player, getEventsByStage(player.stage).filter(isStandardEvent)) ??
          pickEventForPlayer(player, EVENTS.filter(isStandardEvent), { allowRepeats: true })
        if (localEvent) {
          setCurrentEvent(localEvent)
        } else {
          setError('暂时无法生成新事件，请点击「进入下一年」重试。')
        }
      }
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [player, assessments, acknowledgedRiskSignature, risk, setCurrentEvent])

  const loadNextEventRef = useRef(loadNextEvent)
  useEffect(() => {
    loadNextEventRef.current = loadNextEvent
  }, [loadNextEvent])

  useEffect(() => {
    if (player && !currentEvent && !isEnding && !isCrisisActive) {
      void loadNextEventRef.current()
    }
    // 刻意不把 currentEvent / loadNextEvent 放进依赖：
    // 选完选项后 currentEvent 变空，但此时应该等玩家点「进入下一年」，而不是立刻刷新事件。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, player?.age, player?.stage, isEnding, isCrisisActive])

  useEffect(() => {
    setSlots(getSaveSlots())
    // 另一个标签页保存/删除存档后同步列表
    const syncSlots = () => setSlots(getSaveSlots())
    window.addEventListener('storage', syncSlots)
    return () => window.removeEventListener('storage', syncSlots)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const handleSelectOption = useCallback(
    (option: StoryOption) => {
      if (!currentEvent || !player) return
      selectOption(option, currentEvent)
    },
    [currentEvent, player, selectOption]
  )

  function handleCreate(name: string, talents: Talent[], mood: string) {
    createPlayer(name, talents, mood)
    setError('')
  }

  function handlePreAssessmentComplete(results: AssessmentResult[]) {
    results.forEach(submitAssessment)
    setOnboardingStep('creation')
  }

  function handlePostAssessmentComplete(results: AssessmentResult[]) {
    results.forEach((result) => submitAssessment(result))
    setShowPostAssessment(false)
  }

  function handleNextYear() {
    setError('')
    nextYear()
  }

  const handleExport = useCallback(() => {
    const data = exportLifeBook()
    if (!data || !player) return
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().slice(0, 10)
    link.download = `人生之书-${player.name}-${date}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setNotice('人生之书已导出，建议妥善保存')
  }, [exportLifeBook, player])

  const handleSaveSlot = useCallback(
    (name: string) => {
      const ok = saveSlot(name)
      setSlots(getSaveSlots())
      setNotice(ok ? `已存档到「${name}」` : '存档失败，浏览器存储空间可能已满')
    },
    [saveSlot]
  )

  const handleLoadSlot = useCallback(
    (name: string) => {
      const ok = loadSlotByName(name)
      setSlots(getSaveSlots())
      setNotice(ok ? `已读取「${name}」` : '读档失败，存档可能已损坏')
      if (ok) {
        setShowPostAssessment(false)
        setServerRisk(null)
        setError('')
      }
    },
    [loadSlotByName]
  )

  const handleDeleteSlot = useCallback(
    (name: string) => {
      const ok = deleteSlot(name)
      setSlots(getSaveSlots())
      setNotice(ok ? `已删除存档「${name}」` : '删除失败，存档可能已不存在')
    },
    [deleteSlot]
  )

  const handleImportFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMPORT_BYTES) {
        setNotice('文件过大，请确认选择的是人生之书 JSON 文件')
        return
      }
      if (player && !window.confirm('导入会覆盖当前进度，确定继续吗？')) return
      try {
        const text = await file.text()
        const result = importLifeBook(text)
        setSlots(getSaveSlots())
        setNotice(result.message)
        if (result.ok) {
          setShowPostAssessment(false)
          setServerRisk(null)
          setError('')
        }
      } catch {
        setNotice('读取文件失败，请重试')
      }
    },
    [importLifeBook, player]
  )

  const teardown = useCallback(() => {
    resetGame()
    setOnboardingStep('welcome')
    setShowPostAssessment(false)
    setServerRisk(null)
    setError('')
    setNotice('')
    setSlots(getSaveSlots())
  }, [resetGame])

  function handleReset() {
    const confirmed = window.confirm(
      '确定要重开一段人生吗？当前进度会被清除，手动存档会保留。'
    )
    if (!confirmed) return
    teardown()
  }

  // 危机界面里的「先离开」是安抚动作：不弹二次确认，也不应顺手抹掉这段人生，
  // 先自动存一份，玩家之后想回来还能在欢迎页继续。
  const handleCrisisExit = useCallback(() => {
    if (player) saveSlot('离开前的存档')
    teardown()
  }, [player, saveSlot, teardown])

  // 高风险硬中断：优先于其它所有界面
  if (isCrisisActive) {
    return (
      <CrisisOverlay
        risk={activeRisk}
        onAcknowledge={() => acknowledgeCrisis(activeRisk)}
        onExit={handleCrisisExit}
      />
    )
  }

  if (!player) {
    if (onboardingStep === 'assessment') {
      return (
        <AssessmentPage
          phase="pre"
          scales={[...ASSESSMENT_SCALES]}
          onComplete={handlePreAssessmentComplete}
          onSkip={() => setOnboardingStep('creation')}
        />
      )
    }
    if (onboardingStep === 'creation') {
      return <CharacterCreationPage onCreate={handleCreate} />
    }
    return (
      <WelcomePage
        onStart={() => setOnboardingStep('assessment')}
        slots={slots}
        onLoadSlot={handleLoadSlot}
        onImport={handleImportFile}
      />
    )
  }

  if (isEnding && player) {
    if (showPostAssessment) {
      return (
        <AssessmentPage
          phase="post"
          scales={[...ASSESSMENT_SCALES]}
          onComplete={handlePostAssessmentComplete}
          onSkip={() => setShowPostAssessment(false)}
        />
      )
    }
    return (
      <EndingPage
        player={player}
        assessments={assessments}
        keptQuality={keptQuality}
        onSelectQuality={setKeptQuality}
        onExport={handleExport}
        onReset={handleReset}
        onStartPostAssessment={() => setShowPostAssessment(true)}
      />
    )
  }

  return (
    <MainGamePage
      player={player}
      currentEvent={currentEvent}
      gratitudeInput={gratitudeInput}
      loading={loading}
      error={error}
      notice={notice}
      supportNeeded={activeRisk.level === 'medium' || activeRisk.level === 'high'}
      slots={slots}
      onSelectOption={handleSelectOption}
      onAddGratitude={addGratitude}
      onSetGratitudeInput={setGratitudeInput}
      onNextYear={handleNextYear}
      onSaveSlot={handleSaveSlot}
      onLoadSlot={handleLoadSlot}
      onDeleteSlot={handleDeleteSlot}
      onImportFile={handleImportFile}
      onExport={handleExport}
      onReset={handleReset}
    />
  )
}

export default App
