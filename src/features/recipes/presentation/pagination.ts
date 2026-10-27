export type MeasuredPage = {
  html: string
  side: 'single' | 'front' | 'back'
  sheet: number
  heightPx: number
}

type Unit = { id: string; node: HTMLElement; flow: string }
type Selection = Map<string, HTMLElement>

// Measure the actual printable area, including nested boxes and rendered text.
// scrollHeight alone misses overflowing descendants of shrinking flex/grid items.
export function pageGeometryViolations(page: HTMLElement): string[] {
  const content = page.querySelector<HTMLElement>('[data-recipe-page-content]')!
  const box = content.getBoundingClientRect()
  const style = getComputedStyle(content)
  const left =
    box.left +
    parseFloat(style.paddingLeft) +
    parseFloat(style.borderLeftWidth || '0')
  const right =
    box.right -
    parseFloat(style.paddingRight) -
    parseFloat(style.borderRightWidth || '0')
  const top =
    box.top +
    parseFloat(style.paddingTop) +
    parseFloat(style.borderTopWidth || '0')
  const bottom =
    box.bottom -
    // Long Note grows with its line boxes. Its explicit bottom safety padding
    // also contains glyph ink extending below a tight heading's line box.
    (page.classList.contains('recipe-format-long-note')
      ? 0
      : parseFloat(style.paddingBottom)) -
    parseFloat(style.borderBottomWidth || '0')
  const errors: string[] = []
  const check = (rect: DOMRect, label: string) => {
    if (
      rect.width &&
      rect.height &&
      (rect.left < left - 0.5 ||
        rect.right > right + 0.5 ||
        rect.top < top - 0.5 ||
        rect.bottom > bottom + 0.5)
    )
      errors.push(
        `${label}[${Math.round(rect.left - left)},${Math.round(rect.right - right)},${Math.round(rect.top - top)},${Math.round(rect.bottom - bottom)}]`,
      )
  }
  for (const element of content.querySelectorAll<HTMLElement>('*')) {
    check(element.getBoundingClientRect(), element.tagName)
  }
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue
    const range = document.createRange()
    range.selectNodeContents(walker.currentNode)
    for (const rect of range.getClientRects()) check(rect, 'text')
  }
  return errors
}

function splitUnit(
  node: HTMLElement,
  offset: number,
): [HTMLElement, HTMLElement] {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  let position = offset
  let text: Node | null = null
  while (walker.nextNode()) {
    text = walker.currentNode
    if (position <= (text.textContent?.length ?? 0)) break
    position -= text.textContent?.length ?? 0
  }
  if (!text) throw new Error('Невозможно разделить пустой блок')
  const before = document.createRange()
  before.selectNodeContents(node)
  before.setEnd(text, position)
  const after = document.createRange()
  after.selectNodeContents(node)
  after.setStart(text, position)
  const first = node.cloneNode(false) as HTMLElement
  const rest = node.cloneNode(false) as HTMLElement
  first.append(before.cloneContents())
  rest.append(after.cloneContents())
  return [first, rest]
}

/** One bounded, synchronous pass after fonts and images are ready. No density
 * guesses, font shrinking, ResizeObserver feedback or screen-dependent sizes. */
export function paginateRecipeElement(
  source: HTMLElement,
  host: HTMLElement,
  options: {
    duplex: boolean
    fits?: (page: HTMLElement) => boolean
  },
): MeasuredPage[] {
  const template = source.cloneNode(true) as HTMLElement
  const units: Unit[] = [
    ...template.querySelectorAll<HTMLElement>('[data-layout-unit]'),
  ].map((node, index) => {
    const id = String(index)
    node.dataset.layoutId = id
    return { id, node, flow: node.dataset.layoutUnit ?? 'extras' }
  })
  const pages: MeasuredPage[] = []
  const fits =
    options.fits ?? ((page) => pageGeometryViolations(page).length === 0)
  let selection: Selection = new Map()
  let face = 0
  const render = (items: Selection, pageFace = face) => {
    const page = template.cloneNode(true) as HTMLElement
    const content = page.querySelector<HTMLElement>(
      '[data-recipe-page-content]',
    )!
    for (const unit of page.querySelectorAll<HTMLElement>(
      '[data-layout-unit]',
    )) {
      const replacement = items.get(unit.dataset.layoutId!)
      if (replacement) unit.replaceWith(replacement.cloneNode(true))
      else unit.remove()
    }
    for (const container of [
      ...content.querySelectorAll<HTMLElement>('[data-layout-container]'),
    ].reverse()) {
      if (!container.querySelector('[data-layout-unit]')) container.remove()
    }
    page.classList.toggle(
      'recipe-side-front',
      options.duplex && pageFace % 2 === 0,
    )
    page.classList.toggle(
      'recipe-side-back',
      options.duplex && pageFace % 2 === 1,
    )
    if (pageFace > 0 && !content.querySelector('.recipe-intro')) {
      const title = document.createElement('p')
      title.className = 'recipe-continuation-title'
      title.textContent = source.dataset.recipeTitle ?? ''
      content.prepend(title)
    }
    host.replaceChildren(page)
    return page
  }
  const accepts = (items: Selection, pageFace = face) =>
    fits(render(items, pageFace))
  const finish = () => {
    const page = render(selection)
    if (!fits(page))
      throw new Error('Не удалось разместить содержимое в печатной области')
    pages.push({
      heightPx: page.getBoundingClientRect().height,
      html: page.querySelector('[data-recipe-page-content]')!.innerHTML,
      side: options.duplex ? (face % 2 === 0 ? 'front' : 'back') : 'single',
      sheet: options.duplex ? Math.floor(face / 2) : face,
    })
    selection = new Map()
    face++
  }
  const add = (queue: Unit[]): boolean => {
    let progressed = false
    while (queue.length) {
      const unit = queue[0]
      const candidate = new Map(selection).set(unit.id, unit.node)
      if (accepts(candidate)) {
        selection = candidate
        queue.shift()
        progressed = true
        continue
      }
      // Keep a complete step/block together when it fits the following page.
      if (selection.size && accepts(new Map([[unit.id, unit.node]]), face + 1))
        break
      const text = unit.node.textContent ?? ''
      if (!text.trim()) {
        if (selection.size) break
        throw new Error('Изображение или блок больше печатной области')
      }
      const boundaries = [...text.matchAll(/\s+/g)]
        .map((match) => match.index! + match[0].length)
        .filter((index) => index < text.length)
      const offsets = boundaries.length
        ? boundaries
        : Array.from({ length: text.length - 1 }, (_, index) => index + 1)
      let low = 0
      let high = offsets.length - 1
      let best: [HTMLElement, HTMLElement] | null = null
      while (low <= high) {
        const middle = Math.floor((low + high) / 2)
        const parts = splitUnit(unit.node, offsets[middle])
        if (accepts(new Map(selection).set(unit.id, parts[0]))) {
          best = parts
          low = middle + 1
        } else high = middle - 1
      }
      // An exceptionally long first token can exceed a page before the first
      // whitespace. In that case use the same measured search at character edges.
      if (!best && boundaries.length) {
        low = 1
        high = offsets[0] - 1
        while (low <= high) {
          const middle = Math.floor((low + high) / 2)
          const parts = splitUnit(unit.node, middle)
          if (accepts(new Map(selection).set(unit.id, parts[0]))) {
            best = parts
            low = middle + 1
          } else high = middle - 1
        }
      }
      if (!best) {
        if (selection.size) break
        throw new Error('Текстовый блок не помещается в печатную область')
      }
      selection.set(unit.id, best[0])
      queue[0] = { ...unit, node: best[1] }
      progressed = true
      break
    }
    return progressed
  }
  const intro = units.filter((unit) => unit.flow === 'intro')
  const ingredients = units.filter((unit) => unit.flow === 'ingredients')
  const method = units.filter((unit) => unit.flow === 'method')
  const extras = units.filter((unit) => unit.flow === 'extras')
  while (intro.length) {
    add(intro)
    if (intro.length) finish()
  }
  if (options.duplex && selection.size) finish()
  while (ingredients.length || method.length || extras.length) {
    const count = ingredients.length + method.length + extras.length
    const before = selection.size
    const progressed = add(ingredients)
    const methodProgressed = add(method)
    if (!ingredients.length && !method.length) add(extras)
    if (ingredients.length || method.length || extras.length) {
      if (
        !selection.size &&
        count === ingredients.length + method.length + extras.length &&
        before === 0 &&
        !progressed &&
        !methodProgressed
      )
        throw new Error('Пагинация не продвинулась')
      finish()
    }
  }
  if (selection.size || !pages.length) finish()
  if (options.duplex && pages.length % 2) finish()
  host.replaceChildren()
  return pages
}
