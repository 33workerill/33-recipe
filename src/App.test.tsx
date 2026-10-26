import { render, screen } from '@testing-library/react'
import App from '@/App'
import { describe, expect, it } from 'vitest'

describe('Foundation page', () => {
  it('renders the project name, subtitle and current phase', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Рецепты, к которым хочется возвращаться.',
    )
    expect(
      screen.getAllByText('33 RECIPE', { exact: false }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Personal Recipe Studio', { exact: false }).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Проект на этапе Foundation')).toBeInTheDocument()
  })
})
