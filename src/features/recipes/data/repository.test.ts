import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup } from '@/features/recipes/data/backup'
import { duplicateRecipe } from '@/features/recipes/data/duplicate'
import {
  RecipeConflictError,
  RecipeRepository,
} from '@/features/recipes/data/repository'
import {
  emptyRecipe,
  omeletRecipe,
  pizzaRecipe,
} from '@/features/recipes/model/__fixtures__/recipes'

function repository() {
  let tick = 0
  return new RecipeRepository(
    new IDBFactory(),
    `recipes-${crypto.randomUUID()}`,
    () => new Date(Date.parse('2026-10-27T10:00:00.000Z') + tick++),
  )
}

describe('IndexedDB recipe repository', () => {
  it('creates, reads, updates and deletes without changing the timestamp on a read or no-op save', async () => {
    const repo = repository()
    const first = await repo.save(emptyRecipe, null)
    expect(first.revision).toBe(1)
    expect(await repo.get(first.recipe.id)).toEqual(first)
    expect(await repo.save(first.recipe, first.revision)).toEqual(first)
    const changed = await repo.save(
      { ...first.recipe, title: 'Новый рецепт' },
      first.revision,
    )
    expect(changed.revision).toBe(2)
    expect(changed.recipe.updatedAt > first.recipe.updatedAt).toBe(true)
    expect((await repo.list())[0]).toEqual(changed)
    await repo.delete(first.recipe.id, changed.revision)
    expect(await repo.get(first.recipe.id)).toBeNull()
    expect(await repo.list()).toEqual([])
  })

  it('sorts by update time and rejects stale writes, duplicates and stale deletes', async () => {
    const repo = repository()
    const first = await repo.save(pizzaRecipe, null)
    const second = await repo.save(omeletRecipe, null)
    expect((await repo.list()).map(({ recipe }) => recipe.id)).toEqual([
      second.recipe.id,
      first.recipe.id,
    ])
    const newer = await repo.save(
      { ...first.recipe, title: 'Пицца новая' },
      first.revision,
    )
    await expect(
      repo.save({ ...first.recipe, title: 'Старая правка' }, first.revision),
    ).rejects.toBeInstanceOf(RecipeConflictError)
    await expect(repo.save(pizzaRecipe, null)).rejects.toBeInstanceOf(
      RecipeConflictError,
    )
    await expect(
      repo.delete(first.recipe.id, first.revision),
    ).rejects.toBeInstanceOf(RecipeConflictError)
    expect((await repo.get(first.recipe.id))?.recipe.title).toBe(
      newer.recipe.title,
    )
  })

  it('duplicates every entity ID and remaps image links without changing content', () => {
    let next = 100
    const copy = duplicateRecipe(
      pizzaRecipe,
      () => `00000000-0000-4000-8000-${String(next++).padStart(12, '0')}`,
      () => new Date('2026-10-27T12:00:00.000Z'),
    )
    const ids = (recipe: typeof copy) => [
      recipe.id,
      ...recipe.ingredientGroups.flatMap((group) => [
        group.id,
        ...group.ingredients.map((ingredient) => ingredient.id),
      ]),
      ...recipe.steps.map((step) => step.id),
      ...recipe.assets.map((asset) => asset.id),
    ]
    expect(ids(copy).some((id) => ids(pizzaRecipe).includes(id))).toBe(false)
    expect(copy.steps[1].assetIds).toEqual([copy.assets[0].id])
    expect(copy.ingredientGroups[0].ingredients[0].amount).toBe(400)
    expect(copy.title).toContain('копия')
  })

  it('exports and imports a complete backup, rejecting corrupt data and ID conflicts atomically', async () => {
    const repo = repository()
    const backup = createBackup(
      [pizzaRecipe, omeletRecipe],
      new Date('2026-10-27T12:00:00Z'),
    )
    expect(backup).toContain('Итальянская пицца')
    expect(parseBackup(backup)).toEqual([pizzaRecipe, omeletRecipe])
    await repo.importAll(parseBackup(backup))
    expect((await repo.list()).length).toBe(2)
    await expect(
      repo.importAll([emptyRecipe, pizzaRecipe]),
    ).rejects.toBeInstanceOf(RecipeConflictError)
    expect((await repo.list()).length).toBe(2)
    expect(() => parseBackup('{')).toThrow()
    expect(() =>
      parseBackup(
        JSON.stringify({
          format: '33-recipe-backup',
          version: 1,
          recipes: [{ ...pizzaRecipe, schemaVersion: 2 }],
        }),
      ),
    ).toThrow()
  })
})
