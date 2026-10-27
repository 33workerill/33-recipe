import type { CSSProperties } from 'react'
import type { Recipe } from '@/features/recipes/model'
import {
  STYLE_LABELS,
  type RecipePresentation,
} from '@/features/recipes/presentation'

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
const difficulty = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }

type Props = {
  recipe: Recipe | null
  imageUrls: Record<string, string>
  presentation: RecipePresentation
}

export function RecipeRenderer({ recipe, imageUrls, presentation }: Props) {
  const assets = recipe?.assets ?? []
  const cover = assets.find((asset) => asset.role === 'cover')
  const gallery = assets.filter(
    (asset) => asset.role === 'gallery' && imageUrls[asset.id],
  )
  const style = presentation.styleId
  const fixed = ['a4', 'a5', 'story', 'note', 'square', 'mini-card'].includes(
    presentation.formatId,
  )
  const contentSize = recipe
    ? recipe.ingredientGroups.reduce(
        (total, group) => total + group.ingredients.length,
        0,
      ) +
      recipe.steps.reduce(
        (total, step) => total + Math.ceil(step.instruction.length / 150),
        0,
      ) +
      (recipe.description.length > 220 ? 2 : 0)
    : 0
  const overflow = fixed && contentSize > 18
  const cssVars = {
    '--recipe-accent': presentation.accentColor,
    '--recipe-scale': presentation.typographyScale,
  } as CSSProperties
  const imageClass =
    presentation.imageFit === 'contain' ? 'object-contain' : 'object-cover'
  const coverImage =
    cover && imageUrls[cover.id] ? (
      <img
        src={imageUrls[cover.id]}
        alt={cover.altText || recipe?.title || 'Обложка рецепта'}
        className={`recipe-cover ${imageClass} ${presentation.imageFirst ? '' : 'order-last'}`}
      />
    ) : null

  const intro = recipe && (
    <header className="recipe-intro">
      {recipe.category && <p className="recipe-kicker">{recipe.category}</p>}
      <h1>{recipe.title || 'Без названия'}</h1>
      {recipe.description && (
        <p className="recipe-description">{recipe.description}</p>
      )}
    </header>
  )

  const facts = recipe &&
    [
      recipe.servings !== undefined && ['Порции', recipe.servings],
      recipe.preparationTimeMinutes !== undefined && [
        'Подготовка',
        `${recipe.preparationTimeMinutes} мин`,
      ],
      recipe.cookingTimeMinutes !== undefined && [
        'Готовка',
        `${recipe.cookingTimeMinutes} мин`,
      ],
      recipe.difficulty && ['Сложность', difficulty[recipe.difficulty]],
    ].filter(Boolean).length > 0 && (
      <dl className="recipe-facts">
        {recipe.servings !== undefined && (
          <div>
            <dt>Порции</dt>
            <dd>{recipe.servings}</dd>
          </div>
        )}
        {recipe.preparationTimeMinutes !== undefined && (
          <div>
            <dt>Подготовка</dt>
            <dd>{recipe.preparationTimeMinutes} мин</dd>
          </div>
        )}
        {recipe.cookingTimeMinutes !== undefined && (
          <div>
            <dt>Готовка</dt>
            <dd>{recipe.cookingTimeMinutes} мин</dd>
          </div>
        )}
        {recipe.difficulty && (
          <div>
            <dt>Сложность</dt>
            <dd>{difficulty[recipe.difficulty]}</dd>
          </div>
        )}
      </dl>
    )

  const ingredients = recipe && (
    <section className="recipe-section recipe-ingredients">
      <h2>
        <span>01</span> Ингредиенты
      </h2>
      {recipe.ingredientGroups.map((group) => {
        const items = group.ingredients.filter((item) => item.name.trim())
        if (!items.length) return null
        return (
          <div className="recipe-ingredient-group" key={group.id}>
            {group.title && <h3>{group.title}</h3>}
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name}
                    {item.note && <small> · {item.note}</small>}
                  </span>
                  <span className="recipe-amount">
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
        )
      })}
    </section>
  )

  const steps = recipe && (
    <section className="recipe-section recipe-method">
      <h2>
        <span>02</span> Приготовление
      </h2>
      <ol>
        {recipe.steps.map((step, index) => {
          if (!step.instruction.trim() && !step.title?.trim()) return null
          return (
            <li key={step.id}>
              <span className="recipe-step-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="recipe-step-content">
                {step.title && <h3>{step.title}</h3>}
                <p>{step.instruction}</p>
                {(step.durationMinutes !== undefined ||
                  step.temperatureCelsius !== undefined) && (
                  <small>
                    {[
                      step.durationMinutes !== undefined &&
                        `${step.durationMinutes} мин`,
                      step.temperatureCelsius !== undefined &&
                        `${step.temperatureCelsius} °C`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                )}
                {step.note && <p className="recipe-note">{step.note}</p>}
                {presentation.showStepImages &&
                  step.assetIds?.map((id) => {
                    const asset = assets.find((item) => item.id === id)
                    return (
                      imageUrls[id] && (
                        <img
                          key={id}
                          src={imageUrls[id]}
                          alt={asset?.altText || `Шаг ${index + 1}`}
                          className={`recipe-step-image ${imageClass}`}
                        />
                      )
                    )
                  })}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )

  const extras = recipe && (
    <>
      {presentation.showTips && recipe.tips.trim() && (
        <section className="recipe-callout">
          <h2>Совет</h2>
          <p>{recipe.tips}</p>
        </section>
      )}
      {presentation.showNutrition &&
        recipe.nutrition &&
        Object.entries(recipe.nutrition).some(
          ([key, value]) => key !== 'basis' && value !== undefined,
        ) && (
          <section className="recipe-section recipe-nutrition">
            <h2>Пищевая ценность</h2>
            <div>
              {[
                ['calories', 'ккал'],
                ['protein', 'белки'],
                ['fat', 'жиры'],
                ['carbohydrates', 'углеводы'],
              ].map(([key, label]) => {
                const value =
                  recipe.nutrition?.[
                    key as 'calories' | 'protein' | 'fat' | 'carbohydrates'
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
      {presentation.showNotes && recipe.notes.trim() && (
        <p className="recipe-notes">{recipe.notes}</p>
      )}
    </>
  )

  const book = presentation.formatId === 'book-spread'
  const introGroup = (
    <>
      {coverImage}
      {intro}
      {gallery.length > 0 && (
        <div className="recipe-gallery">
          {gallery.map((asset) => (
            <img
              key={asset.id}
              src={imageUrls[asset.id]}
              alt={asset.altText || 'Фотография рецепта'}
              className={imageClass}
            />
          ))}
        </div>
      )}
    </>
  )

  return (
    <>
      {overflow && (
        <p role="status" className="recipe-overflow-warning" style={cssVars}>
          Контента больше, чем обычно помещается на одной странице. Предпросмотр
          показывает всё содержимое; экспортная пагинация появится в Phase 08.
        </p>
      )}
      <article
        aria-label={`${STYLE_LABELS[style]} · ${presentation.formatId}`}
        className={`recipe-paper recipe-style-${style} recipe-format-${presentation.formatId} recipe-font-${presentation.fontPair} ${book ? 'recipe-book-spread' : ''} ${overflow ? 'recipe-overflow' : ''}`}
        data-orientation={presentation.orientation}
        style={cssVars}
      >
        <div className="recipe-paper-brand">
          <span>33 RECIPE</span>
          <span>{STYLE_LABELS[style]}</span>
        </div>
        {!recipe ? (
          <div className="recipe-empty">
            <h2>Выберите или создайте рецепт</h2>
            <p>Содержимое будет отображаться здесь в выбранном стиле.</p>
          </div>
        ) : book ? (
          <div className="recipe-spread-pages">
            <div className="recipe-spread-left">
              {introGroup}
              {facts}
              {ingredients}
            </div>
            <div className="recipe-spread-right">
              {steps}
              {extras}
            </div>
          </div>
        ) : (
          <div
            className={`recipe-content ${presentation.imageFirst ? '' : 'recipe-image-last'}`}
          >
            {introGroup}
            {facts}
            <div className="recipe-main-columns">
              {ingredients}
              {steps}
            </div>
            {extras}
          </div>
        )}
        {recipe && (
          <footer className="recipe-paper-footer">
            33 RECIPE <span>·</span>{' '}
            {recipe.category || 'PERSONAL RECIPE STUDIO'}
          </footer>
        )}
      </article>
    </>
  )
}
