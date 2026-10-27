import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/theme/theme-provider'
import { ThemeToggle } from '@/theme/theme-toggle'

function mockSystemTheme(initialDark: boolean) {
  let dark = initialDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const media = {
    get matches() {
      return dark
    },
    addEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
    ),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  )
  return {
    change(nextDark: boolean) {
      dark = nextDark
      act(() => {
        listeners.forEach((listener) =>
          listener({ matches: nextDark } as MediaQueryListEvent),
        )
      })
    },
  }
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('app theme', () => {
  it('switches light and dark modes with accessible controls', () => {
    mockSystemTheme(false)
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Тёмная тема' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Тёмная тема' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Светлая тема' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('persists the selected theme across remounts', () => {
    mockSystemTheme(false)
    const first = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Тёмная тема' }))
    expect(window.localStorage.getItem('33-recipe-app-theme')).toBe('dark')

    first.unmount()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: 'Тёмная тема' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(document.documentElement).toHaveClass('dark')
  })

  it('follows system changes without a reload', () => {
    const system = mockSystemTheme(true)
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(
      screen.getByRole('button', { name: 'Системная тема' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveClass('dark')

    system.change(false)
    expect(document.documentElement).not.toHaveClass('dark')
    system.change(true)
    expect(document.documentElement).toHaveClass('dark')
  })
})
