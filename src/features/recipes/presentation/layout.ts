import type { Recipe } from '@/features/recipes/model'
import type { Orientation, RecipePresentation } from './types'

export type PageGeometry = {
  widthMm: number
  heightMm: number
  adaptive: boolean
}
export type IngredientSlice = {
  groupId: string
  ingredientIds: string[]
  continued: boolean
}
export type StepFragment = {
  stepId: string
  text: string
  part: number
  parts: number
}
export type RecipePagePlan = {
  number: number
  descriptionFragment?: { text: string; part: number; parts: number }
  ingredientSlices: IngredientSlice[]
  steps: StepFragment[]
  extras: Array<{ kind: 'tips' | 'notes'; text: string }>
}

export function getPageGeometry(
  formatId: RecipePresentation['formatId'],
  orientation: Orientation,
): PageGeometry {
  const page: PageGeometry = (() => {
    switch (formatId) {
      case 'a4':
      case 'a4-duplex':
        return { widthMm: 210, heightMm: 297, adaptive: false }
      case 'a5':
      case 'a5-duplex':
        return { widthMm: 148, heightMm: 210, adaptive: false }
      case 'story':
        return { widthMm: 90, heightMm: 160, adaptive: false }
      case 'note':
        return { widthMm: 120, heightMm: 150, adaptive: false }
      case 'square':
        return { widthMm: 120, heightMm: 120, adaptive: false }
      case 'mini-card':
        return { widthMm: 90, heightMm: 120, adaptive: false }
      case 'book-spread':
        return { widthMm: 420, heightMm: 297, adaptive: false }
      case 'long-note':
        return { widthMm: 148, heightMm: 0, adaptive: true }
    }
  })()

  if (
    orientation === 'landscape' &&
    !page.adaptive &&
    !['story', 'note', 'square', 'mini-card', 'book-spread'].includes(formatId)
  ) {
    return { ...page, widthMm: page.heightMm, heightMm: page.widthMm }
  }
  return page
}

const charsPerLine = (widthMm: number) =>
  Math.max(14, Math.floor(widthMm * 0.42))
const lineHeightMm = 3

function textHeight(text: string, widthMm: number): number {
  return (
    Math.max(1, Math.ceil(text.length / charsPerLine(widthMm))) * lineHeightMm
  )
}

function splitText(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const chunks: string[] = []
  let chunk = ''
  for (const word of words) {
    let rest = word
    while (rest.length > maxChars) {
      if (chunk) {
        chunks.push(chunk)
        chunk = ''
      }
      chunks.push(rest.slice(0, maxChars))
      rest = rest.slice(maxChars)
    }
    if (chunk && `${chunk} ${rest}`.length > maxChars) {
      chunks.push(chunk)
      chunk = rest
    } else {
      chunk = chunk ? `${chunk} ${rest}` : rest
    }
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

function distribute<T>(
  items: T[],
  heightOf: (item: T) => number,
  capacity: number,
): T[][] {
  const pages: T[][] = [[]]
  let used = 0
  for (const item of items) {
    const height = heightOf(item)
    if (pages.at(-1)!.length && used + height > capacity) {
      pages.push([])
      used = 0
    }
    pages.at(-1)!.push(item)
    used += height
  }
  return pages
}

export function createRecipePagePlan(
  recipe: Recipe,
  presentation: RecipePresentation,
  packingDensity = 1,
): RecipePagePlan[] {
  const geometry = getPageGeometry(
    presentation.formatId,
    presentation.orientation,
  )
  const innerWidth = Math.max(60, geometry.widthMm - 24)
  const pageCapacity = geometry.adaptive
    ? 100_000
    : Math.max(60, Math.floor((geometry.heightMm - 28) * packingDensity))
  const headerReserve = Math.min(
    72,
    32 +
      textHeight(recipe.title, innerWidth) +
      textHeight(recipe.description, innerWidth),
  )
  const firstPageCapacity = Math.max(48, pageCapacity - headerReserve)
  const descriptionParts = splitText(
    recipe.description,
    Math.max(120, Math.floor((charsPerLine(innerWidth) * 58) / lineHeightMm)),
  )
  const ingredientItems = recipe.ingredientGroups.flatMap((group) => {
    const named = group.ingredients.filter((ingredient) =>
      ingredient.name.trim(),
    )
    if (!named.length) return []
    const slices: IngredientSlice[] = []
    let current: string[] = []
    let used = group.title ? 10 : 0
    for (const ingredient of named) {
      const rowHeight =
        5 +
        textHeight(
          `${ingredient.name} ${ingredient.note ?? ''}`,
          innerWidth * 0.48,
        )
      if (current.length && used + rowHeight > pageCapacity) {
        slices.push({
          groupId: group.id,
          ingredientIds: current,
          continued: slices.length > 0,
        })
        current = []
        used = 10
      }
      current.push(ingredient.id)
      used += rowHeight
    }
    if (current.length)
      slices.push({
        groupId: group.id,
        ingredientIds: current,
        continued: slices.length > 0,
      })
    return slices
  })
  const ingredientPages = distribute(
    ingredientItems,
    (slice) => {
      const group = recipe.ingredientGroups.find(
        (item) => item.id === slice.groupId,
      )!
      return (
        (group.title ? 10 : 0) +
        slice.ingredientIds.reduce((sum, id) => {
          const item = group.ingredients.find(
            (ingredient) => ingredient.id === id,
          )!
          return (
            sum +
            5 +
            textHeight(`${item.name} ${item.note ?? ''}`, innerWidth * 0.48)
          )
        }, 0)
      )
    },
    firstPageCapacity,
  )

  const stepFragments = recipe.steps.flatMap((step) => {
    if (!step.instruction.trim() && !step.title?.trim()) return []
    const maxTextHeight = Math.max(18, pageCapacity - 18)
    const chunks = splitText(
      step.instruction,
      Math.max(
        30,
        Math.floor((innerWidth * 0.48 * maxTextHeight) / (lineHeightMm * 1.45)),
      ),
    )
    return chunks.map((text, index) => ({
      stepId: step.id,
      text,
      part: index + 1,
      parts: chunks.length,
    }))
  })
  const stepPages = distribute(
    stepFragments,
    (fragment) => 10 + textHeight(fragment.text, innerWidth * 0.48),
    firstPageCapacity,
  )
  const extras: RecipePagePlan['extras'] = [
    ...(presentation.showTips && recipe.tips.trim()
      ? [{ kind: 'tips' as const, text: recipe.tips }]
      : []),
    ...(presentation.showNotes && recipe.notes.trim()
      ? [{ kind: 'notes' as const, text: recipe.notes }]
      : []),
  ].flatMap((item) =>
    splitText(
      item.text,
      Math.max(
        100,
        Math.floor(
          (charsPerLine(innerWidth) * Math.max(8, pageCapacity - 24)) /
            lineHeightMm,
        ),
      ),
    ).map((text) => ({ ...item, text })),
  )
  const extraPages = distribute(
    extras,
    (item) => 12 + textHeight(item.text, innerWidth),
    firstPageCapacity,
  )
  const count = Math.max(
    1,
    ingredientPages.length,
    stepPages.length,
    extraPages.length,
    descriptionParts.length,
  )
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    descriptionFragment:
      descriptionParts[index] === undefined
        ? undefined
        : {
            text: descriptionParts[index],
            part: index + 1,
            parts: descriptionParts.length,
          },
    ingredientSlices: ingredientPages[index] ?? [],
    steps: stepPages[index] ?? [],
    extras: extraPages[index] ?? [],
  }))
}

export function isDuplexFormat(
  formatId: RecipePresentation['formatId'],
): boolean {
  return formatId === 'a4-duplex' || formatId === 'a5-duplex'
}
