import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeRenderer } from '@/features/recipes/presentation/RecipeRenderer'
import { EditorWorkspace } from '@/components/shell/EditorWorkspace'
import { createDemoRecipe } from '@/features/recipes/data/development-recipe'
import { DEFAULT_PRESENTATION } from '@/features/recipes/presentation'

describe('recipe source and presentation settings', () => {
  it('provides semantic measurable blocks for all content on physical paper without service branding', () => {
    const { container } = render(
      <RecipeRenderer
        recipe={createDemoRecipe()}
        imageUrls={{}}
        presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a4' }}
      />,
    )
    const page = container.querySelector('.recipe-paper')!
    expect(page.getAttribute('style')).toContain('--page-width: 210mm')
    expect(page.getAttribute('style')).toContain('--page-height: 297mm')
    expect(page).not.toHaveTextContent('33 RECIPE')
    expect(
      page.querySelectorAll('[data-layout-unit="ingredients"]'),
    ).toHaveLength(9)
    expect(page.querySelectorAll('[data-layout-unit="method"]')).toHaveLength(6)
    expect(page).toHaveTextContent('Пищевая ценность')
    expect(page).toHaveTextContent('Совет')
    expect(page).toHaveTextContent('Заметки')
  })
  it('places presentation controls in editor section 06', () => {
    const changes: string[] = []
    render(
      <EditorWorkspace
        recipe={createDemoRecipe()}
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
    fireEvent.change(screen.getByLabelText('Формат'), {
      target: { value: 'a4-duplex' },
    })
    expect(changes).toEqual(['a4-duplex'])
  })
})
