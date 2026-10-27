import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Root } from '@/Root'

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
  window.localStorage.clear()
})

describe('UI Showcase', () => {
  it('renders all nine sections on the direct /ui route', async () => {
    window.history.replaceState(null, '', '/ui')
    render(<Root />)

    expect(
      await screen.findByRole('heading', { level: 1 }, { timeout: 5000 }),
    ).toHaveTextContent('Пространство для хороших идей.')
    for (const title of [
      'Colors',
      'Typography',
      'Buttons',
      'Form Controls',
      'Navigation',
      'Cards & Containers',
      'Feedback',
      'Dialogs & Overlays',
      'Dark Mode Preview',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
  })

  it('exposes labeled controls and meaningful interactive states', async () => {
    window.history.replaceState(null, '', '/ui')
    render(<Root />)

    expect(
      await screen.findByRole('textbox', { name: 'Название рецепта' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Заметка' })).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Email для примера ошибки' }),
    ).toHaveAttribute('aria-invalid', 'true')
    expect(
      screen.getByRole('button', { name: 'Добавить пример' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Loading/ })).toHaveAttribute(
      'aria-busy',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Добавить пример' }))
    expect(screen.getByRole('status')).toHaveTextContent('Пример добавлен')
  })
})
