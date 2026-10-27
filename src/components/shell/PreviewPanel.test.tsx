import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { EditorWorkspace } from '@/components/shell/EditorWorkspace'
import { PreviewPanel } from '@/components/shell/PreviewPanel'
import { createDemoRecipe } from '@/features/recipes/data/development-recipe'
import { pizzaRecipe } from '@/features/recipes/model/__fixtures__/recipes'
import { DEFAULT_PRESENTATION } from '@/features/recipes/presentation'

describe('recipe preview and presentation controls', () => {
  beforeEach(() => localStorage.clear())

  it('renders recipe content on a physically bounded page without service branding', () => {
    const { container } = render(
      <PreviewPanel
        recipe={createDemoRecipe()}
        imageUrls={{}}
        presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a4' }}
      />,
    )
    expect(screen.getAllByText('Пицца Маргарита — ТЕСТ')).toHaveLength(2)
    expect(screen.getByText('Моцарелла')).toBeInTheDocument()
    expect(
      container.querySelector('.recipe-paper')?.getAttribute('style'),
    ).toContain('--page-width: 210mm')
    expect(
      container.querySelector('.recipe-paper')?.getAttribute('style'),
    ).toContain('--page-height: 297mm')
    expect(container.querySelector('.recipe-paper')).not.toHaveTextContent(
      '33 RECIPE',
    )
    expect(container.querySelector('.recipe-paper')).not.toHaveTextContent(
      'PERSONAL RECIPE STUDIO',
    )
  })

  it('presents front and back individually and as a side-by-side duplex spread', () => {
    const { container, rerender } = render(
      <PreviewPanel
        recipe={pizzaRecipe}
        imageUrls={{}}
        presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a4-duplex' }}
      />,
    )
    expect(
      screen.getByRole('group', { name: 'Сторона двустороннего листа' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Оборотная' }))
    expect(container.querySelector('[data-side="back"]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Лицевая' }))
    expect(container.querySelector('[data-side="front"]')).toBeInTheDocument()
    rerender(
      <PreviewPanel
        recipe={pizzaRecipe}
        imageUrls={{}}
        presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a5-duplex' }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Обе' }))
    expect(
      container.querySelector('.recipe-preview-duplex'),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('.recipe-paper')).toHaveLength(2)
  })

  it('keeps recipe overview on the front and supplemental nutrition on the back', () => {
    const { container } = render(
      <PreviewPanel
        recipe={createDemoRecipe()}
        imageUrls={{}}
        presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a4-duplex' }}
      />,
    )
    const front = container.querySelector('[data-side="front"]')
    expect(front).toHaveTextContent('Пицца Маргарита — ТЕСТ')
    expect(front).not.toHaveTextContent('Пищевая ценность')
    fireEvent.click(screen.getByRole('button', { name: 'Оборотная' }))
    const back = container.querySelector('[data-side="back"]')
    expect(back).toHaveTextContent('Ингредиенты')
    expect(back).toHaveTextContent('Приготовление')
    expect(back).toHaveTextContent('Пищевая ценность')
  })

  it('keeps all long step fragments reachable through page navigation', () => {
    const recipe = {
      ...pizzaRecipe,
      steps: Array.from({ length: 28 }, (_, index) => ({
        ...pizzaRecipe.steps[index % pizzaRecipe.steps.length],
        id: `long-${index}`,
        instruction: `Подробный шаг ${index + 1}: ${'перемешайте и приготовьте '.repeat(35)}`,
      })),
    }
    const { container } = render(
      <PreviewPanel
        recipe={recipe}
        imageUrls={{}}
        presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a5' }}
      />,
    )
    expect(screen.getByText(/Лист 1 из/)).toBeInTheDocument()
    let visible = container.querySelectorAll('.recipe-step-content').length
    while (
      screen
        .getByRole('button', { name: 'Следующий лист' })
        .hasAttribute('disabled') === false
    ) {
      fireEvent.click(screen.getByRole('button', { name: 'Следующий лист' }))
      visible += container.querySelectorAll('.recipe-step-content').length
    }
    expect(visible).toBeGreaterThanOrEqual(28)
  })

  it('places the presentation settings in editor section 06 and updates by callback', () => {
    const changes: string[] = []
    render(
      <EditorWorkspace
        recipe={pizzaRecipe}
        status="saved"
        error={null}
        onChange={() => undefined}
        onSave={() => undefined}
        onCreate={() => undefined}
        imageUrls={{}}
        onAddImage={async () => undefined}
        onRemoveImage={async () => undefined}
        onRemoveStep={async () => undefined}
        onAltChange={() => undefined}
        onReorderImage={() => undefined}
        presentation={DEFAULT_PRESENTATION}
        onPresentationChange={(next) => changes.push(next.formatId)}
      />,
    )
    fireEvent.click(screen.getByText('Оформление'))
    expect(screen.getByText('06 / ОФОРМЛЕНИЕ')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Формат'), {
      target: { value: 'a4-duplex' },
    })
    expect(changes).toEqual(['a4-duplex'])
  })
})
