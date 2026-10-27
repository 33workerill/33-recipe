import type { Orientation, RecipePresentation } from './types'

export type PageGeometry = {
  widthMm: number
  heightMm: number
  adaptive: boolean
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

export function isDuplexFormat(
  formatId: RecipePresentation['formatId'],
): boolean {
  return formatId === 'a4-duplex' || formatId === 'a5-duplex'
}
