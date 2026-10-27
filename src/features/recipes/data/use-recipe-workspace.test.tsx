import { act, renderHook, waitFor } from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { RecipeRepository } from '@/features/recipes/data/repository'
import { useRecipeWorkspace } from '@/features/recipes/data/use-recipe-workspace'
import { createEmptyRecipe, type Recipe } from '@/features/recipes/model'

class FailingRepository extends RecipeRepository {
  failNext = false
  override async save(recipe: Recipe, revision: number | null) {
    if (this.failNext) {
      this.failNext = false
      throw new Error('Нет доступа к IndexedDB')
    }
    return super.save(recipe, revision)
  }
}

function makeRepository() {
  return new FailingRepository(
    new IDBFactory(),
    `workspace-${crypto.randomUUID()}`,
  )
}

describe('Recipe workspace save queue', () => {
  it('persists the latest rapid edit and flushes before switching recipes', async () => {
    const repo = makeRepository()
    const second = await repo.save(createEmptyRecipe(), null)
    const { result } = renderHook(() => useRecipeWorkspace(repo))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.create()
    })
    const firstId = result.current.current!.recipe.id
    act(() => {
      result.current.edit((recipe) => {
        recipe.title = 'Первая версия'
      })
      result.current.edit((recipe) => {
        recipe.title = 'Последняя версия'
      })
    })
    await act(async () => {
      await result.current.open(second.recipe.id)
    })
    expect((await repo.get(firstId))?.recipe.title).toBe('Последняя версия')
    expect(result.current.current?.recipe.id).toBe(second.recipe.id)
  })

  it('keeps unsaved input after a storage failure and saves it on retry', async () => {
    const repo = makeRepository()
    const { result } = renderHook(() => useRecipeWorkspace(repo))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.create()
    })
    const id = result.current.current!.recipe.id
    repo.failNext = true
    act(() => {
      result.current.edit((recipe) => {
        recipe.title = 'Не потерять'
      })
    })
    await act(async () => {
      await expect(result.current.flush()).rejects.toThrow('Нет доступа')
    })
    expect(result.current.status).toBe('error')
    expect(result.current.current?.recipe.title).toBe('Не потерять')
    expect((await repo.get(id))?.recipe.title).toBe('')
    await act(async () => {
      await result.current.flush()
    })
    expect(result.current.status).toBe('saved')
    expect((await repo.get(id))?.recipe.title).toBe('Не потерять')
  })
})
