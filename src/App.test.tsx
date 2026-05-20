import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { levels } from './levels'

function getPlayer() {
  return screen.getByTestId('player')
}

function pressKey(key: string) {
  fireEvent.keyDown(window, { key })
  fireEvent.keyUp(window, { key })
}

test('shows the 2D game with a light blue player and a gold goal', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Dont touch the red' })).toBeInTheDocument()
  expect(screen.getByText('Nivå 1 av 25')).toBeInTheDocument()
  expect(screen.getByLabelText('tid 0.0 s')).toBeInTheDocument()
  expect(screen.getByLabelText('Spiller')).toHaveStyle({ backgroundColor: '#7dd3fc' })
  expect(screen.getByLabelText('Gull firkant')).toHaveStyle({
    left: '91.11111111111111%',
    top: '42.30769230769231%',
  })
})

test('shows a timer with decimals while playing', () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-05-20T10:00:00.000Z'))
  render(<App />)

  act(() => {
    jest.setSystemTime(new Date('2026-05-20T10:00:01.200Z'))
    jest.advanceTimersByTime(1200)
  })

  expect(screen.getByLabelText('tid 2.4 s')).toBeInTheDocument()
  jest.useRealTimers()
})

test('has 25 playable levels that get more crowded', () => {
  expect(levels).toHaveLength(25)
  expect(levels[0].name).toBe('Nivå 1')
  expect(levels[24].name).toBe('Nivå 25')
  expect(levels[24].obstacles.length).toBeGreaterThan(levels[0].obstacles.length)
})

test('keeps red obstacle hitboxes aligned with the visible rectangles', () => {
  render(<App />)

  expect(screen.getAllByLabelText('Rød firkant')[0]).toHaveStyle({
    boxSizing: 'border-box',
  })
})

test('moves the player with WASD keys', () => {
  render(<App />)

  pressKey('d')
  expect(getPlayer()).toHaveStyle({ left: '7.333333333333333%' })

  pressKey('s')
  expect(getPlayer()).toHaveStyle({ top: '53.46153846153846%' })
})

test('keeps moving right while D is held down', () => {
  jest.useFakeTimers()
  render(<App />)

  fireEvent.keyDown(window, { key: 'd' })
  expect(getPlayer()).toHaveStyle({ left: '7.333333333333333%' })

  act(() => {
    jest.advanceTimersByTime(55)
  })

  expect(getPlayer()).toHaveStyle({ left: '9.333333333333334%' })

  fireEvent.keyUp(window, { key: 'd' })
  jest.useRealTimers()
})

test('resets the player and shows encouragement after touching red', () => {
  render(<App />)

  for (let i = 0; i < 8; i += 1) {
    pressKey('d')
  }

  expect(screen.getByText('du klarer dette:)')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'restart' })).toBeInTheDocument()
  expect(getPlayer()).toHaveStyle({
    left: '5.333333333333334%',
    top: '50%',
  })
})

test('opens the menu with Escape and lets the player choose a new color', async () => {
  const user = userEvent.setup()
  render(<App />)

  fireEvent.keyDown(window, { key: 'Escape' })

  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'fortsett' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'bytt farge' }))
  await user.click(screen.getByRole('button', { name: 'Velg Oransje' }))

  expect(getPlayer()).toHaveStyle({ background: '#f97316' })
})

test('shows more colors and locks rainbow until level 10', async () => {
  const user = userEvent.setup()
  render(<App />)

  fireEvent.keyDown(window, { key: 'Escape' })
  await user.click(screen.getByRole('button', { name: 'bytt farge' }))

  expect(screen.getByRole('button', { name: 'Velg Lys lilla' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Velg Lyseblå' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Velg Rosa' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Velg Blå' })).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Velg Regnbue (nå nivå 10)' }),
  ).toBeDisabled()
  expect(screen.getByText('nå nivå 10')).toBeVisible()
})

test('unlocks rainbow when the player reaches level 10', async () => {
  const user = userEvent.setup()
  const savedObstacles = levels.slice(0, 10).map((level) => level.obstacles)
  levels.slice(0, 10).forEach((level) => {
    level.obstacles = []
  })

  render(<App />)

  for (let level = 1; level < 10; level += 1) {
    for (let i = 0; i < 43; i += 1) {
      pressKey('d')
    }

    await user.click(screen.getByRole('button', { name: 'neste' }))
  }

  expect(screen.getByText('Nivå 10 av 25')).toBeInTheDocument()

  fireEvent.keyDown(window, { key: 'Escape' })
  await user.click(screen.getByRole('button', { name: 'bytt farge' }))

  expect(screen.getByRole('button', { name: 'Velg Regnbue' })).toBeEnabled()

  levels.slice(0, 10).forEach((level, index) => {
    level.obstacles = savedObstacles[index]
  })
})

test('can switch the menu language to English', async () => {
  const user = userEvent.setup()
  render(<App />)

  fireEvent.keyDown(window, { key: 'Escape' })
  await user.click(screen.getByRole('button', { name: 'bytt språk' }))
  await user.click(screen.getByRole('button', { name: 'Velg språk engelsk' }))

  expect(screen.getByRole('heading', { name: 'change language' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'back' })).toBeInTheDocument()
})

test('opens settings and toggles shadows off and on', async () => {
  const user = userEvent.setup()
  render(<App />)

  fireEvent.keyDown(window, { key: 'Escape' })
  await user.click(screen.getByRole('button', { name: 'instillinger' }))

  expect(screen.getByRole('heading', { name: 'instillinger' })).toBeInTheDocument()
  expect(screen.getByText('skygger')).toBeInTheDocument()

  await user.click(screen.getAllByRole('button', { name: 'av' })[0])
  expect(screen.getByRole('main')).toHaveClass('no-shadows')
  expect(screen.getAllByRole('button', { name: 'av' })[0]).toHaveAttribute('aria-pressed', 'true')

  await user.click(screen.getAllByRole('button', { name: 'på' })[0])
  expect(screen.getByRole('main')).not.toHaveClass('no-shadows')
  expect(screen.getAllByRole('button', { name: 'på' })[0]).toHaveAttribute('aria-pressed', 'true')
})

test('opens settings and toggles music on and off', async () => {
  const user = userEvent.setup()
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)

  render(<App />)

  fireEvent.keyDown(window, { key: 'Escape' })
  await user.click(screen.getByRole('button', { name: 'instillinger' }))

  expect(screen.getByText('musikk')).toBeInTheDocument()

  const offButtons = screen.getAllByRole('button', { name: 'av' })
  const onButtons = screen.getAllByRole('button', { name: 'på' })

  expect(offButtons[1]).toHaveAttribute('aria-pressed', 'true')

  await user.click(onButtons[1])
  expect(onButtons[1]).toHaveAttribute('aria-pressed', 'true')

  await user.click(offButtons[1])
  expect(offButtons[1]).toHaveAttribute('aria-pressed', 'true')

  jest.restoreAllMocks()
})

test('asks if the player is sure before restarting after winning', async () => {
  const user = userEvent.setup()
  const firstLevelObstacles = levels[0].obstacles
  levels[0].obstacles = []

  render(<App />)

  for (let i = 0; i < 43; i += 1) {
    pressKey('d')
  }

  expect(screen.getByText('du klarte det!')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'restart' }))

  expect(screen.getByText('er du sikker')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'ja' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'nei' })).toBeInTheDocument()

  levels[0].obstacles = firstLevelObstacles
})
