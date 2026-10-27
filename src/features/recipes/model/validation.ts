import type { z } from 'zod'
import { recipeSchema } from '@/features/recipes/model/schemas'
import type { Recipe } from '@/features/recipes/model/types'

export type ValidationIssue = {
  path: (string | number)[]
  code: string
  message: string
}

export type ValidationResult =
  | { success: true; data: Recipe }
  | { success: false; issues: ValidationIssue[] }

function readableIssue(issue: z.ZodIssue): ValidationIssue {
  const message =
    issue.code === 'invalid_type' ? 'Некорректный тип значения.' : issue.message

  return {
    path: issue.path.map((segment) =>
      typeof segment === 'number' ? segment : String(segment),
    ),
    code: issue.code,
    message,
  }
}

export function validateDraftRecipe(value: unknown): ValidationResult {
  const result = recipeSchema.safeParse(value)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, issues: result.error.issues.map(readableIssue) }
}

export function validateCompleteRecipe(value: unknown): ValidationResult {
  const draft = validateDraftRecipe(value)
  if (!draft.success) return draft

  const recipe = draft.data
  const issues: ValidationIssue[] = []

  if (recipe.title.trim().length === 0) {
    issues.push({
      path: ['title'],
      code: 'missing_title',
      message: 'Укажите название рецепта.',
    })
  }
  if (
    !recipe.ingredientGroups.some((group) =>
      group.ingredients.some((ingredient) => ingredient.name.trim().length > 0),
    )
  ) {
    issues.push({
      path: ['ingredientGroups'],
      code: 'missing_ingredient',
      message: 'Добавьте хотя бы один ингредиент с названием.',
    })
  }
  if (!recipe.steps.some((step) => step.instruction.trim().length > 0)) {
    issues.push({
      path: ['steps'],
      code: 'missing_step',
      message: 'Добавьте хотя бы один содержательный шаг.',
    })
  }

  return issues.length > 0
    ? { success: false, issues }
    : { success: true, data: recipe }
}
