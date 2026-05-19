import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

function getPlayer() {
  return screen.getByTestId('player')
}

test('shows the 2D game with a light blue player and a gold goal', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Dont touch the red' })).toBeInTheDocument()
  expect(screen.getByLabelText('Spiller')).toHaveStyle({ backgroundColor: '#7dd3fc' })
  expect(screen.getByLabelText('Gull firkant')).toHaveStyle({
    left: '820px',
    top: '220px',
  })
})

test('moves the player with WASD keys', () => {
  render(<App />)

  fireEvent.keyDown(window, { key: 'd' })
  expect(getPlayer()).toHaveStyle({ left: '50px' })

  fireEvent.keyDown(window, { key: 's' })
  expect(getPlayer()).toHaveStyle({ top: '262px' })
})

test('resets the player and shows encouragement after touching red', () => {
  render(<App />)

  for (let i = 0; i < 8; i += 1) {
    fireEvent.keyDown(window, { key: 'd' })
  }

  expect(screen.getByText('du klarer dette:)')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'restart' })).toBeInTheDocument()
  expect(getPlayer()).toHaveStyle({ left: '32px', top: '244px' })
})

test('opens the menu with Escape and lets the player choose a new color', async () => {
  const user = userEvent.setup()
  render(<App />)

  fireEvent.keyDown(window, { key: 'Escape' })

  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'fortsett' })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'bytt farge' }))
  await user.click(screen.getByRole('button', { name: 'Velg Oransje' }))

  expect(getPlayer()).toHaveStyle({ backgroundColor: '#f97316' })
})
