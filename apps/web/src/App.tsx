import { useEffect, useState } from 'react'
import { usePlayerStore } from './store/playerStore.js'
import { generateNarrative } from './services/api.js'
import { WelcomePage } from './pages/WelcomePage.js'
import { CharacterCreationPage } from './pages/CharacterCreationPage.js'
import { MainGamePage } from './pages/MainGamePage.js'
import { EndingPage } from './pages/EndingPage.js'
import { getEventsByStage, canTriggerEvent, calcEventWeight, pickWeightedEvent, type GameEvent, type StoryOption, type Talent } from '@life-rerun/shared'

function App() {
  const {
    player,
    currentEvent,
    gratitudeInput,
    isGameOver,
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

  const [showCreation, setShowCreation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (player && !currentEvent && !isGameOver) {
      loadNextEvent()
    }
  }, [player?.age, player?.stage, isGameOver])

  async function loadNextEvent() {
    if (!player) return
    setLoading(true)
    setError('')
    try {
      const response = await generateNarrative(player)
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
      const candidates = getEventsByStage(player.stage).filter((ev) => canTriggerEvent(player, ev))
      const weights = candidates.map((ev) => calcEventWeight(player, ev))
      const localEvent = pickWeightedEvent(candidates, weights)
      if (localEvent) {
        setCurrentEvent(localEvent)
      } else {
        setError('暂时无法生成新事件，请刷新试试。')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSelectOption(option: StoryOption) {
    if (!currentEvent || !player) return
    selectOption(option, currentEvent)
  }

  function handleCreate(name: string, talents: Talent[], mood: string) {
    createPlayer(name, talents, mood)
    setShowCreation(false)
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
    setShowCreation(false)
  }

  if (!player) {
    if (showCreation) {
      return <CharacterCreationPage onCreate={handleCreate} />
    }
    return <WelcomePage onStart={() => setShowCreation(true)} />
  }

  if (isGameOver) {
    return <EndingPage player={player} onExport={handleExport} onReset={handleReset} />
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
      onNextYear={nextYear}
      onSave={() => saveSlot('auto')}
      onExport={handleExport}
      onReset={handleReset}
    />
  )
}

export default App
