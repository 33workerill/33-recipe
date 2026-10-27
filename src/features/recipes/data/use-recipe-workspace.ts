import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyRecipe, type Recipe } from '@/features/recipes/model'
import {
  createDemoRecipe,
  DEMO_RECIPE_ID,
} from '@/features/recipes/data/development-recipe'
import { createBackup, parseBackup } from '@/features/recipes/data/backup'
import { duplicateRecipe } from '@/features/recipes/data/duplicate'
import { processImageFile } from '@/features/recipes/data/image-file'
import {
  RecipeRepository,
  type StoredImage,
  type StoredRecipe,
} from '@/features/recipes/data/repository'
import type { MediaAsset } from '@/features/recipes/model'

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
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const imageIds = current
    ? `${current.recipe.id}:${current.recipe.assets.map((asset) => asset.id).join('|')}`
    : ''
  const currentRef = useRef<StoredRecipe | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const editSeqRef = useRef(0)
  const savedSeqRef = useRef(0)
  const invalidInputsRef = useRef(new Set<string>())
  const seenImageSelectionsRef = useRef(new Map<string, string | null>())
  const demoCreationRef = useRef<Promise<void> | null>(null)

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

  useEffect(() => {
    let cancelled = false
    const urls: Record<string, string> = {}
    const ids = imageIds
      ? imageIds.split(':').slice(1).join(':').split('|').filter(Boolean)
      : []
    void Promise.all(
      ids.map(async (id) => [id, await repo.getImage(id)] as const),
    )
      .then((images) => {
        if (cancelled) return
        for (const [id, image] of images)
          if (image) urls[id] = URL.createObjectURL(image.blob)
        setImageUrls(urls)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(describeError(cause))
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imageIds, repo])

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

  const addDemoRecipe = useCallback(() => {
    if (!import.meta.env.DEV) return Promise.resolve()
    if (demoCreationRef.current) return demoCreationRef.current
    const operation = (async () => {
      await prepareSwitch()
      if (!(await repo.get(DEMO_RECIPE_ID))) {
        try {
          await repo.save(createDemoRecipe(), null)
        } catch (error) {
          // A second development tab may have added the stable demo ID first.
          if (!(await repo.get(DEMO_RECIPE_ID))) throw error
        }
      }
      await open(DEMO_RECIPE_ID)
      await refresh()
    })()
    demoCreationRef.current = operation
    const clearOperation = () => {
      if (demoCreationRef.current === operation) demoCreationRef.current = null
    }
    void operation.then(clearOperation, clearOperation)
    return operation
  }, [open, prepareSwitch, refresh, repo])

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
      const saved = await repo.duplicateWithImages(
        source.recipe,
        duplicateRecipe(source.recipe),
      )
      replaceCurrent(saved)
      markRecent(saved.recipe.id)
      await refresh()
    },
    [repo, prepareSwitch, replaceCurrent, markRecent, refresh],
  )

  const saveImage = useCallback(
    async (
      file: File,
      role: MediaAsset['role'],
      stepId?: string,
      replaceId?: string,
    ) => {
      await flush()
      const existing = currentRef.current
      if (!existing) throw new Error('Сначала создайте или откройте рецепт.')
      const selectionKey = `${existing.recipe.id}|${file.name}|${file.size}|${file.lastModified}`
      if (seenImageSelectionsRef.current.has(selectionKey)) return
      seenImageSelectionsRef.current.set(selectionKey, null)
      let processed: Awaited<ReturnType<typeof processImageFile>>
      try {
        processed = await processImageFile(file)
      } catch (cause) {
        seenImageSelectionsRef.current.delete(selectionKey)
        throw cause
      }
      const latest = currentRef.current
      if (!latest || latest.recipe.id !== existing.recipe.id) {
        seenImageSelectionsRef.current.delete(selectionKey)
        throw new Error(
          'Рецепт изменился во время обработки фотографии. Повторите загрузку.',
        )
      }
      let repeated: StoredImage | null
      try {
        repeated = await repo.findImageByFingerprint(
          latest.recipe.id,
          processed.fingerprint,
        )
      } catch (cause) {
        seenImageSelectionsRef.current.delete(selectionKey)
        throw cause
      }
      const repeatedAsset = repeated
        ? latest.recipe.assets.find((asset) => asset.id === repeated.id)
        : undefined
      if (repeated && repeatedAsset?.role === role) {
        seenImageSelectionsRef.current.set(selectionKey, repeated.id)
        if (role === 'step' && stepId) {
          const recipe = structuredClone(latest.recipe)
          const step = recipe.steps.find((item) => item.id === stepId)
          if (!step) {
            seenImageSelectionsRef.current.delete(selectionKey)
            throw new Error('Шаг приготовления не найден.')
          }
          if (!step.assetIds?.includes(repeated.id)) {
            step.assetIds = [...(step.assetIds ?? []), repeated.id]
            try {
              const saved = await repo.save(recipe, latest.revision)
              replaceCurrent(saved)
              await refresh()
              setStatus('saved')
              setError(null)
            } catch (cause) {
              seenImageSelectionsRef.current.delete(selectionKey)
              setStatus('error')
              setError(describeError(cause))
              throw cause
            }
          }
        }
        return
      }
      const asset: MediaAsset = {
        id: crypto.randomUUID(),
        filename: processed.filename,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        altText: '',
        role,
      }
      const recipe = structuredClone(latest.recipe)
      if (role === 'cover' && replaceId) {
        recipe.assets = recipe.assets.filter((item) => item.id !== replaceId)
        recipe.steps.forEach((step) => {
          if (step.assetIds)
            step.assetIds = step.assetIds.filter((id) => id !== replaceId)
        })
      }
      recipe.assets.push(asset)
      if (stepId) {
        const step = recipe.steps.find((item) => item.id === stepId)
        if (!step) {
          seenImageSelectionsRef.current.delete(selectionKey)
          throw new Error('Шаг приготовления не найден.')
        }
        step.assetIds = [...(step.assetIds ?? []), asset.id]
      }
      setStatus('saving')
      try {
        const image: StoredImage = {
          id: asset.id,
          recipeId: recipe.id,
          blob: processed.blob,
          fingerprint: processed.fingerprint,
        }
        const saved = await repo.saveImage(
          recipe,
          latest.revision,
          image,
          replaceId ? [replaceId] : [],
        )
        editSeqRef.current = 0
        savedSeqRef.current = 0
        seenImageSelectionsRef.current.set(selectionKey, asset.id)
        replaceCurrent(saved)
        await refresh()
        setStatus('saved')
        setError(null)
      } catch (cause) {
        seenImageSelectionsRef.current.delete(selectionKey)
        setStatus('error')
        setError(describeError(cause))
        throw cause
      }
    },
    [flush, repo, refresh, replaceCurrent],
  )

  const removeImage = useCallback(
    async (id: string) => {
      await flush()
      const existing = currentRef.current
      if (!existing) return
      const recipe = structuredClone(existing.recipe)
      recipe.assets = recipe.assets.filter((asset) => asset.id !== id)
      recipe.steps.forEach((step) => {
        if (step.assetIds)
          step.assetIds = step.assetIds.filter((assetId) => assetId !== id)
      })
      const saved = await repo.deleteImage(recipe, existing.revision, id)
      for (const [key, value] of seenImageSelectionsRef.current) {
        if (value === id) seenImageSelectionsRef.current.delete(key)
      }
      editSeqRef.current = 0
      savedSeqRef.current = 0
      replaceCurrent(saved)
      await refresh()
      setStatus('saved')
      setError(null)
    },
    [flush, repo, refresh, replaceCurrent],
  )

  const removeStep = useCallback(
    async (stepId: string) => {
      await flush()
      const existing = currentRef.current
      if (!existing) return
      const recipe = structuredClone(existing.recipe)
      const index = recipe.steps.findIndex((step) => step.id === stepId)
      if (index < 0) return
      const stepImageIds = recipe.steps[index].assetIds ?? []
      recipe.steps.splice(index, 1)
      const referencedIds = new Set(
        recipe.steps.flatMap((step) => step.assetIds ?? []),
      )
      const imageIds = stepImageIds.filter((id) => !referencedIds.has(id))
      recipe.assets = recipe.assets.filter(
        (asset) => !imageIds.includes(asset.id),
      )
      try {
        const saved = await repo.deleteImages(
          recipe,
          existing.revision,
          imageIds,
        )
        editSeqRef.current = 0
        savedSeqRef.current = 0
        replaceCurrent(saved)
        await refresh()
        setStatus('saved')
        setError(null)
      } catch (cause) {
        setStatus('error')
        setError(describeError(cause))
        throw cause
      }
    },
    [flush, repo, refresh, replaceCurrent],
  )

  const updateImageAlt = useCallback(
    (id: string, altText: string) =>
      edit((recipe) => {
        const asset = recipe.assets.find((item) => item.id === id)
        if (asset) asset.altText = altText
      }),
    [edit],
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
    imageUrls,
    recentIds,
    status,
    error,
    loading,
    edit,
    flush,
    prepareSwitch,
    open,
    create,
    addDemoRecipe,
    remove,
    duplicate,
    saveImage,
    removeImage,
    removeStep,
    updateImageAlt,
    exportBackup,
    importBackup,
    reportError,
    setInputValidity,
  }
}
