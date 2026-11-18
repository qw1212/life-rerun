import { useEffect, useState, useCallback, useMemo } from 'react'
import { usePlayerStore, getRiskSignature } from './store/playerStore.js'
import { generateNarrative } from './services/api.js'
import { WelcomePage } from './pages/WelcomePage.js'
import { CharacterCreationPage } from './pages/CharacterCreationPage.js'
import { MainGamePage } from './pages/MainGamePage.js'
import { EndingPage } from './pages/EndingPage.js'
import { AssessmentPage } from './pages/AssessmentPage.js'
import { CrisisOverlay } from './components/CrisisOverlay.js'
import {
  getEventsByStage,
  canTriggerEvent,
  calcEventWeight,
  pickWeightedEvent,
  needsBreather,
  needsInsightAfterLow,
  countRecentLowStreak,
  assessRisk,
  extractAssessmentSignals,
  EVENTS,
  type AssessmentResult,
  type GameEvent,
  type StoryOption,
  type Talent,
  type PlayerState,
  type RiskAssessment,
} from '@life-rerun/shared'

type OnboardingStep = 'welcome' | 'assessment' | 'creation'

const ASSESSMENT_SCALES = ['phq9', 'gad7'] as const

function App() {
  const {
    player,
    currentEvent,
    gratitudeInput,
    isGameOver,
    assessments,
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
    exportLifeBook,
    resetGame,
  } = usePlayerStore()

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome')
  const [showPostAssessment, setShowPostAssessment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /** 服务端判定的高风险（本地信号可能没覆盖到，例如服务端规则更严） */
  const [serverRisk, setServerRisk] = useState<RiskAssessment | null>(null)

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

  useEffect(() => {
    if (player && !currentEvent && !isGameOver && !risk.blockNarrative) {
      loadNextEvent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.age, player?.stage, isGameOver])

  function pickLocalEvent(stage: PlayerState['stage']) {
    if (!player) return null
    const candidates = getEventsByStage(stage).filter((ev) => canTriggerEvent(player, ev))
    const weights = candidates.map((ev) => calcEventWeight(player, ev))
    return pickWeightedEvent(candidates, weights)
  }

  async function loadNextEvent() {
    if (!player) return
    setLoading(true)
    setError('')

    // 心理急救：连续低谷后强制喘息/顿悟事件
    if (needsBreather(player)) {
      const candidates = EVENTS.filter((ev) => ev.type === 'breather' && canTriggerEvent(player, ev))
      const weights = candidates.map((ev) => calcEventWeight(player, ev))
      const breather = pickWeightedEvent(candidates, weights)
      if (breather) {
        setCurrentEvent(breather)
        setLoading(false)
        return
      }
    }

    if (needsInsightAfterLow(player)) {
      const candidates = EVENTS.filter((ev) => ev.type === 'insight' && canTriggerEvent(player, ev))
      const weights = candidates.map((ev) => calcEventWeight(player, ev))
      const insight = pickWeightedEvent(candidates, weights)
      if (insight) {
        setCurrentEvent(insight)
        setLoading(false)
        return
      }
    }

    try {
      const response = await generateNarrative(player, assessments)
      // 服务端判定高风险：不再推进叙事，交给危机支持界面处理。
      // 必须把服务端的结论存下来 —— 只 return 的话 currentEvent 一直是 null，
      // 界面停在「没有事件」的空白态，既不解释原因也不给求助资源，
      // 这条安全兜底就等于没生效。
      if (response.blocked) {
        setServerRisk(
          response.risk ?? {
            level: 'high',
            reasons: ['服务端判断当前状态不适合继续推进叙事'],
            needsSupport: true,
            blockNarrative: true,
          }
        )
        return
      }
      setServerRisk(null)
      const event: GameEvent = {
        id: `ai-${Date.now()}`,
        type: 'normal',
        stage: player.stage,
        title: `${player.age} 岁的故事`,
        story: response.story,
        options: response.options,
        psychologyHint: response.psychologyHint,
      }
      setCurrentEvent(event)
    } catch (e) {
      const localEvent = pickLocalEvent(player.stage)
      if (localEvent) {
        setCurrentEvent(localEvent)
      } else {
        setError('暂时无法生成新事件，请点击「进入下一年」重试。')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = useCallback((option: StoryOption) => {
    if (!currentEvent || !player) return
    selectOption(option, currentEvent)
  }, [currentEvent, player, selectOption])

  function handleCreate(name: string, talents: Talent[], mood: string) {
    createPlayer(name, talents, mood)
    setOnboardingStep('creation')
  }

  function handlePreAssessmentComplete(results: AssessmentResult[]) {
    results.forEach(submitAssessment)
    setOnboardingStep('creation')
  }

  function handlePostAssessmentComplete(results: AssessmentResult[]) {
    results.forEach((r) => submitAssessment(r))
    setShowPostAssessment(false)
  }

  function handleNextYear() {
    setError('')
    nextYear()
  }

  function handleExport() {
    const data = exportLifeBook()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-book-${player?.name || 'player'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleReset() {
    resetGame()
    setOnboardingStep('welcome')
    setShowPostAssessment(false)
    setServerRisk(null)
  }

  // 高风险硬中断：优先于其它所有界面
  if (activeRisk.blockNarrative && getRiskSignature(activeRisk) !== acknowledgedRiskSignature) {
    return (
      <CrisisOverlay
        risk={activeRisk}
        onAcknowledge={() => acknowledgeCrisis(activeRisk)}
        onExit={handleReset}
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
        />
      )
    }
    if (onboardingStep === 'creation') {
      return <CharacterCreationPage onCreate={handleCreate} />
    }
    return <WelcomePage onStart={() => setOnboardingStep('assessment')} />
  }

  if (isGameOver) {
    if (showPostAssessment) {
      return (
        <AssessmentPage
          phase="post"
          scales={[...ASSESSMENT_SCALES]}
          onComplete={handlePostAssessmentComplete}
        />
      )
    }
    return (
      <EndingPage
        player={player}
        assessments={assessments}
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
      onSelectOption={handleSelectOption}
      onAddGratitude={addGratitude}
      onSetGratitudeInput={setGratitudeInput}
      onNextYear={handleNextYear}
      onSave={() => saveSlot('auto')}
      onExport={handleExport}
      onReset={handleReset}
    />
  )
}

export default App
