import { useCallback, useEffect, useMemo, useState } from 'react'
import { board, levels, type Rect } from './levels'
import './App.css'

type Point = {
  x: number
  y: number
}

type GameStatus = 'playing' | 'crashed' | 'won'
type MenuView = 'main' | 'colors'

const playerRadius = 16
const moveStep = 18
const startPosition: Point = { x: 48, y: 260 }
const goal: Rect = { x: 820, y: 220, width: 52, height: 82 }

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

  const level = levels[levelIndex]
  const levelLabel = `${level.name} av ${levels.length}`

  const playerStyle = useMemo(
    () => ({
      backgroundColor: playerColor,
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
        <div className="level-badge">{levelLabel}</div>
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
              <button type="button" onClick={handleRestartClick}>
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

      {isRestartConfirmOpen && (
        <div className="menu-backdrop" role="dialog" aria-modal="true">
          <div className="menu-card confirm-card">
            <h2>er du sikker</h2>
            <div className="message-actions">
              <button type="button" onClick={resetLevel}>
                ja
              </button>
              <button type="button" onClick={() => setIsRestartConfirmOpen(false)}>
                nei
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
