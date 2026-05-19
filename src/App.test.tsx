import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

test('renders the starter React app and increments the counter', async () => {
  const user = userEvent.setup()

  render(<App />)

  expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument()

  const counter = screen.getByRole('button', { name: /count is 0/i })
  await user.click(counter)

  expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()
})
