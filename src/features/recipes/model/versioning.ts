import { RecipeModelError } from '@/features/recipes/model/errors'
import { CURRENT_RECIPE_SCHEMA_VERSION } from '@/features/recipes/model/schemas'

export function assertSupportedRecipeVersion(value: unknown): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return
  }

  const version = Reflect.get(value, 'schemaVersion') as unknown
  if (typeof version !== 'number' || !Number.isInteger(version)) return
  if (version === CURRENT_RECIPE_SCHEMA_VERSION) return

  const message =
    version > CURRENT_RECIPE_SCHEMA_VERSION
      ? `Версия рецепта ${version} новее поддерживаемой версии ${CURRENT_RECIPE_SCHEMA_VERSION}.`
      : `Версия рецепта ${version} не поддерживается. Миграция пока отсутствует.`
  throw new RecipeModelError('unsupported_version', message, [
    {
      path: ['schemaVersion'],
      code: 'unsupported_version',
      message,
    },
  ])
}
