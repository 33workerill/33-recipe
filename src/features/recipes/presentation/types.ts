export const RECIPE_STYLES = [
  'monochrome',
  'editorial',
  'restaurant',
  'vintage',
  'japanese',
  'chef-sheet',
] as const

export type RecipeStyleId = (typeof RECIPE_STYLES)[number]

export const RECIPE_FORMATS = [
  'a4',
  'a5',
  'a4-duplex',
  'a5-duplex',
  'story',
  'note',
  'long-note',
  'square',
  'mini-card',
  'book-spread',
] as const

export type RecipeFormatId = (typeof RECIPE_FORMATS)[number]
export type Orientation = 'portrait' | 'landscape'
export type ImageFit = 'cover' | 'contain'
export type FontPairId = 'editorial' | 'modern' | 'utility'

export type RecipePresentation = {
  styleId: RecipeStyleId
  formatId: RecipeFormatId
  orientation: Orientation
  accentColor: string
  typographyScale: number
  fontPair: FontPairId
  imageFit: ImageFit
  imageFirst: boolean
  showNutrition: boolean
  showNotes: boolean
  showTips: boolean
  showStepImages: boolean
}

export type RecipePresentationPreset = {
  id: string
  name: string
  presentation: RecipePresentation
}

export const DEFAULT_PRESENTATION: RecipePresentation = {
  styleId: 'monochrome',
  formatId: 'long-note',
  orientation: 'portrait',
  accentColor: '#9b3f2b',
  typographyScale: 1,
  fontPair: 'modern',
  imageFit: 'cover',
  imageFirst: true,
  showNutrition: true,
  showNotes: true,
  showTips: true,
  showStepImages: true,
}

export const STYLE_LABELS: Record<RecipeStyleId, string> = {
  monochrome: 'Monochrome',
  editorial: 'Editorial',
  restaurant: 'Restaurant',
  vintage: 'Vintage',
  japanese: 'Japanese',
  'chef-sheet': "Chef's Sheet",
}

export const FORMAT_LABELS: Record<RecipeFormatId, string> = {
  a4: 'A4 · 210 × 297 мм',
  a5: 'A5 · 148 × 210 мм',
  'a4-duplex': 'A4 Duplex · 2 стороны',
  'a5-duplex': 'A5 Duplex · 2 стороны',
  story: 'Story · 9:16',
  note: 'Note · 4:5',
  'long-note': 'Long Note · адаптивная высота',
  square: 'Square · 1:1',
  'mini-card': 'Mini Card · 3:4',
  'book-spread': 'Book Spread · 2 страницы',
}

export const isRecipeStyleId = (value: unknown): value is RecipeStyleId =>
  typeof value === 'string' && RECIPE_STYLES.includes(value as RecipeStyleId)

export const isRecipeFormatId = (value: unknown): value is RecipeFormatId =>
  typeof value === 'string' && RECIPE_FORMATS.includes(value as RecipeFormatId)

export function isPresentation(value: unknown): value is RecipePresentation {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<RecipePresentation>
  return (
    isRecipeStyleId(item.styleId) &&
    isRecipeFormatId(item.formatId) &&
    (item.orientation === 'portrait' || item.orientation === 'landscape') &&
    typeof item.accentColor === 'string' &&
    /^#[\da-f]{6}$/i.test(item.accentColor) &&
    typeof item.typographyScale === 'number' &&
    item.typographyScale >= 0.85 &&
    item.typographyScale <= 1.2 &&
    ['editorial', 'modern', 'utility'].includes(item.fontPair ?? '') &&
    (item.imageFit === 'cover' || item.imageFit === 'contain') &&
    typeof item.imageFirst === 'boolean' &&
    typeof item.showNutrition === 'boolean' &&
    typeof item.showNotes === 'boolean' &&
    typeof item.showTips === 'boolean' &&
    typeof item.showStepImages === 'boolean'
  )
}
