import { useEffect, useState } from 'react'
import { FileDown, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecipeRenderer } from '@/features/recipes/presentation/RecipeRenderer'
import {
  DEFAULT_PRESENTATION,
  FORMAT_LABELS,
  RECIPE_FORMATS,
  RECIPE_STYLES,
  STYLE_LABELS,
  loadPresentation,
  loadPresentationPresets,
  savePresentation,
  savePresentationPresets,
  type RecipePresentation,
  type RecipePresentationPreset,
} from '@/features/recipes/presentation'
import type { Recipe } from '@/features/recipes/model'

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-1 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--recipe-accent)]"
      />
    </label>
  )
}

export function PreviewPanel({
  recipe,
  imageUrls,
}: {
  recipe: Recipe | null
  imageUrls: Record<string, string>
}) {
  const recipeId = recipe?.id
  const [settings, setSettings] = useState(() => ({
    recipeId,
    presentation: recipeId
      ? loadPresentation(recipeId)
      : { ...DEFAULT_PRESENTATION },
  }))
  const presentation =
    settings.recipeId === recipeId
      ? settings.presentation
      : recipeId
        ? loadPresentation(recipeId)
        : { ...DEFAULT_PRESENTATION }
  const [presets, setPresets] = useState<RecipePresentationPreset[]>(
    loadPresentationPresets,
  )
  const [presetName, setPresetName] = useState('')
  const [activePreset, setActivePreset] = useState('')
  const [previewWidth, setPreviewWidth] = useState(100)

  useEffect(() => {
    if (!recipeId || settings.recipeId !== recipeId) return
    try {
      savePresentation(recipeId, settings.presentation)
    } catch {
      // Keep the current in-memory choice usable if browser storage is unavailable.
    }
  }, [recipeId, settings])

  const update = <K extends keyof RecipePresentation>(
    key: K,
    value: RecipePresentation[K],
  ) =>
    setSettings((current) => ({
      recipeId,
      presentation: {
        ...(current.recipeId === recipeId
          ? current.presentation
          : presentation),
        [key]: value,
      },
    }))

  const updatePresets = (next: RecipePresentationPreset[]) => {
    setPresets(next)
    try {
      savePresentationPresets(next)
    } catch {
      // Presets remain available during the current page session.
    }
  }

  const savePreset = () => {
    const name = presetName.trim()
    if (!name) return
    const preset = {
      id: crypto.randomUUID(),
      name,
      presentation: { ...presentation },
    }
    updatePresets([...presets, preset])
    setActivePreset(preset.id)
    setPresetName('')
  }

  const selectedPreset = presets.find((preset) => preset.id === activePreset)

  return (
    <aside
      aria-label="Предпросмотр рецепта"
      className="flex min-h-full min-w-0 flex-col border-l border-border bg-muted/40"
    >
      <header className="border-b border-border px-5 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-caption uppercase tracking-[0.15em] text-muted-foreground">
              Визуализация
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
              Студия оформления
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {STYLE_LABELS[presentation.styleId]} ·{' '}
              {FORMAT_LABELS[presentation.formatId]}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() =>
              setSettings({
                recipeId,
                presentation: { ...DEFAULT_PRESENTATION },
              })
            }
            aria-label="Сбросить настройки оформления"
            title="Сбросить настройки"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>

        <details className="recipe-settings mt-4 rounded-xl border border-border bg-background">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Стиль и формат
            <span className="ml-auto text-xs text-muted-foreground">
              Настроить
            </span>
          </summary>
          <div className="space-y-4 border-t border-border p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-medium">
                Стиль
                <select
                  value={presentation.styleId}
                  onChange={(event) =>
                    update(
                      'styleId',
                      event.target.value as RecipePresentation['styleId'],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {RECIPE_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {STYLE_LABELS[style]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Формат
                <select
                  value={presentation.formatId}
                  onChange={(event) =>
                    update(
                      'formatId',
                      event.target.value as RecipePresentation['formatId'],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {RECIPE_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {FORMAT_LABELS[format]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {['a4', 'a5'].includes(presentation.formatId) && (
              <label className="space-y-1 text-xs font-medium">
                Ориентация
                <select
                  value={presentation.orientation}
                  onChange={(event) =>
                    update(
                      'orientation',
                      event.target.value as RecipePresentation['orientation'],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <option value="portrait">Книжная</option>
                  <option value="landscape">Альбомная</option>
                </select>
              </label>
            )}
            <label className="block space-y-2 text-xs font-medium">
              Масштаб предпросмотра · {previewWidth}%
              <input
                aria-label="Масштаб предпросмотра"
                type="range"
                min="65"
                max="100"
                step="5"
                value={previewWidth}
                onChange={(event) =>
                  setPreviewWidth(Number(event.target.value))
                }
                className="w-full accent-primary"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-medium">
                Акцент
                <input
                  aria-label="Цвет акцента"
                  type="color"
                  value={presentation.accentColor}
                  onChange={(event) =>
                    update('accentColor', event.target.value)
                  }
                  className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background p-1"
                />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Шрифтовая пара
                <select
                  value={presentation.fontPair}
                  onChange={(event) =>
                    update(
                      'fontPair',
                      event.target.value as RecipePresentation['fontPair'],
                    )
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <option value="modern">Современная</option>
                  <option value="editorial">Редакционная</option>
                  <option value="utility">Рабочая</option>
                </select>
              </label>
            </div>
            <label className="block space-y-2 text-xs font-medium">
              Размер текста · {Math.round(presentation.typographyScale * 100)}%
              <input
                aria-label="Масштаб типографики"
                type="range"
                min="85"
                max="120"
                step="5"
                value={Math.round(presentation.typographyScale * 100)}
                onChange={(event) =>
                  update('typographyScale', Number(event.target.value) / 100)
                }
                className="w-full accent-primary"
              />
            </label>
            <label className="space-y-1 text-xs font-medium">
              Заполнение фотографий
              <select
                value={presentation.imageFit}
                onChange={(event) =>
                  update(
                    'imageFit',
                    event.target.value as RecipePresentation['imageFit'],
                  )
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value="cover">Заполнить рамку</option>
                <option value="contain">Показать целиком</option>
              </select>
            </label>
            <Toggle
              label="Фото в начале макета"
              checked={presentation.imageFirst}
              onChange={(value) => update('imageFirst', value)}
            />
            <div className="border-t border-border pt-2">
              <p className="mb-1 text-xs font-semibold">Показывать блоки</p>
              <Toggle
                label="Пищевая ценность"
                checked={presentation.showNutrition}
                onChange={(value) => update('showNutrition', value)}
              />
              <Toggle
                label="Заметки"
                checked={presentation.showNotes}
                onChange={(value) => update('showNotes', value)}
              />
              <Toggle
                label="Советы"
                checked={presentation.showTips}
                onChange={(value) => update('showTips', value)}
              />
              <Toggle
                label="Фото шагов"
                checked={presentation.showStepImages}
                onChange={(value) => update('showStepImages', value)}
              />
            </div>
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold">Мои пресеты</p>
              <label className="sr-only" htmlFor="recipe-preset-select">
                Сохранённые пресеты
              </label>
              <select
                id="recipe-preset-select"
                value={activePreset}
                onChange={(event) => {
                  setActivePreset(event.target.value)
                  const preset = presets.find(
                    (item) => item.id === event.target.value,
                  )
                  if (preset)
                    setSettings({
                      recipeId,
                      presentation: { ...preset.presentation },
                    })
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              >
                <option value="">Выберите пресет</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Название пресета"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                placeholder="Название нового пресета"
                maxLength={40}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!presetName.trim()}
                  onClick={savePreset}
                >
                  Сохранить как новый
                </Button>
                {selectedPreset && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!presetName.trim()}
                      onClick={() =>
                        updatePresets(
                          presets.map((item) =>
                            item.id === selectedPreset.id
                              ? { ...item, name: presetName.trim() }
                              : item,
                          ),
                        )
                      }
                    >
                      Переименовать
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Удалить пресет ${selectedPreset.name}`}
                      onClick={() => {
                        updatePresets(
                          presets.filter(
                            (item) => item.id !== selectedPreset.id,
                          ),
                        )
                        setActivePreset('')
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </details>
      </header>

      <div className="flex flex-1 flex-col items-center px-4 py-5 sm:px-6 xl:sticky xl:top-0">
        <div
          className="mb-4 w-full"
          style={{ maxWidth: `${(520 * previewWidth) / 100}px` }}
        >
          <Button type="button" variant="primary" disabled className="w-full">
            <FileDown aria-hidden="true" />
            Экспортировать
          </Button>
          <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
            Экспорт станет доступен в Phase 08.
          </p>
        </div>
        <div
          className="w-full"
          style={{ maxWidth: `${(520 * previewWidth) / 100}px` }}
        >
          <RecipeRenderer
            recipe={recipe}
            imageUrls={imageUrls}
            presentation={presentation}
          />
        </div>
      </div>
    </aside>
  )
}
