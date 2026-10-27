import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { RecipeRenderer } from '@/features/recipes/presentation/RecipeRenderer'
import { createDemoRecipe } from '@/features/recipes/data/development-recipe'
import { pizzaRecipe } from '@/features/recipes/model/__fixtures__/recipes'
import {
  DEFAULT_PRESENTATION,
  RECIPE_STYLES,
  RECIPE_FORMATS,
  getPageGeometry,
  isDuplexFormat,
  type RecipePresentation,
} from '@/features/recipes/presentation'
import {
  paginateRecipeElement,
  pageGeometryViolations,
} from '@/features/recipes/presentation/pagination'
import { PreviewPanel } from '@/components/shell/PreviewPanel'
import '@/styles/index.css'

// Browser-only regression fixture. Never reads or writes the user's repository.
const recipe = createDemoRecipe()
const canvas = document.createElement('canvas')
canvas.width = 600
canvas.height = 400
const context = canvas.getContext('2d')!
context.fillStyle = '#e5d6bb'
context.fillRect(0, 0, 600, 400)
context.fillStyle = '#cb934d'
context.beginPath()
context.arc(300, 200, 170, 0, Math.PI * 2)
context.fill()
context.fillStyle = '#bb4735'
context.beginPath()
context.arc(300, 200, 150, 0, Math.PI * 2)
context.fill()
for (let i = 0; i < 8; i++) {
  context.fillStyle = i % 2 ? '#f6edcd' : '#466549'
  context.beginPath()
  context.arc(
    300 + Math.cos(i) * 100,
    200 + Math.sin(i) * 100,
    22,
    0,
    Math.PI * 2,
  )
  context.fill()
}
const image = canvas.toDataURL('image/png')
recipe.assets = [
  { ...pizzaRecipe.assets[0], id: 'cover', role: 'cover' },
  { ...pizzaRecipe.assets[0], id: 'step-image', role: 'step' },
]
recipe.steps[0].assetIds = ['step-image']
const imageUrls = { cover: image, 'step-image': image }
const longRecipe = {
  ...recipe,
  description: `${recipe.description}\n${'История домашнего рецепта. '.repeat(35)}`,
  steps: recipe.steps.map((step, i) => ({
    ...step,
    instruction: `${step.instruction}\n${`Длинный шаг ${i + 1}: аккуратно вымешивайте тесто и проверяйте его структуру. `.repeat(35)}`,
    note: `${step.note ?? ''} ${'Заметка к шагу. '.repeat(18)}`,
  })),
  notes: recipe.notes + ' Подробные заметки о приготовлении. '.repeat(100),
  tips: recipe.tips + ' Не торопитесь и проверяйте температуру. '.repeat(45),
}
const rootNode = document.getElementById('root')!
rootNode.innerHTML =
  '<label>Набор <select id="filter"><option value="all">Все форматы</option><option value="long-note">Long Note</option><option value="no-photo">A4 без фотографии</option><option value="long-token">A5 длинное слово</option></select></label><button id="run">Проверить все страницы</button><pre id="results">Готово к проверке</pre><div id="showcase"></div><div class="recipe-measurement"><div id="source"></div><div id="measure"></div></div>'
const sourceRoot = createRoot(document.getElementById('source')!)
const showRoot = createRoot(document.getElementById('showcase')!)
const host = document.getElementById('measure')!
const results = document.getElementById('results')!
const button = document.getElementById('run') as HTMLButtonElement
const delay = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
button.onclick = async () => {
  button.disabled = true
  const report: Array<Record<string, unknown>> = []
  const orientations = ['portrait', 'landscape'] as const
  for (const styleId of RECIPE_STYLES)
    for (const formatId of RECIPE_FORMATS)
      for (const orientation of orientations)
        for (const content of ['demo', 'long'] as const) {
          const subset = (
            document.getElementById('filter') as HTMLSelectElement
          ).value
          if (
            ['no-photo', 'long-token'].includes(subset) &&
            (styleId !== 'monochrome' ||
              formatId !== (subset === 'no-photo' ? 'a4' : 'a5') ||
              orientation !== 'portrait' ||
              content !== 'demo')
          )
            continue
          if (
            (document.getElementById('filter') as HTMLSelectElement).value ===
              'long-note' &&
            formatId !== 'long-note'
          )
            continue
          if (
            orientation === 'landscape' &&
            !['a4', 'a5', 'a4-duplex', 'a5-duplex'].includes(formatId)
          )
            continue
          const presentation: RecipePresentation = {
            ...DEFAULT_PRESENTATION,
            styleId,
            formatId,
            orientation,
            typographyScale: content === 'long' ? 1.2 : 1,
          }
          const current =
            subset === 'long-token'
              ? {
                  ...recipe,
                  steps: recipe.steps.map((step, i) =>
                    i
                      ? step
                      : {
                          ...step,
                          instruction:
                            'X'.repeat(2400) + ' ' + step.instruction,
                        },
                  ),
                }
              : content === 'demo'
                ? recipe
                : longRecipe
          const activeImages = subset === 'no-photo' ? {} : imageUrls
          try {
            flushSync(() =>
              sourceRoot.render(
                <RecipeRenderer
                  recipe={current}
                  presentation={presentation}
                  imageUrls={activeImages}
                />,
              ),
            )
            const source = document.querySelector<HTMLElement>(
              '#source .recipe-paper',
            )!
            await document.fonts.ready
            await Promise.all(
              [...source.querySelectorAll('img')].map((img) =>
                img.decode().catch(() => undefined),
              ),
            )
            const expected = [
              ...source.querySelectorAll('[data-layout-unit]'),
            ].map((node) => node.textContent ?? '')
            const pages = paginateRecipeElement(source, host, {
              duplex: isDuplexFormat(formatId),
            })
            const text = expected.map(() => '')
            let images = 0
            for (const page of pages) {
              const node = source.cloneNode(true) as HTMLElement
              node.classList.toggle('recipe-side-front', page.side === 'front')
              node.classList.toggle('recipe-side-back', page.side === 'back')
              node.querySelector('[data-recipe-page-content]')!.innerHTML =
                page.html
              host.replaceChildren(node)
              const physical = getPageGeometry(formatId, orientation)
              const bounds = node.getBoundingClientRect()
              if (
                Math.abs(bounds.width - (physical.widthMm * 96) / 25.4) > 1 ||
                (!physical.adaptive &&
                  Math.abs(bounds.height - (physical.heightMm * 96) / 25.4) > 1)
              )
                throw new Error('Physical page dimensions changed')
              const errors = pageGeometryViolations(node)
              if (errors.length)
                throw new Error(`Geometry: ${errors.join(',')}`)
              for (const unit of node.querySelectorAll<HTMLElement>(
                '[data-layout-unit]',
              ))
                text[Number(unit.dataset.layoutId)] += unit.textContent ?? ''
              images += node.querySelectorAll('img').length
            }
            if (expected.some((value, i) => value !== text[i]))
              throw new Error('Text changed, duplicated or missing')
            if (images !== source.querySelectorAll('img').length)
              throw new Error('Image missing or duplicated')
            report.push({
              styleId,
              formatId,
              orientation,
              content,
              pages: pages.length,
              pass: true,
            })
          } catch (error) {
            report.push({
              styleId,
              formatId,
              orientation,
              content,
              pass: false,
              error: String(error),
            })
          }
          results.textContent = JSON.stringify(
            {
              width: innerWidth,
              completed: report.length,
              failed: report.filter((item) => !item.pass).length,
              failures: report.filter((item) => !item.pass),
            },
            null,
            2,
          )
          await delay()
        }
  host.replaceChildren()
  results.dataset.complete = 'true'
  results.dataset.report = JSON.stringify(report)
  flushSync(() =>
    showRoot.render(
      <div style={{ height: '100vh', maxWidth: '100%' }}>
        <PreviewPanel
          recipe={recipe}
          imageUrls={
            (document.getElementById('filter') as HTMLSelectElement).value ===
            'no-photo'
              ? {}
              : imageUrls
          }
          presentation={{ ...DEFAULT_PRESENTATION, formatId: 'a4' }}
        />
      </div>,
    ),
  )
  button.disabled = false
}
