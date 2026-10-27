import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { ThemeProvider } from '@/theme/theme-provider'

function renderShell() {
  render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  )
}

describe('App Shell', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens directly in the editor with its main panels and unavailable future actions', () => {
    renderShell()

    expect(
      screen.getByRole('main', { name: 'Редактор рецепта' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Редактор рецепта' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Предпросмотр рецепта')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Новый рецепт' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Сохранить рецепт' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Экспортировать' }),
    ).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Название' })).toBeDisabled()
  })

  it('switches navigation and shows honest library and history empty states', () => {
    renderShell()

    fireEvent.click(screen.getByRole('button', { name: 'Мои рецепты' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Мои рецепты' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/коллекция появится здесь/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Недавние' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Недавние' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/нет записей/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Настройки' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Настройки' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('group', { name: 'Тема интерфейса' }).length,
    ).toBeGreaterThan(0)

    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Основная навигация' }),
      ).getByRole('button', { name: 'Редактор' }),
    )
    expect(
      screen.getByRole('main', { name: 'Редактор рецепта' }),
    ).toBeInTheDocument()
  })

  it('expands and collapses the editor sections', () => {
    renderShell()

    expect(screen.queryByText('Список ингредиентов')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ингредиенты/ }))
    expect(screen.getByText('Список ингредиентов')).toBeVisible()
    expect(screen.getByText('Группы ингредиентов')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Ингредиенты/ }))
    expect(screen.queryByText('Список ингредиентов')).not.toBeInTheDocument()
  })

  it('keeps accessible navigation names when the sidebar is collapsed', () => {
    renderShell()

    fireEvent.click(screen.getByRole('button', { name: 'Свернуть панель' }))
    expect(
      screen.getByRole('button', { name: 'Развернуть панель' }),
    ).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', {
      name: 'Основная навигация',
    })
    expect(
      within(navigation).getByRole('button', { name: 'Мои рецепты' }),
    ).toBeInTheDocument()
  })

  it('switches the compact workspace between editor and preview', () => {
    renderShell()

    const editor = screen.getByRole('main', {
      name: 'Редактор рецепта',
    }).parentElement
    const preview = screen.getByLabelText('Предпросмотр рецепта').parentElement
    expect(editor).not.toHaveClass('hidden')
    expect(preview).toHaveClass('hidden')

    fireEvent.click(
      screen.getByRole('button', { name: 'Предпросмотр', pressed: false }),
    )
    expect(editor).toHaveClass('hidden')
    expect(preview).not.toHaveClass('hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Мои рецепты' }))
    fireEvent.click(screen.getByRole('button', { name: 'Редактор' }))
    expect(
      screen.getByRole('button', { name: 'Редактор', pressed: true }),
    ).toBeInTheDocument()
  })

  it('opens mobile navigation and closes it after choosing a section', () => {
    renderShell()

    fireEvent.click(screen.getByRole('button', { name: 'Открыть меню' }))
    const dialog = screen.getByRole('dialog', { name: 'Навигация 33 RECIPE' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Недавние' }))
    expect(
      screen.queryByRole('dialog', { name: 'Навигация 33 RECIPE' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Недавние' }),
    ).toBeInTheDocument()
  })
})
