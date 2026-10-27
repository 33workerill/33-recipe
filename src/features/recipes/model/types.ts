import type { z } from 'zod'
import type {
  cookingStepSchema,
  ingredientGroupSchema,
  ingredientSchema,
  ingredientUnitSchema,
  mediaAssetSchema,
  nutritionSchema,
  recipeSchema,
} from '@/features/recipes/model/schemas'

export type IngredientUnit = z.infer<typeof ingredientUnitSchema>
export type Ingredient = z.infer<typeof ingredientSchema>
export type IngredientGroup = z.infer<typeof ingredientGroupSchema>
export type CookingStep = z.infer<typeof cookingStepSchema>
export type MediaAsset = z.infer<typeof mediaAssetSchema>
export type Nutrition = z.infer<typeof nutritionSchema>
export type Recipe = z.infer<typeof recipeSchema>
