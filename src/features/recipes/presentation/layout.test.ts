import { describe, expect, it } from 'vitest'
import { getPageGeometry, isDuplexFormat } from './layout'
import { paginateRecipeElement } from './pagination'

function fixture() {
  const source = document.createElement('article')
  source.innerHTML = `<div data-recipe-page-content><div data-layout-container><div data-layout-unit="intro" data-height="30">Photo and title</div></div><div data-layout-container class="columns"><section data-layout-container class="ingredients"><h2>Ingredients</h2><p data-layout-unit="ingredients" data-height="35">Flour water salt</p></section><section data-layout-container class="method"><h2>Method</h2><p data-layout-unit="method" data-height="40">Mix rest bake</p></section></div><section data-layout-unit="extras" data-height="15">Nutrition</section><section data-layout-unit="extras" data-height="25">Advice</section><section data-layout-unit="extras" data-height="20">Notes</section></div>`
  const host = document.createElement('div')
  document.body.append(host)
  const fits = (page: HTMLElement) => {
    const sum = (selector: string) =>
      [...page.querySelectorAll<HTMLElement>(selector)].reduce(
        (value, item) => value + Number(item.dataset.height),
        0,
      )
    return (
      sum('[data-layout-unit="intro"], [data-layout-unit="extras"]') +
        Math.max(
          sum('[data-layout-unit="ingredients"]'),
          sum('[data-layout-unit="method"]'),
        ) <=
      100
    )
  }
  return { source, host, fits }
}

describe('physical recipe pagination', () => {
  it('keeps every fixed format bounded; only Long Note is adaptive', () => {
    expect(getPageGeometry('a4', 'portrait')).toEqual({
      widthMm: 210,
      heightMm: 297,
      adaptive: false,
    })
    expect(getPageGeometry('a5', 'landscape')).toEqual({
      widthMm: 210,
      heightMm: 148,
      adaptive: false,
    })
    expect(getPageGeometry('a4-duplex', 'portrait')).toEqual(
      getPageGeometry('a4', 'portrait'),
    )
    expect(
      getPageGeometry('story', 'portrait').heightMm /
        getPageGeometry('story', 'portrait').widthMm,
    ).toBeCloseTo(16 / 9)
    expect(getPageGeometry('long-note', 'portrait').adaptive).toBe(true)
    expect(isDuplexFormat('a5-duplex')).toBe(true)
  })
  it('measures photo + simultaneous ingredient/method columns + nutrition + advice cumulatively', () => {
    const { source, host, fits } = fixture()
    const pages = paginateRecipeElement(source, host, {
      duplex: false,

      fits,
    })
    expect(pages).toHaveLength(2)
    expect(pages[0].html).toContain('Nutrition')
    expect(pages[0].html).not.toContain('Advice')
    expect(pages[1].html).toContain('Advice')
    for (const text of [
      'Photo and title',
      'Flour water salt',
      'Mix rest bake',
      'Nutrition',
      'Advice',
      'Notes',
    ])
      expect(pages.map((page) => page.html).join('')).toContain(text)
    expect(host.children).toHaveLength(0)
  })
  it('places the cover first, then continuous front/back pairs without dropping supplemental blocks', () => {
    const { source, host, fits } = fixture()
    const pages = paginateRecipeElement(source, host, {
      duplex: true,

      fits,
    })
    expect(pages.map((page) => page.side)).toEqual(['front', 'back'])
    expect(pages[0].html).not.toContain('Flour water salt')
    expect(pages[1].html).toContain('Advice')
  })
  it.each([
    'A detailed instruction with notes. '.repeat(30),
    'X'.repeat(300) + ' end',
  ])(
    'splits oversized text at measured boundaries and preserves every character in order',
    (text) => {
      const { source, host } = fixture()
      source.innerHTML = `<div data-recipe-page-content><p data-layout-unit="method">${text}</p></div>`
      const pages = paginateRecipeElement(source, host, {
        duplex: false,

        fits: (page) =>
          [...page.querySelectorAll('[data-layout-unit]')].reduce(
            (sum, node) => sum + (node.textContent?.length ?? 0),
            0,
          ) <= 120,
      })
      const output = pages
        .map((page) => {
          const node = document.createElement('div')
          node.innerHTML = page.html
          return node.querySelector('[data-layout-unit]')?.textContent ?? ''
        })
        .join('')
      expect(pages.length).toBeGreaterThan(2)
      expect(output).toBe(text)
    },
  )
})
