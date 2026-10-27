import { useEffect, useRef, useState } from 'react'
import type { Recipe } from '@/features/recipes/model'
import { isDuplexFormat } from './layout'
import { paginateRecipeElement, type MeasuredPage } from './pagination'
import type { RecipePresentation } from './types'

export function usePagination(
  recipe: Recipe | null,
  presentation: RecipePresentation,
  imageUrls: Record<string, string>,
) {
  const sourceRef = useRef<HTMLDivElement>(null)
  const measurementRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<{
    key: string
    pages: MeasuredPage[]
    error: string
  }>({ key: '', pages: [], error: '' })
  const key = JSON.stringify([recipe, presentation, imageUrls])
  useEffect(() => {
    let cancelled = false
    const source =
      sourceRef.current?.querySelector<HTMLElement>('.recipe-paper')
    const host = measurementRef.current
    if (!source || !host || !recipe) return
    const measure = async () => {
      await document.fonts?.ready
      await Promise.all(
        [...source.querySelectorAll('img')].map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true })
                image.addEventListener('error', () => resolve(), { once: true })
              }),
        ),
      )
      if (cancelled) return
      try {
        const pages = paginateRecipeElement(source, host, {
          duplex: isDuplexFormat(presentation.formatId),
        })
        if (!cancelled) setResult({ key, pages, error: '' })
      } catch (error) {
        if (!cancelled)
          setResult({
            key,
            pages: [],
            error:
              error instanceof Error
                ? error.message
                : 'Не удалось измерить страницы',
          })
      }
    }
    // jsdom has no layout engine. Geometry is covered by the browser regression.
    if (source.getBoundingClientRect().width) void measure()
    return () => {
      cancelled = true
    }
  }, [key, recipe, presentation, imageUrls])
  return {
    sourceRef,
    measurementRef,
    pages: result.key === key ? result.pages : [],
    error: result.key === key ? result.error : '',
    ready: result.key === key,
  }
}
