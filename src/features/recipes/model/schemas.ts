import { z } from 'zod'

export const CURRENT_RECIPE_SCHEMA_VERSION = 1 as const

const idSchema = z.uuid({ error: 'Нужен корректный UUID.' })
const utcDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/,
    'Дата должна быть в формате ISO 8601 UTC.',
  )
  .refine(
    (value) => {
      const date = new Date(value)
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 19) === value.slice(0, 19)
      )
    },
    { error: 'Указана несуществующая дата.' },
  )
const nonNegativeNumber = z.number().finite().nonnegative()
const nonEmptyText = z.string().refine((value) => value.trim().length > 0, {
  error: 'Значение не должно быть пустым.',
})

export const ingredientUnitSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('standard'),
    code: z.enum([
      'g',
      'kg',
      'ml',
      'l',
      'pcs',
      'tsp',
      'tbsp',
      'pinch',
      'to_taste',
    ]),
  }),
  z.strictObject({
    kind: z.literal('custom'),
    label: nonEmptyText,
  }),
])

export const ingredientSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  amount: nonNegativeNumber.optional(),
  unit: ingredientUnitSchema,
  note: z.string().optional(),
})

export const ingredientGroupSchema = z.strictObject({
  id: idSchema,
  title: z.string().optional(),
  ingredients: z.array(ingredientSchema),
})

export const cookingStepSchema = z.strictObject({
  id: idSchema,
  title: z.string().optional(),
  instruction: z.string().refine((value) => !/<\/?[a-z][^>]*>/i.test(value), {
    error: 'Инструкция должна быть обычным текстом без HTML.',
  }),
  durationMinutes: nonNegativeNumber.optional(),
  temperatureCelsius: z.number().finite().optional(),
  note: z.string().optional(),
  assetIds: z.array(idSchema).optional(),
})

export const mediaAssetSchema = z.strictObject({
  id: idSchema,
  filename: nonEmptyText.max(255),
  mimeType: z
    .string()
    .regex(
      /^image\/(?:jpeg|png|webp|avif|gif|heic|heif)$/,
      'Поддерживаются только форматы изображений.',
    ),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  altText: z.string(),
  role: z.enum(['cover', 'step', 'gallery']),
})

export const nutritionSchema = z.strictObject({
  basis: z.enum(['per_serving', 'per_100g', 'per_recipe']),
  calories: nonNegativeNumber.optional(),
  protein: nonNegativeNumber.optional(),
  fat: nonNegativeNumber.optional(),
  carbohydrates: nonNegativeNumber.optional(),
})

export const recipeSchema = z
  .strictObject({
    id: idSchema,
    schemaVersion: z.literal(CURRENT_RECIPE_SCHEMA_VERSION),
    createdAt: utcDateSchema,
    updatedAt: utcDateSchema,
    title: z.string(),
    description: z.string(),
    category: z.string(),
    tags: z.array(nonEmptyText),
    servings: z.number().finite().positive().optional(),
    preparationTimeMinutes: nonNegativeNumber.optional(),
    cookingTimeMinutes: nonNegativeNumber.optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    ingredientGroups: z.array(ingredientGroupSchema),
    steps: z.array(cookingStepSchema),
    assets: z.array(mediaAssetSchema),
    notes: z.string(),
    tips: z.string(),
    nutrition: nutritionSchema.optional(),
  })
  .superRefine((recipe, context) => {
    const rejectUndefined = (value: unknown, path: (string | number)[]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => rejectUndefined(item, [...path, index]))
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, item]) => {
          const childPath = [...path, key]
          if (item === undefined) {
            context.addIssue({
              code: 'custom',
              path: childPath,
              message: 'Необязательное поле нужно опустить вместо undefined.',
            })
          } else {
            rejectUndefined(item, childPath)
          }
        })
      }
    }
    rejectUndefined(recipe, [])

    if (new Date(recipe.updatedAt) < new Date(recipe.createdAt)) {
      context.addIssue({
        code: 'custom',
        path: ['updatedAt'],
        message: 'Дата изменения не может быть раньше даты создания.',
      })
    }

    const seenIds = new Set<string>()
    const checkId = (id: string, path: (string | number)[]) => {
      if (seenIds.has(id)) {
        context.addIssue({
          code: 'custom',
          path,
          message: 'Этот ID уже используется в рецепте.',
        })
      }
      seenIds.add(id)
    }

    checkId(recipe.id, ['id'])
    recipe.ingredientGroups.forEach((group, groupIndex) => {
      checkId(group.id, ['ingredientGroups', groupIndex, 'id'])
      group.ingredients.forEach((ingredient, ingredientIndex) =>
        checkId(ingredient.id, [
          'ingredientGroups',
          groupIndex,
          'ingredients',
          ingredientIndex,
          'id',
        ]),
      )
    })
    recipe.steps.forEach((step, stepIndex) =>
      checkId(step.id, ['steps', stepIndex, 'id']),
    )
    recipe.assets.forEach((asset, assetIndex) =>
      checkId(asset.id, ['assets', assetIndex, 'id']),
    )

    const assetIds = new Set(recipe.assets.map((asset) => asset.id))
    recipe.steps.forEach((step, stepIndex) => {
      const linkedIds = new Set<string>()
      step.assetIds?.forEach((assetId, assetIndex) => {
        const path = ['steps', stepIndex, 'assetIds', assetIndex]
        if (!assetIds.has(assetId)) {
          context.addIssue({
            code: 'custom',
            path,
            message: 'Изображение с этим ID отсутствует в рецепте.',
          })
        }
        if (linkedIds.has(assetId)) {
          context.addIssue({
            code: 'custom',
            path,
            message: 'Ссылка на изображение в шаге повторяется.',
          })
        }
        linkedIds.add(assetId)
      })
    })
  })
