import type { CSSProperties } from 'react'
import type { Recipe } from '@/features/recipes/model'
import {
  getPageGeometry,
  isDuplexFormat,
  type RecipePresentation,
} from './index'

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
  pageIndex?: number
  side?: 'single' | 'front' | 'back'
  pageHtml?: string
}

function RecipeContent({ recipe, imageUrls, presentation }: Props) {
  if (!recipe)
    return (
      <div className="recipe-empty">
        <h2>Выберите или создайте рецепт</h2>
        <p>Содержимое будет отображаться здесь в выбранном стиле.</p>
      </div>
    )
  const cover = recipe.assets.find(
    (asset) => asset.role === 'cover' && imageUrls[asset.id],
  )
  const gallery = recipe.assets.filter(
    (asset) => asset.role === 'gallery' && imageUrls[asset.id],
  )
  const imageClass =
    presentation.imageFit === 'contain' ? 'object-contain' : 'object-cover'
  return (
    <>
      <div
        data-layout-container
        className={`recipe-front-composition ${presentation.imageFirst ? '' : 'recipe-photo-last'}`}
      >
        {cover && (
          <img
            data-layout-unit="intro"
            src={imageUrls[cover.id]}
            alt={cover.altText || recipe.title}
            className={`recipe-cover ${imageClass}`}
          />
        )}
        <header data-layout-container className="recipe-intro">
          <div data-layout-unit="intro">
            {recipe.category && (
              <p className="recipe-kicker">{recipe.category}</p>
            )}
            <h1>{recipe.title || 'Без названия'}</h1>
          </div>
          {recipe.description && (
            <p data-layout-unit="intro" className="recipe-description">
              {recipe.description}
            </p>
          )}
        </header>
        <dl data-layout-container className="recipe-facts">
          {recipe.servings !== undefined && (
            <div data-layout-unit="intro">
              <dt>Порции</dt>
              <dd>{recipe.servings}</dd>
            </div>
          )}
          {recipe.preparationTimeMinutes !== undefined && (
            <div data-layout-unit="intro">
              <dt>Подготовка</dt>
              <dd>{recipe.preparationTimeMinutes} мин</dd>
            </div>
          )}
          {recipe.cookingTimeMinutes !== undefined && (
            <div data-layout-unit="intro">
              <dt>Готовка</dt>
              <dd>{recipe.cookingTimeMinutes} мин</dd>
            </div>
          )}
          {recipe.difficulty && (
            <div data-layout-unit="intro">
              <dt>Сложность</dt>
              <dd>{difficulty[recipe.difficulty]}</dd>
            </div>
          )}
        </dl>
        {gallery.length > 0 && (
          <div data-layout-container className="recipe-gallery">
            {gallery.map((asset) => (
              <img
                data-layout-unit="intro"
                key={asset.id}
                src={imageUrls[asset.id]}
                alt={asset.altText || 'Фотография рецепта'}
                className={imageClass}
              />
            ))}
          </div>
        )}
      </div>
      <div data-layout-container className="recipe-main-columns">
        <section
          data-layout-container
          className="recipe-section recipe-ingredients"
        >
          <h2>Ингредиенты</h2>
          {recipe.ingredientGroups.map((group) => (
            <div
              data-layout-container
              className="recipe-ingredient-group"
              key={group.id}
            >
              {group.title && <h3>{group.title}</h3>}
              <ul>
                {group.ingredients
                  .filter((item) => item.name.trim())
                  .map((item) => (
                    <li data-layout-unit="ingredients" key={item.id}>
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
          ))}
        </section>
        <section data-layout-container className="recipe-section recipe-method">
          <h2>Приготовление</h2>
          <ol>
            {recipe.steps
              .filter((step) => step.instruction.trim() || step.title?.trim())
              .map((step) => (
                <li data-layout-container key={step.id}>
                  <span className="recipe-step-number">
                    {String(recipe.steps.indexOf(step) + 1).padStart(2, '0')}
                  </span>
                  <div data-layout-container className="recipe-step-content">
                    <div data-layout-unit="method">
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
                    </div>
                    {presentation.showStepImages &&
                      step.assetIds?.map((id) =>
                        imageUrls[id] ? (
                          <img
                            data-layout-unit="method"
                            key={id}
                            src={imageUrls[id]}
                            alt={
                              recipe.assets.find((asset) => asset.id === id)
                                ?.altText || 'Фото шага'
                            }
                            className={`recipe-step-image ${imageClass}`}
                          />
                        ) : null,
                      )}
                  </div>
                </li>
              ))}
          </ol>
        </section>
      </div>
      {presentation.showNutrition &&
        recipe.nutrition &&
        Object.entries(recipe.nutrition).some(
          ([key, value]) => key !== 'basis' && value !== undefined,
        ) && (
          <section
            data-layout-unit="extras"
            className="recipe-section recipe-nutrition"
          >
            <h2>Пищевая ценность</h2>
            <div>
              {(
                [
                  ['calories', 'ккал'],
                  ['protein', 'белки'],
                  ['fat', 'жиры'],
                  ['carbohydrates', 'углеводы'],
                ] as const
              ).map(([key, label]) =>
                recipe.nutrition?.[key] === undefined ? null : (
                  <span key={key}>
                    <strong>
                      {new Intl.NumberFormat('ru-RU').format(
                        recipe.nutrition[key]!,
                      )}
                    </strong>{' '}
                    {label}
                  </span>
                ),
              )}
            </div>
          </section>
        )}
      {presentation.showTips && recipe.tips.trim() && (
        <section data-layout-unit="extras" className="recipe-callout">
          <h2>Совет</h2>
          <p>{recipe.tips}</p>
        </section>
      )}
      {presentation.showNotes && recipe.notes.trim() && (
        <section
          data-layout-unit="extras"
          className="recipe-section recipe-notes"
        >
          <h2>Заметки</h2>
          <p>{recipe.notes}</p>
        </section>
      )}
    </>
  )
}

export function RecipeRenderer({
  recipe,
  imageUrls,
  presentation,
  pageIndex = 0,
  side = 'single',
  pageHtml,
}: Props) {
  const geometry = getPageGeometry(
    presentation.formatId,
    presentation.orientation,
  )
  const duplex = isDuplexFormat(presentation.formatId)
  const cssVars = {
    '--recipe-accent': presentation.accentColor,
    '--recipe-scale': presentation.typographyScale,
    '--page-width': `${geometry.widthMm}mm`,
    '--page-height': geometry.adaptive ? 'auto' : `${geometry.heightMm}mm`,
  } as CSSProperties
  return (
    <article
      aria-label={`Лист ${pageIndex + 1}${duplex ? ` · ${side === 'front' ? 'лицевая сторона' : 'оборотная сторона'}` : ''}`}
      className={`recipe-paper recipe-style-${presentation.styleId} recipe-format-${presentation.formatId} recipe-font-${presentation.fontPair} ${duplex ? 'recipe-duplex-side' : ''} ${side === 'front' ? 'recipe-side-front' : ''} ${side === 'back' ? 'recipe-side-back' : ''}`}
      data-orientation={presentation.orientation}
      data-page-number={pageIndex + 1}
      data-side={side}
      data-recipe-title={recipe?.title}
      style={cssVars}
    >
      {pageHtml === undefined ? (
        <div className="recipe-page-content" data-recipe-page-content>
          <RecipeContent
            recipe={recipe}
            imageUrls={imageUrls}
            presentation={presentation}
          />
        </div>
      ) : (
        <div
          className="recipe-page-content"
          data-recipe-page-content
          dangerouslySetInnerHTML={{ __html: pageHtml }}
        />
      )}
      {recipe && (
        <footer className="recipe-page-number">
          {pageIndex + 1}
          {duplex ? ` · ${side === 'front' ? 'Лицевая' : 'Оборотная'}` : ''}
        </footer>
      )}
    </article>
  )
}
