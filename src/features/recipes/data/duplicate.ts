import { createEmptyRecipe, type Recipe } from '@/features/recipes/model'

export function duplicateRecipe(
  source: Recipe,
  createId: () => string = () => crypto.randomUUID(),
  now: () => Date = () => new Date(),
): Recipe {
  const assetIds = new Map(source.assets.map((asset) => [asset.id, createId()]))
  const fresh = createEmptyRecipe({ createId, now })
  return {
    ...source,
    id: fresh.id,
    createdAt: fresh.createdAt,
    updatedAt: fresh.updatedAt,
    title: source.title ? `${source.title} (копия)` : 'Новый рецепт (копия)',
    ingredientGroups: source.ingredientGroups.map((group) => ({
      ...group,
      id: createId(),
      ingredients: group.ingredients.map((ingredient) => ({
        ...ingredient,
        id: createId(),
      })),
    })),
    steps: source.steps.map((step) => ({
      ...step,
      id: createId(),
      ...(step.assetIds && {
        assetIds: step.assetIds.map((id) => assetIds.get(id)!),
      }),
    })),
    assets: source.assets.map((asset) => ({
      ...asset,
      id: assetIds.get(asset.id)!,
    })),
  }
}
