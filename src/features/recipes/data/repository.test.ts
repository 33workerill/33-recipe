import { IDBFactory } from 'fake-indexeddb'
import { Blob as NodeBlob } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { serializeRecipe } from '@/features/recipes/model'
import {
  processImageFile,
  validateImageFile,
} from '@/features/recipes/data/image-file'
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

function testBlob(content: string): Blob {
  return new NodeBlob([content], { type: 'image/jpeg' }) as unknown as Blob
}

describe('IndexedDB recipe repository', () => {
  it('upgrades v1 without losing recipes and stores image Blobs independently', async () => {
    const factory = new IDBFactory()
    const name = `migration-${crypto.randomUUID()}`
    const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, 1)
      request.onupgradeneeded = () =>
        request.result.createObjectStore('recipes', { keyPath: 'id' })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = legacy.transaction('recipes', 'readwrite')
      tx.objectStore('recipes').add({
        id: pizzaRecipe.id,
        revision: 1,
        json: serializeRecipe(pizzaRecipe),
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    legacy.close()
    const repo = new RecipeRepository(factory, name)
    const migrated = await repo.get(pizzaRecipe.id)
    expect(migrated?.recipe.title).toBe(pizzaRecipe.title)
    expect(await repo.list()).toHaveLength(1)
    const asset = pizzaRecipe.assets[0]
    const blob = testBlob('image bytes')
    await repo.saveImage(pizzaRecipe, 1, {
      id: asset.id,
      recipeId: pizzaRecipe.id,
      blob,
      fingerprint: 'sha256:test-photo',
    })
    const restored = await repo.getImage(asset.id)
    expect(restored).toMatchObject({ id: asset.id, recipeId: pizzaRecipe.id })
    expect(restored?.blob).toBeInstanceOf(NodeBlob)
    expect(restored?.blob.size).toBe(blob.size)
    const reopened = new RecipeRepository(factory, name)
    expect((await reopened.getImage(asset.id))?.blob.size).toBe(blob.size)
    expect(
      (
        await reopened.findImageByFingerprint(
          pizzaRecipe.id,
          'sha256:test-photo',
        )
      )?.id,
    ).toBe(asset.id)
    await reopened.delete(pizzaRecipe.id, 2)
    expect(await reopened.getImage(asset.id)).toBeNull()
  })

  it('atomically replaces a cover and duplicates image blobs with independent IDs', async () => {
    const repo = repository()
    const originalAsset = pizzaRecipe.assets[0]
    const firstBlob = testBlob('first')
    const first = await repo.save(pizzaRecipe, null)
    await repo.saveImage(first.recipe, first.revision, {
      id: originalAsset.id,
      recipeId: first.recipe.id,
      blob: firstBlob,
    })
    const replacement = {
      ...originalAsset,
      id: crypto.randomUUID(),
      filename: 'replacement.jpg',
    }
    const nextRecipe = {
      ...first.recipe,
      assets: [replacement],
      steps: first.recipe.steps.map((step) => ({
        ...step,
        ...(step.assetIds && {
          assetIds: step.assetIds.map((id) =>
            id === originalAsset.id ? replacement.id : id,
          ),
        }),
      })),
    }
    const replaced = await repo.saveImage(
      nextRecipe,
      2,
      {
        id: replacement.id,
        recipeId: first.recipe.id,
        blob: testBlob('second'),
      },
      [originalAsset.id],
    )
    expect(await repo.getImage(originalAsset.id)).toBeNull()
    const copiedImage = await repo.getImage(replacement.id)
    expect(copiedImage?.blob.size).toBe(6)
    const copiedRecipe = duplicateRecipe(replaced.recipe)
    const copied = await repo.duplicateWithImages(replaced.recipe, copiedRecipe)
    expect(copied.recipe.assets[0].id).not.toBe(replacement.id)
    const duplicateImage = await repo.getImage(copied.recipe.assets[0].id)
    expect(duplicateImage?.blob.size).toBe(6)
    expect(duplicateImage?.blob).not.toBe(copiedImage?.blob)
    expect(await repo.getImage(replacement.id)).not.toBeNull()
  })

  it('does not overwrite an image owned by another recipe when IDs collide', async () => {
    const repo = repository()
    const asset = pizzaRecipe.assets[0]
    const first = await repo.save(pizzaRecipe, null)
    await repo.saveImage(first.recipe, first.revision, {
      id: asset.id,
      recipeId: first.recipe.id,
      blob: testBlob('first recipe'),
    })
    const otherRecipe = {
      ...emptyRecipe,
      id: crypto.randomUUID(),
      assets: [asset],
    }
    const second = await repo.save(otherRecipe, null)
    await expect(
      repo.saveImage(second.recipe, second.revision, {
        id: asset.id,
        recipeId: second.recipe.id,
        blob: testBlob('other recipe'),
      }),
    ).rejects.toThrow('ID фотографии уже используется другим рецептом.')
    expect((await repo.getImage(asset.id))?.recipeId).toBe(first.recipe.id)
  })

  it('removes step metadata and its image Blob in one transaction', async () => {
    const repo = repository()
    const first = await repo.save(pizzaRecipe, null)
    const asset = first.recipe.assets[0]
    await repo.saveImage(first.recipe, first.revision, {
      id: asset.id,
      recipeId: first.recipe.id,
      blob: testBlob('step photo'),
    })
    const recipe = {
      ...first.recipe,
      assets: [],
      steps: first.recipe.steps.map((step) =>
        step.assetIds ? { ...step, assetIds: [] } : step,
      ),
    }
    await repo.deleteImages(recipe, 2, [asset.id])
    expect((await repo.get(first.recipe.id))?.recipe.assets).toEqual([])
    expect(await repo.getImage(asset.id)).toBeNull()
  })

  it('rejects unsupported and oversized image files before storage', async () => {
    const heic = new File(['x'], 'photo.heic', { type: 'image/heic' })
    expect(() => validateImageFile(heic)).not.toThrow()
    await expect(processImageFile(heic)).rejects.toThrow(
      'не умеет декодировать HEIC/HEIF',
    )
    expect(() =>
      validateImageFile(new File(['x'], 'text.txt', { type: 'text/plain' })),
    ).toThrow('JPEG, PNG или WebP')
    expect(() =>
      validateImageFile(
        new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.jpg', {
          type: 'image/jpeg',
        }),
      ),
    ).toThrow('20 МБ')
  })

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
