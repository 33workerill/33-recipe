import { render, screen } from '@testing-library/react'
import App from '@/App'
import { ThemeProvider } from '@/theme/theme-provider'
import { describe, expect, it } from 'vitest'

describe('Landing page', () => {
  it('renders the project name, subtitle and current phase', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Рецепты, к которым хочется возвращаться.',
    )
    expect(
      screen.getAllByText('33 RECIPE', { exact: false }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Personal Recipe Studio', { exact: false }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Проект на этапе Design System'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '33 UI' })).toHaveAttribute(
      'href',
      '/ui',
    )
  })
})
