import { describe, expect, it } from 'vitest'
import {
  createCookingStep,
  createEmptyRecipe,
  createIngredient,
  createIngredientGroup,
  deserializeRecipe,
  RecipeModelError,
  serializeRecipe,
  validateCompleteRecipe,
  validateDraftRecipe,
} from '@/features/recipes/model'
import {
  emptyRecipe,
  omeletRecipe,
  pizzaRecipe,
} from '@/features/recipes/model/__fixtures__/recipes'

function failurePaths(value: unknown, complete = false): string[] {
  const result = complete
    ? validateCompleteRecipe(value)
    : validateDraftRecipe(value)
  expect(result.success).toBe(false)
  return result.success
    ? []
    : result.issues.map((issue) => issue.path.join('.'))
}

describe('Recipe Model', () => {
  it('creates a valid empty draft with one UTC timestamp and an injectable ID', () => {
    const recipe = createEmptyRecipe({
      id: '00000000-0000-4000-8000-000000000099',
      now: () => new Date('2026-10-27T11:30:00.000Z'),
    })

    expect(recipe.schemaVersion).toBe(1)
    expect(recipe.id).toBe('00000000-0000-4000-8000-000000000099')
    expect(recipe.createdAt).toBe('2026-10-27T11:30:00.000Z')
    expect(recipe.updatedAt).toBe(recipe.createdAt)
    expect(recipe.ingredientGroups).toEqual([])
    expect(recipe.steps).toEqual([])
    expect(validateDraftRecipe(recipe).success).toBe(true)
  })

  it('generates distinct UUIDs for new entities without shared mutable counters', () => {
    const ids = [
      createEmptyRecipe().id,
      createIngredient().id,
      createIngredientGroup().id,
      createCookingStep().id,
    ]
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f-]{36}$/))
  })

  it('accepts incomplete drafts but requires title, ingredient and step for completion', () => {
    expect(validateDraftRecipe(emptyRecipe).success).toBe(true)
    const result = validateCompleteRecipe(emptyRecipe)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.map((issue) => issue.code)).toEqual([
        'missing_title',
        'missing_ingredient',
        'missing_step',
      ])
      expect(result.issues.every((issue) => issue.message.length > 0)).toBe(
        true,
      )
    }
    expect(validateCompleteRecipe(pizzaRecipe).success).toBe(true)
    expect(validateCompleteRecipe(omeletRecipe).success).toBe(true)
  })

  it('reports each missing complete-recipe requirement separately', () => {
    expect(failurePaths({ ...omeletRecipe, title: '   ' }, true)).toContain(
      'title',
    )
    expect(
      failurePaths({ ...omeletRecipe, ingredientGroups: [] }, true),
    ).toContain('ingredientGroups')
    expect(failurePaths({ ...omeletRecipe, steps: [] }, true)).toContain(
      'steps',
    )
  })

  it('rejects invalid amounts and keeps fractional amounts unchanged', () => {
    const ingredient = createIngredient({
      id: '00000000-0000-4000-8000-000000000090',
      name: 'Мука',
      amount: 2.25,
      unit: { kind: 'standard', code: 'kg' },
    })
    expect(ingredient.amount).toBe(2.25)
    expect(omeletRecipe.ingredientGroups[0].ingredients[1].amount).toBe(2.25)

    for (const amount of [-0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const invalid = structuredClone(omeletRecipe)
      invalid.ingredientGroups[0].ingredients[0].amount = amount
      expect(failurePaths(invalid)).toContain(
        'ingredientGroups.0.ingredients.0.amount',
      )
    }
  })

  it('supports custom and to-taste units without inventing an amount', () => {
    const custom = createIngredient({
      id: '00000000-0000-4000-8000-000000000091',
      name: 'Закваска',
      unit: { kind: 'custom', label: 'мерная чашка' },
      amount: 0.5,
    })
    const salt = createIngredient({
      id: '00000000-0000-4000-8000-000000000092',
      name: 'Соль',
      unit: { kind: 'standard', code: 'to_taste' },
    })
    expect(custom.amount).toBe(0.5)
    expect(salt).not.toHaveProperty('amount')
  })

  it('preserves group and step order while stable IDs survive reordering', () => {
    const reordered = structuredClone(pizzaRecipe)
    reordered.ingredientGroups.reverse()
    reordered.steps.reverse()

    expect(reordered.ingredientGroups.map((group) => group.title)).toEqual([
      'Начинка',
      'Тесто',
    ])
    expect(reordered.steps[0].id).toBe(pizzaRecipe.steps[2].id)
    expect(deserializeRecipe(serializeRecipe(reordered)).steps).toEqual(
      reordered.steps,
    )
  })

  it('rejects duplicate IDs and broken or repeated asset links', () => {
    const duplicate = structuredClone(pizzaRecipe)
    duplicate.steps[0].id = duplicate.ingredientGroups[0].id
    expect(failurePaths(duplicate)).toContain('steps.0.id')

    const missingAsset = structuredClone(pizzaRecipe)
    missingAsset.steps[1].assetIds = ['00000000-0000-4000-8000-000000000098']
    expect(failurePaths(missingAsset)).toContain('steps.1.assetIds.0')

    const repeatedAsset = structuredClone(pizzaRecipe)
    repeatedAsset.steps[1].assetIds = [
      pizzaRecipe.assets[0].id,
      pizzaRecipe.assets[0].id,
    ]
    expect(failurePaths(repeatedAsset)).toContain('steps.1.assetIds.1')
  })

  it('requires explicit nutrition basis and rejects invalid values', () => {
    const missingBasis = {
      ...pizzaRecipe,
      nutrition: { calories: 100 },
    }
    expect(failurePaths(missingBasis)).toContain('nutrition.basis')

    const negative = {
      ...pizzaRecipe,
      nutrition: { basis: 'per_100g', protein: -1 },
    }
    expect(failurePaths(negative)).toContain('nutrition.protein')
  })

  it('round-trips Unicode, special characters, optional fields and media metadata', () => {
    const original = structuredClone(pizzaRecipe)
    original.title = 'Пицца «Маргарита» & 🍅'
    original.steps[0].instruction = 'Строка 1\nСтрока 2 — ½ порции.'
    const before = structuredClone(original)

    const json = serializeRecipe(original)
    const restored = deserializeRecipe(json)
    expect(restored).toEqual(before)
    expect(original).toEqual(before)
    expect(serializeRecipe(restored)).toBe(json)
    expect(restored.assets[0].altText).toBe('Пицца перед выпеканием')
    expect(restored.nutrition?.basis).toBe('per_serving')
  })

  it('rejects malformed JSON, future and unknown past versions clearly', () => {
    expect(() => deserializeRecipe('{')).toThrow(RecipeModelError)
    try {
      deserializeRecipe('{')
    } catch (error) {
      expect(error).toMatchObject({ code: 'invalid_json' })
    }

    for (const version of [0, 2]) {
      const json = JSON.stringify({ ...emptyRecipe, schemaVersion: version })
      expect(() => deserializeRecipe(json)).toThrow(RecipeModelError)
      try {
        deserializeRecipe(json)
      } catch (error) {
        expect(error).toMatchObject({ code: 'unsupported_version' })
      }
    }
  })

  it('rejects unknown fields instead of silently discarding imported data', () => {
    const imported = {
      ...pizzaRecipe,
      layout: { page: 'A4' },
    }
    expect(failurePaths(imported)).toContain('')
    expect(() => deserializeRecipe(JSON.stringify(imported))).toThrow(
      RecipeModelError,
    )
  })

  it('rejects explicit undefined because JSON cannot preserve it', () => {
    expect(failurePaths({ ...emptyRecipe, servings: undefined })).toContain(
      'servings',
    )
  })

  it('rejects invalid dates and a change timestamp before creation', () => {
    expect(
      failurePaths({ ...emptyRecipe, createdAt: '2026-02-30T09:00:00Z' }),
    ).toContain('createdAt')
    expect(
      failurePaths({
        ...emptyRecipe,
        updatedAt: '2026-10-26T09:00:00.000Z',
      }),
    ).toContain('updatedAt')
  })

  it('keeps instructions as plain text and rejects embedded HTML', () => {
    const invalid = structuredClone(omeletRecipe)
    invalid.steps[0].instruction = '<script>alert(1)</script>'
    expect(failurePaths(invalid)).toContain('steps.0.instruction')
    expect(() => serializeRecipe(invalid)).toThrow(RecipeModelError)
  })
})
