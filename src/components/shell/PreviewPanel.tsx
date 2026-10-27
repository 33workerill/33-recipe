import { Expand, FileDown, ScanLine, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Recipe } from '@/features/recipes/model'

const units: Record<string, string> = {
  g: 'г',
  kg: 'кг',
  ml: 'мл',
  l: 'л',
  pcs: 'шт.',
  tsp: 'ч. л.',
  tbsp: 'ст. л.',
  pinch: 'щепотка',
  to_taste: 'по вкусу',
}
const difficulties = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }

export function PreviewPanel({
  recipe,
  imageUrls,
}: {
  recipe: Recipe | null
  imageUrls: Record<string, string>
}) {
  const cover = recipe?.assets.find((asset) => asset.role === 'cover')
  const gallery = recipe?.assets.filter(
    (asset) => asset.role === 'gallery' && imageUrls[asset.id],
  )
  const hasFacts =
    !!recipe &&
    [
      recipe.servings,
      recipe.preparationTimeMinutes,
      recipe.cookingTimeMinutes,
      recipe.difficulty,
    ].some((value) => value !== undefined)
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
            Шаблон 33 Monochrome
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
        <article
          aria-label="Макет 33 Monochrome"
          className="shell-preview-paper w-full max-w-[520px] rounded-sm border p-6 text-[#191919] shadow-xl sm:p-10"
        >
          <div className="flex items-center justify-between border-b border-black/15 pb-4 text-[10px] font-semibold tracking-[0.2em]">
            <span>33 RECIPE</span>
            <span>33 MONOCHROME</span>
          </div>
          {!recipe ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <ScanLine aria-hidden="true" className="size-8 opacity-45" />
              <p className="mt-5 text-lg font-semibold">
                Выберите или создайте рецепт
              </p>
              <p className="mt-2 max-w-xs text-xs leading-5 opacity-65">
                Текущая версия рецепта будет отображаться здесь.
              </p>
            </div>
          ) : (
            <div className="space-y-8 pt-7">
              {cover && imageUrls[cover.id] && (
                <img
                  src={imageUrls[cover.id]}
                  alt={cover.altText || recipe.title || 'Обложка рецепта'}
                  className="max-h-80 w-full object-cover"
                />
              )}
              <header>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-55">
                  {recipe.category || 'Рецепт'}
                </p>
                <h3 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl">
                  {recipe.title || 'Без названия'}
                </h3>
                {recipe.description && (
                  <p className="mt-4 max-w-prose text-sm leading-6 opacity-75">
                    {recipe.description}
                  </p>
                )}
              </header>
              {!!gallery?.length && (
                <div className="grid grid-cols-2 gap-2">
                  {gallery.map((asset) => (
                    <img
                      key={asset.id}
                      src={imageUrls[asset.id]}
                      alt={asset.altText || 'Фотография рецепта'}
                      className="max-h-56 w-full object-cover"
                    />
                  ))}
                </div>
              )}
              {hasFacts && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-black/15 py-4 text-xs sm:grid-cols-4">
                  {recipe.servings !== undefined && (
                    <div>
                      <dt className="uppercase tracking-wider opacity-50">
                        Порции
                      </dt>
                      <dd className="mt-1 font-medium">{recipe.servings}</dd>
                    </div>
                  )}
                  {recipe.preparationTimeMinutes !== undefined && (
                    <div>
                      <dt className="uppercase tracking-wider opacity-50">
                        Подготовка
                      </dt>
                      <dd className="mt-1 font-medium">
                        {recipe.preparationTimeMinutes} мин
                      </dd>
                    </div>
                  )}
                  {recipe.cookingTimeMinutes !== undefined && (
                    <div>
                      <dt className="uppercase tracking-wider opacity-50">
                        Готовка
                      </dt>
                      <dd className="mt-1 font-medium">
                        {recipe.cookingTimeMinutes} мин
                      </dd>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div>
                      <dt className="uppercase tracking-wider opacity-50">
                        Сложность
                      </dt>
                      <dd className="mt-1 font-medium">
                        {difficulties[recipe.difficulty]}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {recipe.ingredientGroups.some((group) =>
                group.ingredients.some((item) => item.name.trim()),
              ) && (
                <section>
                  <h4 className="border-b border-black/15 pb-2 text-sm font-semibold tracking-tight">
                    Ингредиенты
                  </h4>
                  <div className="space-y-5 pt-4">
                    {recipe.ingredientGroups.map((group) => {
                      const items = group.ingredients.filter((item) =>
                        item.name.trim(),
                      )
                      return items.length ? (
                        <div key={group.id}>
                          {group.title && (
                            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-55">
                              {group.title}
                            </h5>
                          )}
                          <ul className="space-y-2">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="flex justify-between gap-4 border-b border-black/10 pb-2 text-sm"
                              >
                                <span>
                                  {item.name}
                                  {item.note && (
                                    <span className="ml-1 text-xs opacity-60">
                                      {item.note}
                                    </span>
                                  )}
                                </span>
                                <span className="shrink-0 text-right tabular-nums">
                                  {item.amount !== undefined &&
                                    `${new Intl.NumberFormat('ru-RU').format(item.amount)} `}
                                  {item.unit.kind === 'custom'
                                    ? item.unit.label
                                    : units[item.unit.code]}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    })}
                  </div>
                </section>
              )}
              {recipe.steps.some(
                (step) => step.instruction.trim() || step.title?.trim(),
              ) && (
                <section>
                  <h4 className="border-b border-black/15 pb-2 text-sm font-semibold tracking-tight">
                    Приготовление
                  </h4>
                  <ol className="space-y-6 pt-4">
                    {recipe.steps.map((step, index) =>
                      step.instruction.trim() || step.title?.trim() ? (
                        <li
                          key={step.id}
                          className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
                        >
                          <span className="pt-0.5 text-xs font-semibold tabular-nums opacity-45">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            {step.title && (
                              <h5 className="mb-1 text-sm font-semibold">
                                {step.title}
                              </h5>
                            )}
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {step.instruction}
                            </p>
                            {(step.durationMinutes !== undefined ||
                              step.temperatureCelsius !== undefined) && (
                              <p className="mt-2 text-xs opacity-55">
                                {[
                                  step.durationMinutes !== undefined &&
                                    `${step.durationMinutes} мин`,
                                  step.temperatureCelsius !== undefined &&
                                    `${step.temperatureCelsius} °C`,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                            {step.note && (
                              <p className="mt-2 text-xs italic opacity-65">
                                {step.note}
                              </p>
                            )}
                            {step.assetIds?.map((id) => {
                              const asset = recipe.assets.find(
                                (item) => item.id === id,
                              )
                              return (
                                imageUrls[id] && (
                                  <img
                                    key={id}
                                    src={imageUrls[id]}
                                    alt={asset?.altText || `Шаг ${index + 1}`}
                                    className="mt-3 max-h-64 w-full object-cover"
                                  />
                                )
                              )
                            })}
                          </div>
                        </li>
                      ) : null,
                    )}
                  </ol>
                </section>
              )}
              {recipe.tips.trim() && (
                <section className="border-l-2 border-black pl-4">
                  <h4 className="text-sm font-semibold">Совет</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {recipe.tips}
                  </p>
                </section>
              )}
              {recipe.nutrition &&
                Object.entries(recipe.nutrition).some(
                  ([key, value]) => key !== 'basis' && value !== undefined,
                ) && (
                  <section>
                    <h4 className="border-b border-black/15 pb-2 text-sm font-semibold">
                      Пищевая ценность
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      {[
                        ['calories', 'ккал'],
                        ['protein', 'белки'],
                        ['fat', 'жиры'],
                        ['carbohydrates', 'углеводы'],
                      ].map(([key, label]) => {
                        const value =
                          recipe.nutrition?.[
                            key as
                              'calories' | 'protein' | 'fat' | 'carbohydrates'
                          ]
                        return value === undefined ? null : (
                          <span key={key}>
                            <strong>
                              {new Intl.NumberFormat('ru-RU').format(value)}
                            </strong>{' '}
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </section>
                )}
              {recipe.notes.trim() && (
                <p className="border-t border-black/15 pt-4 text-xs leading-5 opacity-65">
                  {recipe.notes}
                </p>
              )}
              <footer className="border-t border-black/15 pt-4 text-[9px] tracking-[0.16em] opacity-45">
                33 RECIPE · MONOCHROME
              </footer>
            </div>
          )}
        </article>
      </div>

      <div className="border-t border-border bg-background/70 px-5 py-5 sm:px-8">
        <Button type="button" variant="primary" disabled className="w-full">
          <FileDown aria-hidden="true" />
          Экспортировать
        </Button>
        <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
          Экспорт станет доступен в будущих этапах.
        </p>
      </div>
    </aside>
  )
}
