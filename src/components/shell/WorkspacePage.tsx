import { useRef, useState } from 'react'
import {
  BookOpenText,
  Clock3,
  Copy,
  Download,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react'
import type { WorkspaceSection } from '@/components/shell/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/theme/theme-toggle'
import type { StoredRecipe } from '@/features/recipes/data/repository'
import { validateCompleteRecipe } from '@/features/recipes/model'

type Props = {
  section: Exclude<WorkspaceSection, 'editor'>
  recipes: StoredRecipe[]
  recentIds: string[]
  loading: boolean
  onCreate: () => void
  onOpen: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (item: StoredRecipe) => void
  onExport: () => Promise<string>
  onImport: (text: string) => Promise<void>
}

function RecipeList({
  items,
  onOpen,
  onDuplicate,
  onDelete,
}: Pick<Props, 'onOpen' | 'onDuplicate' | 'onDelete'> & {
  items: StoredRecipe[]
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const recipe = item.recipe
        return (
          <article
            key={recipe.id}
            className="rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-base font-semibold">
                  {recipe.title || 'Без названия'}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    recipe.category,
                    new Intl.DateTimeFormat('ru-RU', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(recipe.updatedAt)),
                    validateCompleteRecipe(recipe).success
                      ? 'Готов к оформлению'
                      : 'Черновик',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpen(recipe.id)}
                >
                  Открыть
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Дублировать ${recipe.title || 'рецепт'}`}
                  onClick={() => onDuplicate(recipe.id)}
                >
                  <Copy />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Удалить ${recipe.title || 'рецепт'}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Удалить «${recipe.title || 'рецепт без названия'}»? Это действие нельзя отменить.`,
                      )
                    )
                      onDelete(item)
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function BackupControls({
  onExport,
  onImport,
}: Pick<Props, 'onExport' | 'onImport'>) {
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const exportFile = async () => {
    setBusy(true)
    try {
      const text = await onExport()
      const url = URL.createObjectURL(
        new Blob([text], { type: 'application/json;charset=utf-8' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `33-recipe-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('Резервная копия скачана.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Не удалось создать копию.',
      )
    } finally {
      setBusy(false)
    }
  }
  const importFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      if (
        !window.confirm(
          'Импортировать рецепты из этого файла? Существующие записи не будут перезаписаны.',
        )
      )
        return
      await onImport(text)
      setMessage('Рецепты импортированы.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Импорт не выполнен.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold">Резервная копия</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Рецепты находятся только в этом браузере и устройстве. Очистка данных
          сайта может их удалить. JSON-копия содержит текст рецептов и
          метаданные, но не сами фотографии. Храните исходные изображения
          отдельно.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void exportFile()}
        >
          <Download /> Скачать JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload /> Импортировать JSON
        </Button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Файл резервной копии"
          onChange={(event) => void importFile(event.target.files?.[0])}
        />
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}

export function WorkspacePage({
  section,
  recipes,
  recentIds,
  loading,
  onCreate,
  onOpen,
  onDuplicate,
  onDelete,
  onExport,
  onImport,
}: Props) {
  const [query, setQuery] = useState('')
  const content = {
    recipes: { eyebrow: 'КОЛЛЕКЦИЯ', title: 'Мои рецепты', Icon: BookOpenText },
    recent: { eyebrow: 'ИСТОРИЯ', title: 'Недавние', Icon: Clock3 },
    settings: { eyebrow: 'ПРЕДПОЧТЕНИЯ', title: 'Настройки', Icon: Settings2 },
  }[section]
  const recent = recentIds
    .map((id) => recipes.find((item) => item.recipe.id === id))
    .filter((item): item is StoredRecipe => !!item)
  const filtered = recipes.filter(({ recipe }) =>
    recipe.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  )
  const items = section === 'recent' ? recent : filtered
  return (
    <main className="flex flex-1 flex-col px-5 py-8 sm:px-9 sm:py-11">
      <div className="mx-auto w-full max-w-3xl">
        <p className="type-caption tracking-[0.15em] text-muted-foreground">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.055em]">
          {content.title}
        </h1>
        {section === 'settings' ? (
          <div className="mt-9 space-y-5">
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-base font-semibold">Тема интерфейса</h2>
              <div className="mt-4">
                <ThemeToggle />
              </div>
            </div>
            <BackupControls onExport={onExport} onImport={onImport} />
          </div>
        ) : (
          <>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              {section === 'recipes' ? (
                <div className="relative min-w-[190px] flex-1">
                  <Search
                    aria-hidden="true"
                    className="absolute top-3 left-3 size-4 text-muted-foreground"
                  />
                  <Input
                    aria-label="Поиск по названию"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Найти рецепт"
                    className="pl-9"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Последние открытые рецепты
                </p>
              )}
              <Button type="button" variant="primary" onClick={onCreate}>
                <Plus /> Новый рецепт
              </Button>
            </div>
            <div className="mt-5">
              {loading ? (
                <p role="status" className="text-sm text-muted-foreground">
                  Загрузка библиотеки…
                </p>
              ) : items.length ? (
                <RecipeList
                  items={items}
                  onOpen={onOpen}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
                  <content.Icon
                    aria-hidden="true"
                    className="size-7 text-muted-foreground"
                  />
                  <h2 className="mt-4 text-lg font-semibold">
                    {query && section === 'recipes'
                      ? 'Ничего не найдено'
                      : 'Пока пусто'}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {section === 'recent'
                      ? 'Откройте рецепт из библиотеки, и он появится здесь.'
                      : query
                        ? 'Попробуйте другой запрос.'
                        : 'Создайте первый черновик — он появится в вашей библиотеке.'}
                  </p>
                  {section === 'recipes' && !query && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5"
                      onClick={onCreate}
                    >
                      <Plus /> Новый рецепт
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
