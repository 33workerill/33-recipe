import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PresentationSettings } from './PresentationSettings'
import { loadPresentationPresets } from '@/features/recipes/presentation'
import { DEFAULT_PRESENTATION } from '@/features/recipes/presentation'

describe('presentation settings in the editor', () => {
  beforeEach(() => localStorage.clear())

  it('updates duplex format and persists user presets', () => {
    let current = { ...DEFAULT_PRESENTATION }
    const change = (next: typeof DEFAULT_PRESENTATION) => {
      current = next
    }
    const view = render(
      <PresentationSettings presentation={current} onChange={change} />,
    )
    fireEvent.change(screen.getByLabelText('Формат'), {
      target: { value: 'a5-duplex' },
    })
    expect(current.formatId).toBe('a5-duplex')
    view.rerender(
      <PresentationSettings presentation={current} onChange={change} />,
    )
    fireEvent.change(screen.getByLabelText('Название пресета'), {
      target: { value: 'Двусторонний' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить пресет' }))
    expect(loadPresentationPresets()).toHaveLength(1)
    expect(loadPresentationPresets()[0].presentation.formatId).toBe('a5-duplex')
  })

  it('restores the selected recipe settings to defaults', () => {
    const change = vi.fn()
    render(
      <PresentationSettings
        presentation={{ ...DEFAULT_PRESENTATION, styleId: 'vintage' }}
        onChange={change}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))
    expect(change).toHaveBeenCalledWith(DEFAULT_PRESENTATION)
  })
})
