import {
  DEFAULT_PRESENTATION,
  isPresentation,
  type RecipePresentation,
  type RecipePresentationPreset,
} from './types'

const STORAGE_VERSION = 1
const PRESET_KEY = '33-recipe-presentation-presets'
const recipeKey = (recipeId: string) => `33-recipe-presentation:${recipeId}`

type VersionedSettings = { version: 1; presentation: RecipePresentation }
type VersionedPresets = { version: 1; presets: RecipePresentationPreset[] }

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export function loadPresentation(recipeId: string): RecipePresentation {
  const stored = readJson(recipeKey(recipeId)) as
    Partial<VersionedSettings> | undefined
  return stored?.version === STORAGE_VERSION &&
    isPresentation(stored.presentation)
    ? stored.presentation
    : { ...DEFAULT_PRESENTATION }
}

export function savePresentation(
  recipeId: string,
  presentation: RecipePresentation,
): void {
  localStorage.setItem(
    recipeKey(recipeId),
    JSON.stringify({
      version: STORAGE_VERSION,
      presentation,
    } satisfies VersionedSettings),
  )
}

export function loadPresentationPresets(): RecipePresentationPreset[] {
  const stored = readJson(PRESET_KEY) as Partial<VersionedPresets> | undefined
  if (stored?.version !== STORAGE_VERSION || !Array.isArray(stored.presets))
    return []
  return stored.presets.filter(
    (preset): preset is RecipePresentationPreset =>
      !!preset &&
      typeof preset.id === 'string' &&
      typeof preset.name === 'string' &&
      isPresentation(preset.presentation),
  )
}

export function savePresentationPresets(
  presets: RecipePresentationPreset[],
): void {
  localStorage.setItem(
    PRESET_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      presets,
    } satisfies VersionedPresets),
  )
}
