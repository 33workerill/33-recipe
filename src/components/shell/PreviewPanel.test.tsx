import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreviewPanel } from '@/components/shell/PreviewPanel'
import { pizzaRecipe } from '@/features/recipes/model/__fixtures__/recipes'

describe('live recipe preview', () => {
  it('renders current recipe content and omits optional sections when empty', () => {
    const live = {
      ...pizzaRecipe,
      title: 'Актуальное название',
      tips: '',
      notes: '',
      nutrition: { basis: 'per_serving' as const },
    }
    render(<PreviewPanel recipe={live} imageUrls={{}} />)
    expect(screen.getByText('Актуальное название')).toBeInTheDocument()
    expect(screen.getByText('Ингредиенты')).toBeInTheDocument()
    expect(screen.queryByText('Совет')).not.toBeInTheDocument()
    expect(screen.queryByText('Пищевая ценность')).not.toBeInTheDocument()
  })

  it('shows the empty state without a selected recipe and has no forced page height', () => {
    const { container } = render(<PreviewPanel recipe={null} imageUrls={{}} />)
    expect(screen.getByText('Выберите или создайте рецепт')).toBeInTheDocument()
    expect(container.querySelector('[class*="aspect-"]')).toBeNull()
  })

  it('renders an available cover from a local object URL', () => {
    const cover = pizzaRecipe.assets[0]
    const { container } = render(
      <PreviewPanel
        recipe={pizzaRecipe}
        imageUrls={{ [cover.id]: 'blob:cover' }}
      />,
    )
    expect(container.querySelector(`img[src="blob:cover"]`)).toBeInTheDocument()
  })

  it('renders gallery images that are present in local storage', () => {
    const gallery = {
      ...pizzaRecipe.assets[0],
      id: '00000000-0000-4000-8000-000000000998',
      role: 'gallery' as const,
      filename: 'gallery.jpg',
    }
    const { container } = render(
      <PreviewPanel
        recipe={{ ...pizzaRecipe, assets: [...pizzaRecipe.assets, gallery] }}
        imageUrls={{ [gallery.id]: 'blob:gallery' }}
      />,
    )
    expect(
      container.querySelector('img[src="blob:gallery"]'),
    ).toBeInTheDocument()
  })

  it('renders changed ingredient and step order from the latest recipe', () => {
    const { container, rerender } = render(
      <PreviewPanel recipe={pizzaRecipe} imageUrls={{}} />,
    )
    const updated = {
      ...pizzaRecipe,
      ingredientGroups: pizzaRecipe.ingredientGroups.map((group, index) =>
        index === 0
          ? {
              ...group,
              ingredients: [
                ...group.ingredients,
                {
                  ...group.ingredients[0],
                  id: '00000000-0000-4000-8000-000000000999',
                  name: 'Новый ингредиент',
                },
              ],
            }
          : group,
      ),
      steps: [...pizzaRecipe.steps].reverse(),
    }
    rerender(<PreviewPanel recipe={updated} imageUrls={{}} />)
    expect(screen.getByText('Новый ингредиент')).toBeInTheDocument()
    const steps = container.querySelectorAll('ol > li')
    expect(steps[0]).toHaveTextContent(pizzaRecipe.steps.at(-1)!.instruction)
  })
})
