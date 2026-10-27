import { RecipeModelError } from '@/features/recipes/model/errors'
import type { Recipe } from '@/features/recipes/model/types'
import { validateDraftRecipe } from '@/features/recipes/model/validation'
import { assertSupportedRecipeVersion } from '@/features/recipes/model/versioning'

export function serializeRecipe(recipe: Recipe): string {
  const validated = validateDraftRecipe(recipe)
  if (!validated.success) {
    throw new RecipeModelError(
      'invalid_recipe',
      'Рецепт не прошёл проверку перед сохранением.',
      validated.issues,
    )
  }
  return JSON.stringify(validated.data)
}

export function deserializeRecipe(json: string): Recipe {
  let value: unknown
  try {
    value = JSON.parse(json) as unknown
  } catch {
    throw new RecipeModelError(
      'invalid_json',
      'Не удалось прочитать JSON рецепта.',
    )
  }

  assertSupportedRecipeVersion(value)
  const validated = validateDraftRecipe(value)
  if (!validated.success) {
    throw new RecipeModelError(
      'invalid_recipe',
      'Данные рецепта не соответствуют текущей схеме.',
      validated.issues,
    )
  }
  return validated.data
}
