import {
  cookingStepSchema,
  CURRENT_RECIPE_SCHEMA_VERSION,
  ingredientGroupSchema,
  ingredientSchema,
  recipeSchema,
} from '@/features/recipes/model/schemas'
import type {
  CookingStep,
  Ingredient,
  IngredientGroup,
  Recipe,
} from '@/features/recipes/model/types'

type IdentityOptions = {
  id?: string
  createId?: () => string
}

function nextId(options: IdentityOptions): string {
  return options.id === undefined
    ? (options.createId ?? (() => globalThis.crypto.randomUUID()))()
    : options.id
}

export function createEmptyRecipe(
  options: IdentityOptions & { now?: () => Date } = {},
): Recipe {
  const timestamp = (options.now ?? (() => new Date()))().toISOString()
  return recipeSchema.parse({
    id: nextId(options),
    schemaVersion: CURRENT_RECIPE_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    title: '',
    description: '',
    category: '',
    tags: [],
    ingredientGroups: [],
    steps: [],
    assets: [],
    notes: '',
    tips: '',
  })
}

export function createIngredient(
  options: IdentityOptions &
    Partial<Pick<Ingredient, 'name' | 'amount' | 'unit' | 'note'>> = {},
): Ingredient {
  return ingredientSchema.parse({
    id: nextId(options),
    name: options.name === undefined ? '' : options.name,
    unit:
      options.unit === undefined
        ? { kind: 'standard', code: 'pcs' }
        : options.unit,
    ...(options.amount !== undefined && { amount: options.amount }),
    ...(options.note !== undefined && { note: options.note }),
  })
}

export function createIngredientGroup(
  options: IdentityOptions &
    Partial<Pick<IngredientGroup, 'title' | 'ingredients'>> = {},
): IngredientGroup {
  return ingredientGroupSchema.parse({
    id: nextId(options),
    ingredients: options.ingredients === undefined ? [] : options.ingredients,
    ...(options.title !== undefined && { title: options.title }),
  })
}

export function createCookingStep(
  options: IdentityOptions &
    Partial<
      Pick<
        CookingStep,
        | 'title'
        | 'instruction'
        | 'durationMinutes'
        | 'temperatureCelsius'
        | 'note'
        | 'assetIds'
      >
    > = {},
): CookingStep {
  return cookingStepSchema.parse({
    id: nextId(options),
    instruction: options.instruction === undefined ? '' : options.instruction,
    ...(options.title !== undefined && { title: options.title }),
    ...(options.durationMinutes !== undefined && {
      durationMinutes: options.durationMinutes,
    }),
    ...(options.temperatureCelsius !== undefined && {
      temperatureCelsius: options.temperatureCelsius,
    }),
    ...(options.note !== undefined && { note: options.note }),
    ...(options.assetIds !== undefined && { assetIds: options.assetIds }),
  })
}
