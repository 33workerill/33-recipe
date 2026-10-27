import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeRenderer } from '@/features/recipes/presentation/RecipeRenderer'
import {
  createRecipePagePlan,
  getPageGeometry,
  isDuplexFormat,
  type RecipePresentation,
} from '@/features/recipes/presentation'
import type { Recipe } from '@/features/recipes/model'

type ZoomMode = 'fit' | 'width' | 'manual' | '100'
type DuplexView = 'front' | 'back' | 'both'
const pxPerMm = 96 / 25.4

export function PreviewPanel({
  recipe,
  imageUrls,
  presentation,
}: {
  recipe: Recipe | null
  imageUrls: Record<string, string>
  presentation: RecipePresentation
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit')
  const [manualZoom, setManualZoom] = useState(100)
  const [duplexView, setDuplexView] = useState<DuplexView>('front')
  const [pageIndex, setPageIndex] = useState(0)
  const [packing, setPacking] = useState({ key: '', density: 1 })
  const [overflowState, setOverflowState] = useState({
    key: '',
    pages: [] as number[],
  })
  const duplex = isDuplexFormat(presentation.formatId)
  const planKey = `${recipe?.id ?? 'empty'}:${recipe?.updatedAt ?? ''}:${presentation.formatId}:${presentation.orientation}:${presentation.styleId}:${presentation.typographyScale}`
  const density = packing.key === planKey ? packing.density : 1
  const plan = useMemo(
    () => (recipe ? createRecipePagePlan(recipe, presentation, density) : []),
    [recipe, presentation, density],
  )
  const pages = Math.max(1, plan.length)
  const geometry = getPageGeometry(
    presentation.formatId,
    presentation.orientation,
  )
  const pageWidth = geometry.widthMm * pxPerMm
  const pageHeight = geometry.adaptive ? 900 : geometry.heightMm * pxPerMm
  const isWideScreen = typeof window === 'undefined' || window.innerWidth >= 640
  const activePageIndex = Math.min(pageIndex, pages - 1)
  const visibleSides: Array<'front' | 'back'> =
    duplex && duplexView === 'both' && isWideScreen
      ? ['front', 'back']
      : [duplexView === 'back' ? 'back' : 'front']

  useEffect(() => {
    const node = viewportRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const fitScale = Math.min(
    Math.max(
      0.15,
      (viewport.width - 32) /
        (pageWidth * (visibleSides.length === 2 ? 2.08 : 1)),
    ),
    geometry.adaptive
      ? 0.8
      : Math.max(0.15, (viewport.height - 32) / pageHeight),
    1,
  )
  const scale =
    zoomMode === '100'
      ? 1
      : zoomMode === 'manual'
        ? manualZoom / 100
        : zoomMode === 'width'
          ? Math.min(
              1,
              (viewport.width - 24) / (pageWidth * visibleSides.length),
            )
          : fitScale

  useEffect(() => {
    const articles = viewportRef.current?.querySelectorAll<HTMLElement>(
      '[data-recipe-page-content]',
    )
    if (!articles || typeof ResizeObserver === 'undefined') return
    const findOverflow = () => {
      const indexes = [...articles].flatMap((content, index) =>
        content.scrollHeight > content.clientHeight + 2 ? [index + 1] : [],
      )
      setOverflowState((current) =>
        current.key === planKey && current.pages.join(',') === indexes.join(',')
          ? current
          : { key: planKey, pages: indexes },
      )
      if (indexes.length && density > 0.65 && !geometry.adaptive) {
        setPacking((current) =>
          current.key === planKey && current.density <= density - 0.01
            ? current
            : {
                key: planKey,
                density: Math.max(0.65, Number((density - 0.08).toFixed(2))),
              },
        )
      }
    }
    const observer = new ResizeObserver(findOverflow)
    articles.forEach((article) => observer.observe(article))
    findOverflow()
    return () => observer.disconnect()
  }, [
    recipe,
    presentation,
    pageIndex,
    duplexView,
    viewport.width,
    density,
    planKey,
    geometry.adaptive,
  ])

  const overflowPages = overflowState.key === planKey ? overflowState.pages : []

  return (
    <aside
      aria-label="Предпросмотр рецепта"
      className="flex min-h-0 min-w-0 flex-col bg-muted/40"
    >
      <header className="border-b border-border px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="type-caption uppercase tracking-[0.15em] text-muted-foreground">
              Предпросмотр листа
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {recipe?.title || 'Лист рецепта'}
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Экспорт появится в Phase 08"
          >
            <FileDown aria-hidden="true" />
            Экспорт
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex min-w-0 max-w-full flex-wrap items-center gap-1"
            role="group"
            aria-label="Масштаб страницы"
          >
            <Button
              size="sm"
              variant={zoomMode === 'fit' ? 'secondary' : 'ghost'}
              onClick={() => setZoomMode('fit')}
            >
              Вместить
            </Button>
            <Button
              size="sm"
              variant={zoomMode === 'width' ? 'secondary' : 'ghost'}
              onClick={() => setZoomMode('width')}
            >
              По ширине
            </Button>
            <Button
              size="sm"
              variant={zoomMode === '100' ? 'secondary' : 'ghost'}
              onClick={() => setZoomMode('100')}
            >
              100%
            </Button>
            <label className="sr-only" htmlFor="preview-manual-zoom">
              Ручной масштаб
            </label>
            <input
              id="preview-manual-zoom"
              aria-label="Ручной масштаб"
              type="range"
              min="25"
              max="140"
              step="5"
              value={
                zoomMode === 'manual' ? manualZoom : Math.round(scale * 100)
              }
              onChange={(event) => {
                setManualZoom(Number(event.target.value))
                setZoomMode('manual')
              }}
              className="ml-2 w-20 accent-primary"
            />
            <span className="min-w-10 text-xs tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
          </div>
          {duplex && (
            <div
              role="group"
              aria-label="Сторона двустороннего листа"
              className="flex rounded-lg border border-border bg-background p-1"
            >
              {(
                [
                  ['front', 'Лицевая'],
                  ['back', 'Оборотная'],
                  ['both', 'Обе'],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={duplexView === value ? 'secondary' : 'ghost'}
                  aria-pressed={duplexView === value}
                  onClick={() => setDuplexView(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {pages > 1 && (
          <nav
            aria-label="Страницы рецепта"
            className="mt-3 flex items-center justify-center gap-3"
          >
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Предыдущий лист"
              disabled={activePageIndex === 0}
              onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span className="text-sm tabular-nums">
              Лист {activePageIndex + 1} из {pages}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Следующий лист"
              disabled={activePageIndex >= pages - 1}
              onClick={() =>
                setPageIndex((value) => Math.min(pages - 1, value + 1))
              }
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        )}
        {overflowPages.length > 0 && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            Проверьте переполнение листа {overflowPages.join(', ')}: увеличьте
            размер листа или уменьшите размер текста. Текст не скрыт.
          </p>
        )}
        {pages > 1 && (
          <p
            role="status"
            className="mt-1 text-center text-xs text-muted-foreground"
          >
            Содержимое разбито на {pages} листа без удаления текста.
          </p>
        )}
      </header>
      <div
        ref={viewportRef}
        className="recipe-preview-viewport min-h-0 flex-1 overflow-auto p-4 sm:p-6"
      >
        <div
          className={`recipe-preview-pages ${duplex && visibleSides.length === 2 ? 'recipe-preview-duplex' : ''}`}
        >
          {visibleSides.map((side) => (
            <div
              className="recipe-preview-frame"
              key={`${side}-${activePageIndex}`}
              style={
                {
                  width: `${pageWidth * scale}px`,
                  height: `${pageHeight * scale}px`,
                  '--preview-scale': scale,
                } as CSSProperties
              }
            >
              <RecipeRenderer
                recipe={recipe}
                imageUrls={imageUrls}
                presentation={presentation}
                pageIndex={activePageIndex}
                side={duplex ? side : 'single'}
                plan={plan[activePageIndex]}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
