import {
  deserializeRecipe,
  serializeRecipe,
  type Recipe,
} from '@/features/recipes/model'

export function createBackup(
  recipes: Recipe[],
  now: Date = new Date(),
): string {
  return JSON.stringify(
    {
      format: '33-recipe-backup',
      version: 1,
      exportedAt: now.toISOString(),
      recipes: recipes.map(
        (recipe) => JSON.parse(serializeRecipe(recipe)) as unknown,
      ),
    },
    null,
    2,
  )
}

export function parseBackup(text: string): Recipe[] {
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch {
    throw new Error('Файл не содержит корректный JSON.')
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Неверная структура резервной копии.')
  const backup = value as Record<string, unknown>
  if (
    backup.format !== '33-recipe-backup' ||
    backup.version !== 1 ||
    !Array.isArray(backup.recipes) ||
    typeof backup.exportedAt !== 'string' ||
    Number.isNaN(Date.parse(backup.exportedAt)) ||
    Object.keys(backup).some(
      (key) => !['format', 'version', 'exportedAt', 'recipes'].includes(key),
    )
  ) {
    throw new Error('Неподдерживаемый формат или версия резервной копии.')
  }
  return backup.recipes.map((recipe, index) => {
    try {
      return deserializeRecipe(JSON.stringify(recipe))
    } catch (error) {
      throw new Error(
        `Рецепт ${index + 1}: ${error instanceof Error ? error.message : 'некорректные данные'}`,
        { cause: error },
      )
    }
  })
}
