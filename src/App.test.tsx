import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { RecipeRepository } from '@/features/recipes/data/repository'
import { DEMO_RECIPE_ID } from '@/features/recipes/data/development-recipe'
import { ThemeProvider } from '@/theme/theme-provider'

function renderShell() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  )
}

describe('Recipe workspace', () => {
  beforeEach(() => {
    window.localStorage.clear()
    globalThis.indexedDB = new IDBFactory()
  })

  it('creates an empty draft, autosaves edits, and reopens it after remount', async () => {
    const view = renderShell()
    const editor = screen.getByRole('main', { name: 'Редактор рецепта' })
    expect(
      within(editor).getByText('Здесь начнётся ваш рецепт'),
    ).toBeInTheDocument()
    fireEvent.click(
      within(editor).getByRole('button', { name: 'Новый рецепт' }),
    )
    const title = await screen.findByRole('textbox', { name: 'Название' })
    fireEvent.change(title, { target: { value: 'Пицца' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Описание' }), {
      target: { value: 'Домашняя' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Категория' }), {
      target: { value: 'Ужин' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Теги' }), {
      target: { value: 'семейный' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))
    await waitFor(
      () => expect(screen.getByRole('status')).toHaveTextContent('Сохранено'),
      { timeout: 3000 },
    )
    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Основная навигация' }),
      ).getByRole('button', { name: 'Мои рецепты' }),
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Мои рецепты' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Пицца')).toBeInTheDocument()
    view.unmount()

    renderShell()
    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Основная навигация' }),
      ).getByRole('button', { name: 'Мои рецепты' }),
    )
    expect(await screen.findByText('Пицца')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Открыть' }))
    expect(
      await screen.findByRole('textbox', { name: 'Название' }),
    ).toHaveValue('Пицца')
    expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveValue(
      'Домашняя',
    )
    expect(screen.getByRole('textbox', { name: 'Категория' })).toHaveValue(
      'Ужин',
    )
    expect(screen.getByText('семейный')).toBeInTheDocument()
  })

  it('adds one development demo recipe and reopens it instead of duplicating', async () => {
    renderShell()
    const navigation = screen.getByRole('navigation', {
      name: 'Основная навигация',
    })
    fireEvent.click(
      within(navigation).getByRole('button', { name: 'Мои рецепты' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Добавить тестовый рецепт' }),
    )
    expect(
      await screen.findByRole('textbox', { name: 'Название' }),
    ).toHaveValue('Пицца Маргарита — ТЕСТ')

    fireEvent.click(
      within(navigation).getByRole('button', { name: 'Мои рецепты' }),
    )
    expect(
      await screen.findByText('Пицца Маргарита — ТЕСТ'),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Добавить тестовый рецепт' }),
    )
    expect(
      await screen.findByRole('textbox', { name: 'Название' }),
    ).toHaveValue('Пицца Маргарита — ТЕСТ')

    fireEvent.click(
      within(navigation).getByRole('button', { name: 'Мои рецепты' }),
    )
    await screen.findByRole('heading', { level: 1, name: 'Мои рецепты' })
    const demoRecords = (await new RecipeRepository().list()).filter(
      ({ recipe }) => recipe.id === DEMO_RECIPE_ID,
    )
    expect(demoRecords).toHaveLength(1)
  })

  it('edits groups, fractional amounts, steps and draft status', async () => {
    renderShell()
    fireEvent.click(
      within(screen.getByRole('main', { name: 'Редактор рецепта' })).getByRole(
        'button',
        { name: 'Новый рецепт' },
      ),
    )
    await screen.findByRole('textbox', { name: 'Название' })
    fireEvent.click(screen.getByRole('button', { name: /Ингредиенты/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Добавить группу' }))
    fireEvent.click(screen.getByRole('button', { name: 'Добавить ингредиент' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Продукт 1' }), {
      target: { value: 'Мука' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Количество' }), {
      target: { value: '2,25' },
    })
    expect(screen.getByRole('textbox', { name: 'Количество' })).toHaveValue(
      '2,25',
    )
    fireEvent.click(screen.getByRole('button', { name: /Приготовление/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Инструкция' }), {
      target: { value: 'Смешайте\nи выпекайте.' },
    })
    expect(screen.getByText('Черновик')).toBeInTheDocument()
    await waitFor(
      () => expect(screen.getByRole('status')).toHaveTextContent('Сохранено'),
      { timeout: 3000 },
    )
    expect(
      screen.getByRole('button', { name: 'Экспортировать' }),
    ).toBeDisabled()
  })

  it('supports library search and keeps mobile navigation accessible', async () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Открыть меню' }))
    const dialog = screen.getByRole('dialog', { name: 'Навигация 33 RECIPE' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Мои рецепты' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Мои рецепты' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/Создайте первый черновик/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Поиск по названию' }),
    ).toBeInTheDocument()
  })

  it('persists ordered groups, fractional and absent amounts, and three steps', async () => {
    renderShell()
    fireEvent.click(
      within(screen.getByRole('main', { name: 'Редактор рецепта' })).getByRole(
        'button',
        { name: 'Новый рецепт' },
      ),
    )
    fireEvent.change(await screen.findByRole('textbox', { name: 'Название' }), {
      target: { value: 'Пицца тестовая' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ингредиенты/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Добавить группу' }))
    fireEvent.click(screen.getByRole('button', { name: 'Добавить группу' }))
    const groups = screen.getAllByRole('region', {
      name: /Группа ингредиентов/,
    })
    fireEvent.change(
      within(groups[0]).getByRole('textbox', { name: 'Название группы 1' }),
      { target: { value: 'Тесто' } },
    )
    fireEvent.change(
      within(groups[1]).getByRole('textbox', { name: 'Название группы 2' }),
      { target: { value: 'Начинка' } },
    )
    for (const group of groups) {
      fireEvent.click(
        within(group).getByRole('button', { name: 'Добавить ингредиент' }),
      )
      fireEvent.click(
        within(group).getByRole('button', { name: 'Добавить ингредиент' }),
      )
    }
    const first = screen.getAllByRole('region', {
      name: /Группа ингредиентов/,
    })[0]
    fireEvent.change(
      within(first).getByRole('textbox', { name: 'Продукт 1' }),
      { target: { value: 'Мука' } },
    )
    fireEvent.change(
      within(first).getAllByRole('textbox', { name: 'Количество' })[0],
      { target: { value: '2,25' } },
    )
    fireEvent.change(
      within(first).getByRole('textbox', { name: 'Продукт 2' }),
      { target: { value: 'Соль' } },
    )
    fireEvent.click(
      within(first).getByRole('button', { name: 'Ингредиент 2 вверх' }),
    )
    fireEvent.click(
      within(first).getByRole('button', { name: 'Группу 1 вниз' }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Приготовление/ }))
    for (let i = 0; i < 3; i += 1)
      fireEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }))
    screen
      .getAllByRole('textbox', { name: 'Инструкция' })
      .forEach((field, index) =>
        fireEvent.change(field, { target: { value: `Шаг ${index + 1}` } }),
      )
    fireEvent.click(screen.getByRole('button', { name: 'Шаг 3 вверх' }))
    await waitFor(
      () => expect(screen.getByRole('status')).toHaveTextContent('Сохранено'),
      { timeout: 3000 },
    )
    const saved = (await new RecipeRepository(globalThis.indexedDB).list())[0]
      .recipe
    expect(saved.ingredientGroups.map((group) => group.title)).toEqual([
      'Начинка',
      'Тесто',
    ])
    expect(
      saved.ingredientGroups[1].ingredients.map(
        (ingredient) => ingredient.name,
      ),
    ).toEqual(['Соль', 'Мука'])
    expect(saved.ingredientGroups[1].ingredients[1].amount).toBe(2.25)
    expect(saved.ingredientGroups[1].ingredients[0]).not.toHaveProperty(
      'amount',
    )
    expect(saved.steps.map((step) => step.instruction)).toEqual([
      'Шаг 1',
      'Шаг 3',
      'Шаг 2',
    ])
    expect(new Set(saved.steps.map((step) => step.id)).size).toBe(3)
  })
})
