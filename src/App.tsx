import { useCallback, useEffect, useMemo, useState } from 'react'
import { board, levels, type Rect } from './levels'
import './App.css'

type Point = {
  x: number
  y: number
}

type GameStatus = 'playing' | 'crashed' | 'won'
type MenuView = 'main' | 'colors' | 'language'
type Language = 'nb' | 'en' | 'de'

type ColorChoice = {
  name: string
  value: string
  rainbow?: boolean
  unlockLevel?: number
}

const playerRadius = 16
const moveStep = 18
const startPosition: Point = { x: 48, y: 260 }
const goal: Rect = { x: 820, y: 220, width: 52, height: 82 }

const colorChoices = [
  { name: 'Rød', value: '#ef4444' },
  { name: 'Oransje', value: '#f97316' },
  { name: 'Gul', value: '#facc15' },
  { name: 'Lys lilla', value: '#c4b5fd' },
  { name: 'Lyseblå', value: '#7dd3fc' },
  { name: 'Rosa', value: '#f9a8d4' },
  { name: 'Blå', value: '#3b82f6' },
  {
    name: 'Regnbue',
    value: 'linear-gradient(135deg, #ef4444, #f97316, #facc15, #22c55e, #3b82f6, #a855f7)',
    rainbow: true,
    unlockLevel: 10,
  },
] satisfies ColorChoice[]

const defaultPlayerColor = '#7dd3fc'

const text = {
  nb: {
    back: 'tilbake',
    changeColor: 'bytt farge',
    changeLanguage: 'bytt språk',
    colorHeading: 'bytt farge',
    continue: 'fortsett',
    crash: 'du klarer dette:)',
    controls: 'Bruk W, A, S og D for å bevege deg. ESC åpner menyen.',
    gameTitle: 'Dont touch the red',
    languageHeading: 'bytt språk',
    levelOf: 'av',
    next: 'neste',
    no: 'nei',
    obstacle: 'Rød firkant',
    player: 'Spiller',
    restart: 'restart',
    selectLanguage: 'Velg språk',
    selectColor: 'Velg',
    sure: 'er du sikker',
    unlockRainbow: 'nå nivå 10',
    win: 'du klarte det!',
    yes: 'ja',
  },
  en: {
    back: 'back',
    changeColor: 'change color',
    changeLanguage: 'change language',
    colorHeading: 'change color',
    continue: 'continue',
    crash: 'you can do this :)',
    controls: 'Use W, A, S and D to move. ESC opens the menu.',
    gameTitle: 'Dont touch the red',
    languageHeading: 'change language',
    levelOf: 'of',
    next: 'next',
    no: 'no',
    obstacle: 'Red square',
    player: 'Player',
    restart: 'restart',
    selectLanguage: 'Choose language',
    selectColor: 'Choose',
    sure: 'are you sure',
    unlockRainbow: 'reach level 10',
    win: 'you did it!',
    yes: 'yes',
  },
  de: {
    back: 'zurück',
    changeColor: 'farbe wechseln',
    changeLanguage: 'sprache wechseln',
    colorHeading: 'farbe wechseln',
    continue: 'weiter',
    crash: 'du schaffst das :)',
    controls: 'Benutze W, A, S und D zum Bewegen. ESC öffnet das Menü.',
    gameTitle: 'Dont touch the red',
    languageHeading: 'sprache wechseln',
    levelOf: 'von',
    next: 'weiter',
    no: 'nein',
    obstacle: 'Rotes Quadrat',
    player: 'Spieler',
    restart: 'restart',
    selectLanguage: 'Sprache wählen',
    selectColor: 'Wähle',
    sure: 'bist du sicher',
    unlockRainbow: 'erreiche Level 10',
    win: 'du hast es geschafft!',
    yes: 'ja',
  },
}

const languageChoices = [
  { code: 'nb', label: 'norsk (bokmål)' },
  { code: 'en', label: 'engelsk' },
  { code: 'de', label: 'tysk' },
] satisfies { code: Language; label: string }[]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function circleTouchesRect(circle: Point, radius: number, rect: Rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width)
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height)
  const distanceX = circle.x - nearestX
  const distanceY = circle.y - nearestY

  return distanceX * distanceX + distanceY * distanceY <= radius * radius
}

function pointTouchesRect(point: Point, rect: Rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function rectStyle(rect: Rect) {
  return {
    boxSizing: 'border-box' as const,
    height: `${(rect.height / board.height) * 100}%`,
    left: `${(rect.x / board.width) * 100}%`,
    top: `${(rect.y / board.height) * 100}%`,
    width: `${(rect.width / board.width) * 100}%`,
  }
}

function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [position, setPosition] = useState(startPosition)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')
  const [playerColor, setPlayerColor] = useState(defaultPlayerColor)
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false)
  const [language, setLanguage] = useState<Language>('nb')

  const copy = text[language]
  const level = levels[levelIndex]
  const levelNumber = levelIndex + 1
  const hasRainbow = levelNumber >= 10
  const levelLabel = `Nivå ${levelNumber} ${copy.levelOf} ${levels.length}`

  const playerStyle = useMemo(
    () => ({
      background: playerColor,
      left: `${(position.x / board.width) * 100}%`,
      top: `${(position.y / board.height) * 100}%`,
      width: `${((playerRadius * 2) / board.width) * 100}%`,
    }),
    [playerColor, position.x, position.y],
  )

  function resetLevel() {
    setPosition(startPosition)
    setStatus('playing')
    setIsRestartConfirmOpen(false)
  }

  function goToNextLevel() {
    setLevelIndex((currentLevel) => (currentLevel + 1) % levels.length)
    resetLevel()
  }

  function handleRestartClick() {
    if (status === 'won') {
      setIsRestartConfirmOpen(true)
      return
    }

    resetLevel()
  }

  const movePlayer = useCallback((delta: Point) => {
    if (status !== 'playing' || isMenuOpen) {
      return
    }

    const nextPosition = {
      x: clamp(position.x + delta.x, playerRadius, board.width - playerRadius),
      y: clamp(position.y + delta.y, playerRadius, board.height - playerRadius),
    }

    if (
      level.obstacles.some((obstacle) =>
        pointTouchesRect(nextPosition, obstacle),
      )
    ) {
      setPosition(startPosition)
      setStatus('crashed')
      return
    }

    setPosition(nextPosition)

    if (circleTouchesRect(nextPosition, playerRadius, goal)) {
      setStatus('won')
    }
  }, [isMenuOpen, level.obstacles, position.x, position.y, status])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const keyMoves: Record<string, Point> = {
        w: { x: 0, y: -moveStep },
        a: { x: -moveStep, y: 0 },
        s: { x: 0, y: moveStep },
        d: { x: moveStep, y: 0 },
      }

      if (event.key === 'Escape') {
        setIsMenuOpen((open) => !open)
        setMenuView('main')
        return
      }

      const move = keyMoves[event.key.toLowerCase()]
      if (move) {
        event.preventDefault()
        movePlayer(move)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [movePlayer])

  return (
    <main className="game-shell">
      <section className="game-header" aria-labelledby="game-title">
        <div>
          <p className="eyebrow">2D hinderløype</p>
          <h1 id="game-title">{copy.gameTitle}</h1>
        </div>
        <div className="level-badge">{levelLabel}</div>
      </section>

      <section
        aria-label="Spillbrett"
        className="game-board"
        style={{ aspectRatio: `${board.width} / ${board.height}` }}
      >
        <div
          aria-label={copy.player}
          className="player"
          data-testid="player"
          style={playerStyle}
        />

        {level.obstacles.map((obstacle) => (
          <div
            aria-label={copy.obstacle}
            className="obstacle"
            key={`${obstacle.x}-${obstacle.y}`}
            style={rectStyle(obstacle)}
          />
        ))}

        <div aria-label="Gull firkant" className="goal" style={rectStyle(goal)} />

        {status !== 'playing' && (
          <div className="message-panel" role="status">
            <h2>{status === 'crashed' ? copy.crash : copy.win}</h2>
            <div className="message-actions">
              {status === 'won' && (
                <button type="button" onClick={goToNextLevel}>
                  {copy.next}
                </button>
              )}
              <button type="button" onClick={handleRestartClick}>
                {copy.restart}
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="controls-hint">{copy.controls}</p>

      {isMenuOpen && (
        <div className="menu-backdrop" role="dialog" aria-modal="true">
          {menuView === 'main' ? (
            <div className="menu-card">
              <button type="button" onClick={() => setIsMenuOpen(false)}>
                {copy.continue}
              </button>
              <button type="button" onClick={() => setMenuView('colors')}>
                {copy.changeColor}
              </button>
              <button type="button" onClick={() => setMenuView('language')}>
                {copy.changeLanguage}
              </button>
            </div>
          ) : menuView === 'colors' ? (
            <div className="menu-card color-menu">
              <button
                aria-label={copy.back}
                className="back-button"
                type="button"
                onClick={() => setMenuView('main')}
              >
                {copy.back}
              </button>
              <h2>{copy.colorHeading}</h2>
              <div className="color-grid">
                {colorChoices.map((color) => {
                  const isLocked = color.unlockLevel ? !hasRainbow : false
                  const label = isLocked
                    ? `${copy.selectColor} ${color.name} (${copy.unlockRainbow})`
                    : `${copy.selectColor} ${color.name}`

                  return (
                    <button
                      aria-label={label}
                      className={`color-choice${color.rainbow ? ' rainbow-choice' : ''}`}
                      disabled={isLocked}
                      key={color.name}
                      onClick={() => setPlayerColor(color.value)}
                      style={{ background: color.value }}
                      type="button"
                    />
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="menu-card color-menu">
              <button
                aria-label={copy.back}
                className="back-button"
                type="button"
                onClick={() => setMenuView('main')}
              >
                {copy.back}
              </button>
              <h2>{copy.languageHeading}</h2>
              <div className="language-options">
                {languageChoices.map((choice) => (
                  <button
                    aria-label={`${copy.selectLanguage} ${choice.label}`}
                    key={choice.code}
                    onClick={() => setLanguage(choice.code)}
                    type="button"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isRestartConfirmOpen && (
        <div className="menu-backdrop" role="dialog" aria-modal="true">
          <div className="menu-card confirm-card">
            <h2>{copy.sure}</h2>
            <div className="message-actions">
              <button type="button" onClick={resetLevel}>
                {copy.yes}
              </button>
              <button type="button" onClick={() => setIsRestartConfirmOpen(false)}>
                {copy.no}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
