import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_PRESENTATION,
  FORMAT_LABELS,
  RECIPE_FORMATS,
  RECIPE_STYLES,
  STYLE_LABELS,
  loadPresentationPresets,
  savePresentationPresets,
  type RecipePresentation,
  type RecipePresentationPreset,
} from '@/features/recipes/presentation'

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
        className="size-4 accent-primary"
      />
    </label>
  )
}

export function PresentationSettings({
  presentation,
  onChange,
}: {
  presentation: RecipePresentation
  onChange: (next: RecipePresentation) => void
}) {
  const [presets, setPresets] = useState<RecipePresentationPreset[]>(
    loadPresentationPresets,
  )
  const [presetName, setPresetName] = useState('')
  const [activePreset, setActivePreset] = useState('')
  const update = <K extends keyof RecipePresentation>(
    key: K,
    value: RecipePresentation[K],
  ) => onChange({ ...presentation, [key]: value })
  const persistPresets = (next: RecipePresentationPreset[]) => {
    setPresets(next)
    try {
      savePresentationPresets(next)
    } catch {
      /* Keep the current in-memory preset usable. */
    }
  }
  const selectedPreset = presets.find((preset) => preset.id === activePreset)
  const savePreset = () => {
    const name = presetName.trim()
    if (!name) return
    const preset = {
      id: crypto.randomUUID(),
      name,
      presentation: { ...presentation },
    }
    persistPresets([...presets, preset])
    setActivePreset(preset.id)
    setPresetName('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4">
        <div>
          <p className="text-sm font-semibold">
            {STYLE_LABELS[presentation.styleId]}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {FORMAT_LABELS[presentation.formatId]}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_PRESENTATION })}
        >
          <RotateCcw aria-hidden="true" /> Сбросить
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          Стиль
          <select
            aria-label="Стиль"
            value={presentation.styleId}
            onChange={(event) =>
              update(
                'styleId',
                event.target.value as RecipePresentation['styleId'],
              )
            }
            className="h-10 w-full rounded-lg border border-input bg-background px-3"
          >
            {RECIPE_STYLES.map((style) => (
              <option key={style} value={style}>
                {STYLE_LABELS[style]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          Формат
          <select
            aria-label="Формат"
            value={presentation.formatId}
            onChange={(event) =>
              update(
                'formatId',
                event.target.value as RecipePresentation['formatId'],
              )
            }
            className="h-10 w-full rounded-lg border border-input bg-background px-3"
          >
            {RECIPE_FORMATS.map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABELS[format]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {['a4', 'a5', 'a4-duplex', 'a5-duplex'].includes(
        presentation.formatId,
      ) && (
        <label className="block space-y-1.5 text-sm">
          Ориентация
          <select
            aria-label="Ориентация"
            value={presentation.orientation}
            onChange={(event) =>
              update(
                'orientation',
                event.target.value as RecipePresentation['orientation'],
              )
            }
            className="h-10 w-full rounded-lg border border-input bg-background px-3"
          >
            <option value="portrait">Книжная</option>
            <option value="landscape">Альбомная</option>
          </select>
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          Акцентный цвет
          <input
            aria-label="Цвет акцента"
            type="color"
            value={presentation.accentColor}
            onChange={(event) => update('accentColor', event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background p-1"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          Шрифтовая пара
          <select
            aria-label="Шрифтовая пара"
            value={presentation.fontPair}
            onChange={(event) =>
              update(
                'fontPair',
                event.target.value as RecipePresentation['fontPair'],
              )
            }
            className="h-10 w-full rounded-lg border border-input bg-background px-3"
          >
            <option value="modern">Современная</option>
            <option value="editorial">Редакционная</option>
            <option value="utility">Рабочая</option>
          </select>
        </label>
      </div>
      <label className="block space-y-2 text-sm">
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          Заполнение фотографий
          <select
            value={presentation.imageFit}
            onChange={(event) =>
              update(
                'imageFit',
                event.target.value as RecipePresentation['imageFit'],
              )
            }
            className="h-10 w-full rounded-lg border border-input bg-background px-3"
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
      </div>
      <div className="border-t border-border pt-3">
        <p className="mb-2 text-sm font-semibold">Отображение разделов</p>
        <div className="grid gap-2 sm:grid-cols-2">
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
      </div>
      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-sm font-semibold">Пресеты оформления</p>
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
            if (preset) onChange({ ...preset.presentation })
          }}
          className="h-10 w-full rounded-lg border border-input bg-background px-3"
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
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!presetName.trim()}
            onClick={savePreset}
          >
            Сохранить пресет
          </Button>
          {selectedPreset && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!presetName.trim()}
                onClick={() =>
                  persistPresets(
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
                  persistPresets(
                    presets.filter((item) => item.id !== selectedPreset.id),
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
  )
}
