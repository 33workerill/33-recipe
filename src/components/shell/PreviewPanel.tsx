import { Expand, FileDown, ScanLine, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PreviewPanel() {
  return (
    <aside
      aria-label="Предпросмотр рецепта"
      className="flex min-h-full min-w-0 flex-col border-l border-border bg-muted/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-6 sm:px-8">
        <div>
          <p className="type-caption uppercase tracking-[0.15em] text-muted-foreground">
            Визуализация
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
            Предпросмотр
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Отображение рецепта появится позже
          </p>
        </div>
        <div
          className="flex gap-1"
          aria-label="Будущие настройки предпросмотра"
        >
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled
            aria-label="Размер страницы пока недоступен"
            title="Размер страницы пока недоступен"
          >
            <Expand aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled
            aria-label="Масштаб пока недоступен"
            title="Масштаб пока недоступен"
          >
            <ZoomIn aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-5 py-8 sm:px-8 xl:sticky xl:top-0">
        <div className="shell-preview-paper flex aspect-[0.72] w-full max-w-[390px] flex-col rounded-md border p-7 sm:p-9">
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.2em]">
            <span>33 RECIPE</span>
            <span>01 / 01</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full border border-current/20">
              <ScanLine aria-hidden="true" className="size-6 opacity-50" />
            </span>
            <p className="mt-6 max-w-[230px] text-lg font-semibold tracking-[-0.04em]">
              Здесь появится ваш рецепт
            </p>
            <p className="mt-2 max-w-[240px] text-xs leading-5 opacity-65">
              Оформление станет доступно после создания рецепта.
            </p>
          </div>
          <div className="border-t border-current/15 pt-4 text-[10px] tracking-[0.08em] opacity-55">
            ЛИЧНАЯ КОЛЛЕКЦИЯ РЕЦЕПТОВ
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background/70 px-5 py-5 sm:px-8">
        <Button type="button" variant="primary" disabled className="w-full">
          <FileDown aria-hidden="true" />
          Экспортировать
        </Button>
        <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
          Экспорт появится после редактора и оформления рецептов.
        </p>
      </div>
    </aside>
  )
}
