import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PreviewPanel } from '@/components/shell/PreviewPanel'
import { createDemoRecipe } from '@/features/recipes/data/development-recipe'
import { pizzaRecipe } from '@/features/recipes/model/__fixtures__/recipes'

describe('live recipe preview', () => {
  beforeEach(() => localStorage.clear())

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
    expect(
      screen.queryByRole('heading', { name: 'Пищевая ценность' }),
    ).not.toBeInTheDocument()
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

  it('renders the development demo recipe content for style review', () => {
    render(<PreviewPanel recipe={createDemoRecipe()} imageUrls={{}} />)
    expect(screen.getByText('Пицца Маргарита — ТЕСТ')).toBeInTheDocument()
    expect(screen.getByText('Моцарелла')).toBeInTheDocument()
    expect(screen.getByText('250 г')).toBeInTheDocument()
    expect(screen.getByText('780')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(15)
    expect(
      screen.getByText(/тестовая демонстрационная запись/i),
    ).toBeInTheDocument()
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

  it('switches through distinct styles and keeps the source recipe unchanged', () => {
    const source = structuredClone(pizzaRecipe)
    render(<PreviewPanel recipe={pizzaRecipe} imageUrls={{}} />)
    const style = screen.getByLabelText('Стиль')
    for (const value of [
      'editorial',
      'restaurant',
      'vintage',
      'japanese',
      'chef-sheet',
      'monochrome',
    ]) {
      fireEvent.change(style, { target: { value } })
      expect(
        document.querySelector(`.recipe-style-${value}`),
      ).toBeInTheDocument()
    }
    expect(pizzaRecipe).toEqual(source)
  })

  it('supports print orientation and the responsive two-page book spread', () => {
    render(<PreviewPanel recipe={pizzaRecipe} imageUrls={{}} />)
    fireEvent.change(screen.getByLabelText('Формат'), {
      target: { value: 'a4' },
    })
    fireEvent.change(screen.getByLabelText('Ориентация'), {
      target: { value: 'landscape' },
    })
    expect(
      document.querySelector('[data-orientation="landscape"]'),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Формат'), {
      target: { value: 'book-spread' },
    })
    expect(document.querySelector('.recipe-book-spread')).toBeInTheDocument()
    expect(screen.getByText('Итальянская пицца')).toBeInTheDocument()
    expect(screen.getByText('Приготовление')).toBeInTheDocument()
  })

  it('restores appearance after remount and keeps long recipe content visible', () => {
    const longRecipe = {
      ...pizzaRecipe,
      steps: Array.from({ length: 22 }, (_, index) => ({
        ...pizzaRecipe.steps[index % pizzaRecipe.steps.length],
        id: `long-step-${index}`,
        instruction: `Длинный способ приготовления ${index}: ${'текст '.repeat(36)}`,
      })),
    }
    const view = render(<PreviewPanel recipe={longRecipe} imageUrls={{}} />)
    fireEvent.change(screen.getByLabelText('Формат'), {
      target: { value: 'a5' },
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Предпросмотр показывает всё содержимое',
    )
    view.unmount()
    render(<PreviewPanel recipe={longRecipe} imageUrls={{}} />)
    expect(screen.getByLabelText('Формат')).toHaveValue('a5')
    expect(document.querySelectorAll('.recipe-step-content')).toHaveLength(22)
  })

  it('saves, applies, renames and deletes a presentation preset', () => {
    render(<PreviewPanel recipe={pizzaRecipe} imageUrls={{}} />)
    fireEvent.click(screen.getByText('Стиль и формат'))
    fireEvent.change(screen.getByLabelText('Стиль'), {
      target: { value: 'vintage' },
    })
    fireEvent.change(screen.getByLabelText('Название пресета'), {
      target: { value: 'Тёплая книга' },
    })
    fireEvent.click(screen.getByText('Сохранить как новый'))
    const presetSelect = screen.getByLabelText('Сохранённые пресеты')
    expect((presetSelect as HTMLSelectElement).value).not.toBe('')
    fireEvent.change(screen.getByLabelText('Стиль'), {
      target: { value: 'monochrome' },
    })
    fireEvent.change(presetSelect, {
      target: { value: (presetSelect as HTMLSelectElement).options[1].value },
    })
    expect(screen.getByLabelText('Стиль')).toHaveValue('vintage')
    fireEvent.change(screen.getByLabelText('Название пресета'), {
      target: { value: 'Винтаж' },
    })
    fireEvent.click(screen.getByText('Переименовать'))
    expect(screen.getByRole('option', { name: 'Винтаж' })).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Удалить пресет Винтаж'))
    expect(
      screen.queryByRole('option', { name: 'Винтаж' }),
    ).not.toBeInTheDocument()
  })
})
