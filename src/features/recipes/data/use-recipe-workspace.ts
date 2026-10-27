import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyRecipe, type Recipe } from '@/features/recipes/model'
import { createBackup, parseBackup } from '@/features/recipes/data/backup'
import { duplicateRecipe } from '@/features/recipes/data/duplicate'
import {
  RecipeRepository,
  type StoredRecipe,
} from '@/features/recipes/data/repository'

const RECENT_KEY = '33-recipe-recent-ids'
export type SaveStatus = 'changes' | 'saving' | 'saved' | 'error'

function readRecent(): string[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(RECENT_KEY) ?? '[]',
    ) as unknown
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

function writeRecent(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids))
  } catch {
    /* Library remains available without recent metadata. */
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Не удалось сохранить данные. Попробуйте ещё раз.'
}

export function useRecipeWorkspace(repository?: RecipeRepository) {
  const [repo] = useState(() => repository ?? new RecipeRepository())
  const [recipes, setRecipes] = useState<StoredRecipe[]>([])
  const [current, setCurrent] = useState<StoredRecipe | null>(null)
  const [recentIds, setRecentIds] = useState(readRecent)
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const currentRef = useRef<StoredRecipe | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const editSeqRef = useRef(0)
  const savedSeqRef = useRef(0)
  const invalidInputsRef = useRef(new Set<string>())

  const replaceCurrent = useCallback((value: StoredRecipe | null) => {
    currentRef.current = value
    setCurrent(value)
  }, [])

  const refresh = useCallback(async () => {
    const list = await repo.list()
    setRecipes(list)
    setRecentIds((previous) => {
      const known = new Set(list.map(({ recipe }) => recipe.id))
      const filtered = previous.filter((id) => known.has(id))
      writeRecent(filtered)
      return filtered
    })
    return list
  }, [repo])

  useEffect(() => {
    void refresh()
      .catch((cause: unknown) => {
        setStatus('error')
        setError(describeError(cause))
      })
      .finally(() => setLoading(false))
  }, [refresh])

  const markRecent = useCallback((id: string) => {
    setRecentIds((previous) => {
      const next = [id, ...previous.filter((item) => item !== id)].slice(0, 20)
      writeRecent(next)
      return next
    })
  }, [])

  const flush = useCallback(
    async function saveLatest(): Promise<void> {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      if (invalidInputsRef.current.size) {
        const message =
          'Исправьте числовые поля перед сохранением или переходом.'
        setStatus('error')
        setError(message)
        throw new Error(message)
      }
      if (inFlightRef.current) {
        await inFlightRef.current
        if (savedSeqRef.current < editSeqRef.current) await saveLatest()
        return
      }
      if (!currentRef.current || savedSeqRef.current >= editSeqRef.current)
        return

      const task = (async () => {
        while (currentRef.current && savedSeqRef.current < editSeqRef.current) {
          if (invalidInputsRef.current.size)
            throw new Error('Исправьте числовые поля перед сохранением.')
          const snapshot = currentRef.current
          const sequence = editSeqRef.current
          setStatus('saving')
          try {
            const saved = await repo.save(snapshot.recipe, snapshot.revision)
            if (currentRef.current?.recipe.id === snapshot.recipe.id) {
              const latest = currentRef.current
              replaceCurrent(
                sequence === editSeqRef.current
                  ? saved
                  : {
                      recipe: {
                        ...latest.recipe,
                        updatedAt: saved.recipe.updatedAt,
                      },
                      revision: saved.revision,
                    },
              )
            }
            savedSeqRef.current = sequence
            await refresh()
            setStatus(
              invalidInputsRef.current.size
                ? 'error'
                : savedSeqRef.current < editSeqRef.current
                  ? 'changes'
                  : 'saved',
            )
            if (!invalidInputsRef.current.size) setError(null)
          } catch (cause) {
            setStatus('error')
            setError(describeError(cause))
            throw cause
          }
        }
      })()
      inFlightRef.current = task
      try {
        await task
      } finally {
        inFlightRef.current = null
      }
    },
    [repo, refresh, replaceCurrent],
  )

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (
        savedSeqRef.current < editSeqRef.current ||
        invalidInputsRef.current.size
      ) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden')
        void flush().catch(() => undefined)
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('visibilitychange', saveOnHide)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('visibilitychange', saveOnHide)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [flush])

  const edit = useCallback(
    (change: (recipe: Recipe) => void) => {
      const existing = currentRef.current
      if (!existing) return
      const recipe = structuredClone(existing.recipe)
      change(recipe)
      if (JSON.stringify(recipe) === JSON.stringify(existing.recipe)) return
      replaceCurrent({ recipe, revision: existing.revision })
      editSeqRef.current += 1
      setStatus('changes')
      setError(null)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(
        () => void flush().catch(() => undefined),
        700,
      )
    },
    [flush, replaceCurrent],
  )

  const prepareSwitch = useCallback(async () => {
    await flush()
    editSeqRef.current = 0
    savedSeqRef.current = 0
    if (currentRef.current) {
      setStatus('saved')
      setError(null)
    }
  }, [flush])

  const open = useCallback(
    async (id: string) => {
      await prepareSwitch()
      const found = await repo.get(id)
      if (!found) throw new Error('Рецепт не найден.')
      replaceCurrent(found)
      markRecent(id)
    },
    [repo, prepareSwitch, replaceCurrent, markRecent],
  )

  const create = useCallback(async () => {
    await prepareSwitch()
    const saved = await repo.save(createEmptyRecipe(), null)
    replaceCurrent(saved)
    markRecent(saved.recipe.id)
    await refresh()
  }, [repo, prepareSwitch, replaceCurrent, markRecent, refresh])

  const remove = useCallback(
    async (item: StoredRecipe) => {
      await flush()
      const expectedRevision =
        currentRef.current?.recipe.id === item.recipe.id
          ? currentRef.current.revision
          : item.revision
      await repo.delete(item.recipe.id, expectedRevision)
      if (currentRef.current?.recipe.id === item.recipe.id) {
        replaceCurrent(null)
        editSeqRef.current = 0
        savedSeqRef.current = 0
      }
      await refresh()
    },
    [repo, flush, replaceCurrent, refresh],
  )

  const duplicate = useCallback(
    async (id: string) => {
      await prepareSwitch()
      const source = await repo.get(id)
      if (!source) throw new Error('Рецепт не найден.')
      const saved = await repo.save(duplicateRecipe(source.recipe), null)
      replaceCurrent(saved)
      markRecent(saved.recipe.id)
      await refresh()
    },
    [repo, prepareSwitch, replaceCurrent, markRecent, refresh],
  )

  const exportBackup = useCallback(async () => {
    await flush()
    return createBackup((await repo.list()).map(({ recipe }) => recipe))
  }, [repo, flush])

  const importBackup = useCallback(
    async (text: string) => {
      await flush()
      await repo.importAll(parseBackup(text))
      await refresh()
    },
    [repo, flush, refresh],
  )

  const reportError = useCallback((cause: unknown) => {
    setError(describeError(cause))
    setStatus('error')
  }, [])

  const setInputValidity = useCallback(
    (id: string, invalid: boolean) => {
      if (invalid) invalidInputsRef.current.add(id)
      else invalidInputsRef.current.delete(id)
      if (invalidInputsRef.current.size) {
        setStatus('error')
        setError('Исправьте числовые поля перед сохранением или переходом.')
      } else {
        setStatus(
          savedSeqRef.current < editSeqRef.current ? 'changes' : 'saved',
        )
        setError(null)
        if (savedSeqRef.current < editSeqRef.current) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(
            () => void flush().catch(() => undefined),
            700,
          )
        }
      }
    },
    [flush],
  )

  return {
    recipes,
    current,
    recentIds,
    status,
    error,
    loading,
    edit,
    flush,
    prepareSwitch,
    open,
    create,
    remove,
    duplicate,
    exportBackup,
    importBackup,
    reportError,
    setInputValidity,
  }
}
