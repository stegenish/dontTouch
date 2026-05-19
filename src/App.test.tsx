import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { levels } from './levels'

function getPlayer() {
  return screen.getByTestId('player')
}

test('shows the 2D game with a light blue player and a gold goal', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Dont touch the red' })).toBeInTheDocument()
  expect(screen.getByText('Nivå 1 av 25')).toBeInTheDocument()
  expect(screen.getByLabelText('Spiller')).toHaveStyle({ backgroundColor: '#7dd3fc' })
  expect(screen.getByLabelText('Gull firkant')).toHaveStyle({
    left: '91.11111111111111%',
    top: '42.30769230769231%',
  })
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

  fireEvent.keyDown(window, { key: 'd' })
  expect(getPlayer()).toHaveStyle({ left: '7.333333333333333%' })

  fireEvent.keyDown(window, { key: 's' })
  expect(getPlayer()).toHaveStyle({ top: '53.46153846153846%' })
})

test('resets the player and shows encouragement after touching red', () => {
  render(<App />)

  for (let i = 0; i < 8; i += 1) {
    fireEvent.keyDown(window, { key: 'd' })
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
    screen.getByRole('button', { name: 'Velg Regnbue (låst til nivå 10)' }),
  ).toBeDisabled()
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
      fireEvent.keyDown(window, { key: 'd' })
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

test('asks if the player is sure before restarting after winning', async () => {
  const user = userEvent.setup()
  const firstLevelObstacles = levels[0].obstacles
  levels[0].obstacles = []

  render(<App />)

  for (let i = 0; i < 43; i += 1) {
    fireEvent.keyDown(window, { key: 'd' })
  }

  expect(screen.getByText('du klarte det!')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'restart' }))

  expect(screen.getByText('er du sikker')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'ja' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'nei' })).toBeInTheDocument()

  levels[0].obstacles = firstLevelObstacles
})
