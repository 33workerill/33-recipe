import { describe, expect, it } from 'vitest'
import { createDemoRecipe } from '@/features/recipes/data/development-recipe'
import { DEFAULT_PRESENTATION } from './types'
import { createRecipePagePlan, getPageGeometry, isDuplexFormat } from './layout'

describe('recipe page geometry and pagination', () => {
  it('returns physical dimensions for all fixed formats and duplex sheets', () => {
    expect(getPageGeometry('a4', 'portrait')).toMatchObject({
      widthMm: 210,
      heightMm: 297,
    })
    expect(getPageGeometry('a4', 'landscape')).toMatchObject({
      widthMm: 297,
      heightMm: 210,
    })
    expect(getPageGeometry('a5', 'portrait')).toMatchObject({
      widthMm: 148,
      heightMm: 210,
    })
    expect(getPageGeometry('a5-duplex', 'landscape')).toMatchObject({
      widthMm: 210,
      heightMm: 148,
    })
    expect(
      getPageGeometry('story', 'portrait').heightMm /
        getPageGeometry('story', 'portrait').widthMm,
    ).toBeCloseTo(16 / 9)
    expect(getPageGeometry('long-note', 'portrait').adaptive).toBe(true)
    expect(isDuplexFormat('a4-duplex')).toBe(true)
    expect(isDuplexFormat('a4')).toBe(false)
  })

  it('keeps a standard pizza recipe on one A4 page and paginates long content without dropping text', () => {
    const recipe = createDemoRecipe()
    const presentation = { ...DEFAULT_PRESENTATION, formatId: 'a4' as const }
    expect(createRecipePagePlan(recipe, presentation)).toHaveLength(1)

    const longRecipe = {
      ...recipe,
      steps: Array.from({ length: 30 }, (_, index) => ({
        ...recipe.steps[index % recipe.steps.length],
        id: `step-${index}`,
        instruction: `Строка ${index}. ${'подробное описание '.repeat(45)}`,
      })),
    }
    const plan = createRecipePagePlan(longRecipe, presentation)
    const fragments = plan.flatMap((page) => page.steps)
    expect(plan.length).toBeGreaterThan(1)
    expect(new Set(fragments.map((fragment) => fragment.stepId)).size).toBe(30)
    for (const step of longRecipe.steps) {
      expect(
        fragments
          .filter((fragment) => fragment.stepId === step.id)
          .map((fragment) => fragment.text)
          .join(' '),
      ).toContain(`Строка ${step.id.replace('step-', '')}.`)
    }
  })
})
