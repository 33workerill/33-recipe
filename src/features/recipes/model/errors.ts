import type { ValidationIssue } from '@/features/recipes/model/validation'

export type RecipeModelErrorCode =
  'invalid_json' | 'invalid_recipe' | 'unsupported_version'

export class RecipeModelError extends Error {
  readonly code: RecipeModelErrorCode
  readonly issues: ValidationIssue[]

  constructor(
    code: RecipeModelErrorCode,
    message: string,
    issues: ValidationIssue[] = [],
  ) {
    super(message)
    this.name = 'RecipeModelError'
    this.code = code
    this.issues = issues
  }
}
