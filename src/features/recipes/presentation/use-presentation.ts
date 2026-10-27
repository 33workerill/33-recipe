import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_PRESENTATION, type RecipePresentation } from './types'
import { loadPresentation, savePresentation } from './storage'

export function useRecipePresentation(recipeId?: string) {
  const [state, setState] = useState(() => ({
    recipeId,
    value: recipeId ? loadPresentation(recipeId) : { ...DEFAULT_PRESENTATION },
  }))
  const presentation =
    state.recipeId === recipeId
      ? state.value
      : recipeId
        ? loadPresentation(recipeId)
        : { ...DEFAULT_PRESENTATION }

  useEffect(() => {
    if (!recipeId || state.recipeId !== recipeId) return
    try {
      savePresentation(recipeId, state.value)
    } catch {
      /* Keep the current in-memory settings. */
    }
  }, [recipeId, state])

  const update = useCallback(
    (next: RecipePresentation) => {
      setState({ recipeId, value: { ...next } })
    },
    [recipeId],
  )

  return [presentation, update] as const
}
