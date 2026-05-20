import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { board, levels, type Rect } from './levels'
import './App.css'

type Point = {
  x: number
  y: number
}

type GameStatus = 'playing' | 'crashed' | 'won'
type MenuView = 'main' | 'colors' | 'language' | 'settings' | 'levels'
type Language = 'nb' | 'en' | 'de'

type ColorChoice = {
  name: string
  value: string
  rainbow?: boolean
  unlockLevel?: number
}

type SavedGame = {
  highestUnlockedLevel: number
  language: Language
  levelIndex: number
  playerColor: string
  showShadows: boolean
}

const playerRadius = 16
const moveStep = 18
const heldKeyMoveDelay = 55
const saveKey = 'dont-touch-the-red-save'
const startPosition: Point = { x: 48, y: 260 }
const goal: Rect = { x: 820, y: 220, width: 52, height: 82 }
const keyMoves: Record<string, Point> = {
  w: { x: 0, y: -moveStep },
  a: { x: -moveStep, y: 0 },
  s: { x: 0, y: moveStep },
  d: { x: moveStep, y: 0 },
}

const touchControls = [
  { key: 'w', label: 'opp', symbol: '↑', area: 'up' },
  { key: 'a', label: 'venstre', symbol: '←', area: 'left' },
  { key: 's', label: 'ned', symbol: '↓', area: 'down' },
  { key: 'd', label: 'høyre', symbol: '→', area: 'right' },
]

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
    controls: 'Bruk W, A, S og D eller knappene for å bevege deg. ESC åpner menyen.',
    gameTitle: 'Dont touch the red',
    languageHeading: 'bytt språk',
    levelOf: 'av',
    levels: 'nivåer',
    levelsHeading: 'klar alle nivåene',
    lockedLevel: 'låst',
    next: 'neste',
    no: 'nei',
    obstacle: 'Rød firkant',
    player: 'Spiller',
    restart: 'restart',
    save: 'lagre',
    saved: 'lagret!',
    selectLanguage: 'Velg språk',
    selectColor: 'Velg',
    settings: 'instillinger',
    settingsHeading: 'instillinger',
    shadows: 'skygger',
    shadowsOff: 'av',
    shadowsOn: 'på',
    music: 'musikk',
    musicOff: 'av',
    musicOn: 'på',
    timer: 'tid',
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
    controls: 'Use W, A, S, D or the buttons to move. ESC opens the menu.',
    gameTitle: 'Dont touch the red',
    languageHeading: 'change language',
    levelOf: 'of',
    levels: 'levels',
    levelsHeading: 'clear all levels',
    lockedLevel: 'locked',
    next: 'next',
    no: 'no',
    obstacle: 'Red square',
    player: 'Player',
    restart: 'restart',
    save: 'save',
    saved: 'saved!',
    selectLanguage: 'Choose language',
    selectColor: 'Choose',
    settings: 'settings',
    settingsHeading: 'settings',
    shadows: 'shadows',
    shadowsOff: 'off',
    shadowsOn: 'on',
    music: 'music',
    musicOff: 'off',
    musicOn: 'on',
    timer: 'time',
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
    controls: 'Benutze W, A, S, D oder die Knöpfe zum Bewegen. ESC öffnet das Menü.',
    gameTitle: 'Dont touch the red',
    languageHeading: 'sprache wechseln',
    levelOf: 'von',
    levels: 'level',
    levelsHeading: 'schaffe alle level',
    lockedLevel: 'gesperrt',
    next: 'weiter',
    no: 'nein',
    obstacle: 'Rotes Quadrat',
    player: 'Spieler',
    restart: 'restart',
    save: 'speichern',
    saved: 'gespeichert!',
    selectLanguage: 'Sprache wählen',
    selectColor: 'Wähle',
    settings: 'einstellungen',
    settingsHeading: 'einstellungen',
    shadows: 'schatten',
    shadowsOff: 'aus',
    shadowsOn: 'an',
    music: 'musik',
    musicOff: 'aus',
    musicOn: 'an',
    timer: 'zeit',
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

function isLanguage(value: unknown): value is Language {
  return value === 'nb' || value === 'en' || value === 'de'
}

function isPlayerColor(value: unknown): value is string {
  return typeof value === 'string' && colorChoices.some((color) => color.value === value)
}

function readSavedGame(): SavedGame | undefined {
  try {
    const savedText = localStorage.getItem(saveKey)

    if (!savedText) {
      return undefined
    }

    const saved = JSON.parse(savedText) as Partial<SavedGame>
    const highestUnlockedLevel = clamp(
      Number(saved.highestUnlockedLevel) || 1,
      1,
      levels.length,
    )
    const levelIndex = clamp(Number(saved.levelIndex) || 0, 0, highestUnlockedLevel - 1)

    return {
      highestUnlockedLevel,
      language: isLanguage(saved.language) ? saved.language : 'nb',
      levelIndex,
      playerColor: isPlayerColor(saved.playerColor)
        ? saved.playerColor
        : defaultPlayerColor,
      showShadows: typeof saved.showShadows === 'boolean' ? saved.showShadows : true,
    }
  } catch {
    return undefined
  }
}

function saveGame(savedGame: SavedGame) {
  localStorage.setItem(saveKey, JSON.stringify(savedGame))
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
  const savedGame = useMemo(() => readSavedGame(), [])
  const [levelIndex, setLevelIndex] = useState(savedGame?.levelIndex ?? 0)
  const [position, setPosition] = useState(startPosition)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')
  const [playerColor, setPlayerColor] = useState(savedGame?.playerColor ?? defaultPlayerColor)
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false)
  const [language, setLanguage] = useState<Language>(savedGame?.language ?? 'nb')
  const [showShadows, setShowShadows] = useState(savedGame?.showShadows ?? true)
  const [isMusicOn, setIsMusicOn] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [timerStartedAt, setTimerStartedAt] = useState(() => Date.now())
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState(
    savedGame?.highestUnlockedLevel ?? 1,
  )
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const heldKeys = useRef(new Set<string>())
  const musicRef = useRef<HTMLAudioElement>(null)

  const copy = text[language]
  const level = levels[levelIndex]
  const levelNumber = levelIndex + 1
  const hasRainbow = levelNumber >= 10
  const levelLabel = `Nivå ${levelNumber} ${copy.levelOf} ${levels.length}`
  const timerLabel = `${elapsedSeconds.toFixed(1)} s`

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
    heldKeys.current.clear()
    setTimerStartedAt(() => Date.now())
    setElapsedSeconds(0)
    setPosition(startPosition)
    setStatus('playing')
    setIsRestartConfirmOpen(false)
  }

  function goToNextLevel() {
    setHighestUnlockedLevel((currentHighest) =>
      Math.min(Math.max(currentHighest, levelNumber + 1), levels.length),
    )
    setLevelIndex((currentLevel) => (currentLevel + 1) % levels.length)
    resetLevel()
  }

  function chooseLevel(nextLevelIndex: number) {
    if (nextLevelIndex + 1 > highestUnlockedLevel) {
      return
    }

    setLevelIndex(nextLevelIndex)
    setIsMenuOpen(false)
    setMenuView('main')
    resetLevel()
  }

  function saveCurrentGame() {
    saveGame({
      highestUnlockedLevel,
      language,
      levelIndex,
      playerColor,
      showShadows,
    })
    setShowSavedMessage(true)
  }

  const pauseGameTimer = useCallback(() => {
    if (status !== 'playing') {
      return
    }

    setElapsedSeconds((Date.now() - timerStartedAt) / 1000)
  }, [status, timerStartedAt])

  const resumeGameTimer = useCallback(() => {
    if (status !== 'playing') {
      return
    }

    setTimerStartedAt(Date.now() - elapsedSeconds * 1000)
  }, [elapsedSeconds, status])

  const openMenu = useCallback(() => {
    heldKeys.current.clear()
    pauseGameTimer()
    setIsMenuOpen(true)
    setMenuView('main')
  }, [pauseGameTimer])

  const closeMenu = useCallback(() => {
    heldKeys.current.clear()
    resumeGameTimer()
    setIsMenuOpen(false)
    setMenuView('main')
  }, [resumeGameTimer])

  const toggleMenu = useCallback(() => {
    if (isMenuOpen) {
      closeMenu()
      return
    }

    openMenu()
  }, [closeMenu, isMenuOpen, openMenu])

  function handleRestartClick() {
    if (status === 'won') {
      setIsRestartConfirmOpen(true)
      return
    }

    resetLevel()
  }

  function setMusic(shouldPlay: boolean) {
    const music = musicRef.current
    setIsMusicOn(shouldPlay)

    if (!music) {
      return
    }

    if (shouldPlay) {
      try {
        const playPromise = music.play()
        playPromise?.catch(() => setIsMusicOn(false))
      } catch {
        setIsMusicOn(false)
      }
      return
    }

    music.pause()
    music.currentTime = 0
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
      heldKeys.current.clear()
      setPosition(startPosition)
      setStatus('crashed')
      return
    }

    setPosition(nextPosition)

    if (circleTouchesRect(nextPosition, playerRadius, goal)) {
      heldKeys.current.clear()
      setStatus('won')
    }
  }, [isMenuOpen, level.obstacles, position.x, position.y, status])

  const startMoving = useCallback((key: string) => {
    const move = keyMoves[key]

    if (!move) {
      return
    }

    if (!heldKeys.current.has(key)) {
      movePlayer(move)
    }

    heldKeys.current.add(key)
  }, [movePlayer])

  const stopMoving = useCallback((key: string) => {
    heldKeys.current.delete(key)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        toggleMenu()
        return
      }

      const key = event.key.toLowerCase()
      const move = keyMoves[key]
      if (move) {
        event.preventDefault()
        startMoving(key)
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      stopMoving(event.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startMoving, stopMoving, toggleMenu])

  useEffect(() => {
    const movementTimer = window.setInterval(() => {
      const heldMoves = [...heldKeys.current]
        .map((key) => keyMoves[key])
        .filter(Boolean)

      if (heldMoves.length === 0) {
        return
      }

      movePlayer({
        x: clamp(
          heldMoves.reduce((sum, move) => sum + move.x, 0),
          -moveStep,
          moveStep,
        ),
        y: clamp(
          heldMoves.reduce((sum, move) => sum + move.y, 0),
          -moveStep,
          moveStep,
        ),
      })
    }, heldKeyMoveDelay)

    return () => window.clearInterval(movementTimer)
  }, [movePlayer])

  useEffect(() => {
    if (status !== 'playing' || isMenuOpen) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((Date.now() - timerStartedAt) / 1000)
    }, 100)

    return () => window.clearInterval(timer)
  }, [isMenuOpen, status, timerStartedAt])

  useEffect(() => {
    saveGame({
      highestUnlockedLevel,
      language,
      levelIndex,
      playerColor,
      showShadows,
    })
  }, [highestUnlockedLevel, language, levelIndex, playerColor, showShadows])

  useEffect(() => {
    if (!showSavedMessage) {
      return undefined
    }

    const messageTimer = window.setTimeout(() => {
      setShowSavedMessage(false)
    }, 1800)

    return () => window.clearTimeout(messageTimer)
  }, [showSavedMessage])

  return (
    <main className={`game-shell${showShadows ? '' : ' no-shadows'}`}>
      <audio ref={musicRef} loop preload="auto" src="/gvidon-gvidon-medicine-364031.mp3" />
      <section className="game-header" aria-labelledby="game-title">
        <div>
          <p className="eyebrow">2D hinderløype</p>
          <h1 id="game-title">{copy.gameTitle}</h1>
        </div>
        <div className="status-badges">
          <div className="timer-badge" aria-label={`${copy.timer} ${timerLabel}`}>
            <span>{copy.timer}</span>
            <strong>{timerLabel}</strong>
          </div>
          <div className="level-badge">{levelLabel}</div>
        </div>
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

      <div className="touch-controls" aria-label="Mobilkontroller">
        {touchControls.map((control) => (
          <button
            aria-label={control.label}
            className={`touch-control touch-control-${control.area}`}
            key={control.key}
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={() => stopMoving(control.key)}
            onPointerDown={(event) => {
              event.preventDefault()
              event.currentTarget.setPointerCapture?.(event.pointerId)
              startMoving(control.key)
            }}
            onPointerLeave={() => stopMoving(control.key)}
            onPointerUp={(event) => {
              event.preventDefault()
              stopMoving(control.key)
            }}
            type="button"
          >
            {control.symbol}
          </button>
        ))}
      </div>

      {isMenuOpen && (
        <div className="menu-backdrop" role="dialog" aria-modal="true">
          {menuView === 'main' ? (
            <div className="menu-card">
              <button type="button" onClick={closeMenu}>
                {copy.continue}
              </button>
              <button type="button" onClick={() => setMenuView('colors')}>
                {copy.changeColor}
              </button>
              <button type="button" onClick={() => setMenuView('language')}>
                {copy.changeLanguage}
              </button>
              <button className="levels-menu-button" type="button" onClick={() => setMenuView('levels')}>
                {copy.levels}
              </button>
              <button type="button" onClick={() => setMenuView('settings')}>
                {copy.settings}
              </button>
              <button type="button" onClick={saveCurrentGame}>
                {copy.save}
              </button>
              {showSavedMessage ? <p className="saved-message">{copy.saved}</p> : null}
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
                    >
                      {isLocked ? (
                        <span className="locked-color-label">{copy.unlockRainbow}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : menuView === 'language' ? (
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
          ) : menuView === 'levels' ? (
            <div className="levels-menu">
              <button
                aria-label={copy.back}
                className="levels-back-button"
                type="button"
                onClick={() => setMenuView('main')}
              >
                {copy.back}
              </button>
              <h2>{copy.levelsHeading}</h2>
              <div className="levels-grid">
                {levels.map((gameLevel, index) => {
                  const isUnlocked = index + 1 <= highestUnlockedLevel

                  return (
                    <button
                      aria-label={
                        isUnlocked
                          ? gameLevel.name
                          : `${gameLevel.name} ${copy.lockedLevel}`
                      }
                      className="level-select-button"
                      disabled={!isUnlocked}
                      key={gameLevel.name}
                      onClick={() => chooseLevel(index)}
                      type="button"
                    >
                      <span>{index + 1}</span>
                      {!isUnlocked ? <small>{copy.lockedLevel}</small> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="menu-card settings-menu">
              <button
                aria-label={copy.back}
                className="back-button"
                type="button"
                onClick={() => setMenuView('main')}
              >
                {copy.back}
              </button>
              <h2>{copy.settingsHeading}</h2>
              <div className="settings-row">
                <span>{copy.shadows}</span>
                <div className="toggle-buttons">
                  <button
                    aria-pressed={!showShadows}
                    className={!showShadows ? 'selected-toggle' : ''}
                    type="button"
                    onClick={() => setShowShadows(false)}
                  >
                    {copy.shadowsOff}
                  </button>
                  <button
                    aria-pressed={showShadows}
                    className={showShadows ? 'selected-toggle' : ''}
                    type="button"
                    onClick={() => setShowShadows(true)}
                  >
                    {copy.shadowsOn}
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <span>{copy.music}</span>
                <div className="toggle-buttons">
                  <button
                    aria-pressed={!isMusicOn}
                    className={!isMusicOn ? 'selected-toggle' : ''}
                    type="button"
                    onClick={() => setMusic(false)}
                  >
                    {copy.musicOff}
                  </button>
                  <button
                    aria-pressed={isMusicOn}
                    className={isMusicOn ? 'selected-toggle' : ''}
                    type="button"
                    onClick={() => setMusic(true)}
                  >
                    {copy.musicOn}
                  </button>
                </div>
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
