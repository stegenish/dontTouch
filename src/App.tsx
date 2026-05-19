import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type Point = {
  x: number
  y: number
}

type Rect = Point & {
  width: number
  height: number
}

type Level = {
  name: string
  obstacles: Rect[]
}

type GameStatus = 'playing' | 'crashed' | 'won'
type MenuView = 'main' | 'colors'

const board = {
  width: 900,
  height: 520,
}

const playerRadius = 16
const moveStep = 18
const startPosition: Point = { x: 48, y: 260 }
const goal: Rect = { x: 820, y: 220, width: 52, height: 82 }

const levels: Level[] = [
  {
    name: 'Nivå 1',
    obstacles: [
      { x: 190, y: 70, width: 46, height: 290 },
      { x: 360, y: 170, width: 46, height: 300 },
      { x: 545, y: 40, width: 46, height: 290 },
      { x: 690, y: 260, width: 46, height: 210 },
    ],
  },
  {
    name: 'Nivå 2',
    obstacles: [
      { x: 155, y: 50, width: 42, height: 260 },
      { x: 270, y: 215, width: 42, height: 255 },
      { x: 405, y: 45, width: 42, height: 255 },
      { x: 540, y: 230, width: 42, height: 245 },
      { x: 670, y: 85, width: 42, height: 270 },
    ],
  },
  {
    name: 'Nivå 3',
    obstacles: [
      { x: 140, y: 90, width: 38, height: 320 },
      { x: 260, y: 0, width: 38, height: 215 },
      { x: 260, y: 305, width: 38, height: 215 },
      { x: 405, y: 120, width: 38, height: 280 },
      { x: 545, y: 0, width: 38, height: 230 },
      { x: 545, y: 310, width: 38, height: 210 },
      { x: 690, y: 90, width: 38, height: 330 },
    ],
  },
]

const colorChoices = [
  { name: 'Rød', value: '#ef4444' },
  { name: 'Oransje', value: '#f97316' },
  { name: 'Gul', value: '#facc15' },
]

const defaultPlayerColor = '#7dd3fc'

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

function rectStyle(rect: Rect) {
  return {
    height: rect.height,
    left: rect.x,
    top: rect.y,
    width: rect.width,
  }
}

function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [position, setPosition] = useState(startPosition)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')
  const [playerColor, setPlayerColor] = useState(defaultPlayerColor)

  const level = levels[levelIndex]

  const playerStyle = useMemo(
    () => ({
      backgroundColor: playerColor,
      height: playerRadius * 2,
      left: position.x - playerRadius,
      top: position.y - playerRadius,
      width: playerRadius * 2,
    }),
    [playerColor, position.x, position.y],
  )

  function resetLevel() {
    setPosition(startPosition)
    setStatus('playing')
  }

  function goToNextLevel() {
    setLevelIndex((currentLevel) => (currentLevel + 1) % levels.length)
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
        circleTouchesRect(nextPosition, playerRadius, obstacle),
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
          <h1 id="game-title">Dont touch the red</h1>
        </div>
        <div className="level-badge">{level.name}</div>
      </section>

      <section
        aria-label="Spillbrett"
        className="game-board"
        style={{ aspectRatio: `${board.width} / ${board.height}` }}
      >
        <div
          aria-label="Spiller"
          className="player"
          data-testid="player"
          style={playerStyle}
        />

        {level.obstacles.map((obstacle) => (
          <div
            aria-label="Rød firkant"
            className="obstacle"
            key={`${obstacle.x}-${obstacle.y}`}
            style={rectStyle(obstacle)}
          />
        ))}

        <div aria-label="Gull firkant" className="goal" style={rectStyle(goal)} />

        {status !== 'playing' && (
          <div className="message-panel" role="status">
            <h2>{status === 'crashed' ? 'du klarer dette:)' : 'du klarte det!'}</h2>
            <div className="message-actions">
              {status === 'won' && (
                <button type="button" onClick={goToNextLevel}>
                  neste
                </button>
              )}
              <button type="button" onClick={resetLevel}>
                restart
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="controls-hint">Bruk W, A, S og D for å bevege deg. ESC åpner menyen.</p>

      {isMenuOpen && (
        <div className="menu-backdrop" role="dialog" aria-modal="true">
          {menuView === 'main' ? (
            <div className="menu-card">
              <button type="button" onClick={() => setIsMenuOpen(false)}>
                fortsett
              </button>
              <button type="button" onClick={() => setMenuView('colors')}>
                bytt farge
              </button>
            </div>
          ) : (
            <div className="menu-card color-menu">
              <button
                aria-label="Tilbake"
                className="back-button"
                type="button"
                onClick={() => setMenuView('main')}
              >
                tilbake
              </button>
              <h2>bytt farge</h2>
              <div className="color-grid">
                {colorChoices.map((color) => (
                  <button
                    aria-label={`Velg ${color.name}`}
                    className="color-choice"
                    key={color.value}
                    onClick={() => setPlayerColor(color.value)}
                    style={{ backgroundColor: color.value }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default App
