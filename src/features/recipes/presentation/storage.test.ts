import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_PRESENTATION,
  isPresentation,
  loadPresentation,
  loadPresentationPresets,
  savePresentation,
  savePresentationPresets,
} from '@/features/recipes/presentation'

describe('recipe presentation settings', () => {
  beforeEach(() => localStorage.clear())

  it('keeps versioned appearance settings separate per recipe', () => {
    const saved = {
      ...DEFAULT_PRESENTATION,
      styleId: 'editorial' as const,
      formatId: 'a4' as const,
    }
    savePresentation('recipe-a', saved)
    expect(loadPresentation('recipe-a')).toEqual(saved)
    expect(loadPresentation('recipe-b')).toEqual(DEFAULT_PRESENTATION)
    expect(
      JSON.parse(localStorage.getItem('33-recipe-presentation:recipe-a')!),
    ).toMatchObject({ version: 1 })
  })

  it('falls back safely for malformed or unsupported settings', () => {
    localStorage.setItem(
      '33-recipe-presentation:recipe-a',
      JSON.stringify({ version: 3, presentation: {} }),
    )
    expect(loadPresentation('recipe-a')).toEqual(DEFAULT_PRESENTATION)
    expect(
      isPresentation({ ...DEFAULT_PRESENTATION, accentColor: 'red' }),
    ).toBe(false)
  })

  it('stores small user presets without recipe data and filters malformed entries', () => {
    const preset = {
      id: 'p1',
      name: 'На каждый день',
      presentation: { ...DEFAULT_PRESENTATION, styleId: 'chef-sheet' as const },
    }
    savePresentationPresets([preset])
    expect(loadPresentationPresets()).toEqual([preset])
    localStorage.setItem(
      '33-recipe-presentation-presets',
      JSON.stringify({ version: 1, presets: [{ id: 'broken' }] }),
    )
    expect(loadPresentationPresets()).toEqual([])
  })
})
