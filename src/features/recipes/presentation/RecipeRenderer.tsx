import type { CSSProperties, ReactNode } from 'react'
import type { Recipe } from '@/features/recipes/model'
import {
  createRecipePagePlan,
  getPageGeometry,
  isDuplexFormat,
  type RecipePagePlan,
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
  pageIndex?: number
  side?: 'single' | 'front' | 'back'
  plan?: RecipePagePlan
}

function Intro({
  recipe,
  imageUrls,
  presentation,
  description,
}: Pick<Props, 'recipe' | 'imageUrls' | 'presentation'> & {
  description?: string
}) {
  if (!recipe) return null
  const cover = recipe.assets.find(
    (asset) => asset.role === 'cover' && imageUrls[asset.id],
  )
  const gallery = recipe.assets.filter(
    (asset) => asset.role === 'gallery' && imageUrls[asset.id],
  )
  const imageClass =
    presentation.imageFit === 'contain' ? 'object-contain' : 'object-cover'
  return (
    <div
      className={`recipe-front-composition ${presentation.imageFirst ? '' : 'recipe-photo-last'}`}
    >
      {cover && (
        <img
          src={imageUrls[cover.id]}
          alt={cover.altText || recipe.title || 'Обложка рецепта'}
          className={`recipe-cover ${imageClass}`}
        />
      )}
      <header className="recipe-intro">
        {recipe.category && <p className="recipe-kicker">{recipe.category}</p>}
        <h1>{recipe.title || 'Без названия'}</h1>
        {description && <p className="recipe-description">{description}</p>}
      </header>
      {recipe.servings !== undefined ||
      recipe.preparationTimeMinutes !== undefined ||
      recipe.cookingTimeMinutes !== undefined ||
      recipe.difficulty ? (
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
      ) : null}
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
    </div>
  )
}

function Ingredients({
  recipe,
  plan,
}: {
  recipe: Recipe
  plan: RecipePagePlan
}) {
  if (!plan.ingredientSlices.length) return null
  return (
    <section className="recipe-section recipe-ingredients">
      <h2>Ингредиенты</h2>
      {plan.ingredientSlices.map((slice) => {
        const group = recipe.ingredientGroups.find(
          (item) => item.id === slice.groupId,
        )
        if (!group) return null
        return (
          <div
            className="recipe-ingredient-group"
            key={`${slice.groupId}-${slice.ingredientIds[0]}`}
          >
            {group.title && (
              <h3>
                {group.title}
                {slice.continued ? ' · продолжение' : ''}
              </h3>
            )}
            <ul>
              {group.ingredients
                .filter((item) => slice.ingredientIds.includes(item.id))
                .map((item) => (
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
}

function Method({
  recipe,
  imageUrls,
  presentation,
  plan,
}: Pick<Props, 'recipe' | 'imageUrls' | 'presentation' | 'plan'>) {
  if (!recipe || !plan?.steps.length) return null
  const assets = recipe.assets
  return (
    <section className="recipe-section recipe-method">
      <h2>Приготовление</h2>
      <ol>
        {plan.steps.map((fragment) => {
          const index = recipe.steps.findIndex(
            (step) => step.id === fragment.stepId,
          )
          const step = recipe.steps[index]
          if (!step) return null
          return (
            <li key={`${step.id}-${fragment.part}`}>
              <span className="recipe-step-number">
                {String(index + 1).padStart(2, '0')}
                {fragment.parts > 1
                  ? ` · ${fragment.part}/${fragment.parts}`
                  : ''}
              </span>
              <div className="recipe-step-content">
                {fragment.part === 1 && step.title && <h3>{step.title}</h3>}
                <p>{fragment.text}</p>
                {fragment.part === fragment.parts &&
                  (step.durationMinutes !== undefined ||
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
                {fragment.part === fragment.parts && step.note && (
                  <p className="recipe-note">{step.note}</p>
                )}
                {fragment.part === fragment.parts &&
                  presentation.showStepImages &&
                  step.assetIds?.map((id) => {
                    const asset = assets.find((item) => item.id === id)
                    return imageUrls[id] ? (
                      <img
                        key={id}
                        src={imageUrls[id]}
                        alt={asset?.altText || `Шаг ${index + 1}`}
                        className={`recipe-step-image ${presentation.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                      />
                    ) : null
                  })}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Nutrition({ recipe }: { recipe: Recipe }) {
  if (
    !recipe.nutrition ||
    !Object.entries(recipe.nutrition).some(
      ([key, value]) => key !== 'basis' && value !== undefined,
    )
  )
    return null
  const fields = [
    ['calories', 'ккал'],
    ['protein', 'белки'],
    ['fat', 'жиры'],
    ['carbohydrates', 'углеводы'],
  ] as const
  return (
    <section className="recipe-section recipe-nutrition">
      <h2>Пищевая ценность</h2>
      <div>
        {fields.map(([key, label]) => {
          const value = recipe.nutrition?.[key]
          return value === undefined ? null : (
            <span key={key}>
              <strong>{new Intl.NumberFormat('ru-RU').format(value)}</strong>{' '}
              {label}
            </span>
          )
        })}
      </div>
    </section>
  )
}

function ExtraBlock({ kind, text }: RecipePagePlan['extras'][number]) {
  return kind === 'tips' ? (
    <section className="recipe-callout">
      <h2>Совет</h2>
      <p>{text}</p>
    </section>
  ) : (
    <section className="recipe-section recipe-notes">
      <h2>Заметки</h2>
      <p>{text}</p>
    </section>
  )
}

export function RecipeRenderer({
  recipe,
  imageUrls,
  presentation,
  pageIndex = 0,
  side = 'single',
  plan: suppliedPlan,
}: Props) {
  const plan =
    suppliedPlan ??
    (recipe ? createRecipePagePlan(recipe, presentation)[pageIndex] : undefined)
  const geometry = getPageGeometry(
    presentation.formatId,
    presentation.orientation,
  )
  const duplex = isDuplexFormat(presentation.formatId)
  const front = duplex && side === 'front'
  const cssVars = {
    '--recipe-accent': presentation.accentColor,
    '--recipe-scale': presentation.typographyScale,
    '--page-width': `${geometry.widthMm}mm`,
    '--page-height': geometry.adaptive ? 'auto' : `${geometry.heightMm}mm`,
  } as CSSProperties
  const frontOnly = side === 'front'
  const content: ReactNode = !recipe ? (
    <div className="recipe-empty">
      <h2>Выберите или создайте рецепт</h2>
      <p>Содержимое будет отображаться здесь в выбранном стиле.</p>
    </div>
  ) : frontOnly ? (
    <>
      {pageIndex === 0 ? (
        <Intro
          recipe={recipe}
          imageUrls={imageUrls}
          presentation={presentation}
          description={plan?.descriptionFragment?.text ?? recipe.description}
        />
      ) : (
        <div className="recipe-page-continuation">
          <p className="recipe-continuation-title">
            {recipe.title} · продолжение{' '}
            {plan?.descriptionFragment?.parts &&
            plan.descriptionFragment.parts > 1
              ? `(${plan.descriptionFragment.part}/${plan.descriptionFragment.parts})`
              : ''}
          </p>
          {plan?.descriptionFragment?.text && (
            <p className="recipe-description">
              {plan.descriptionFragment.text}
            </p>
          )}
        </div>
      )}
      {pageIndex === 0 && <Nutrition recipe={recipe} />}
    </>
  ) : (
    <>
      {(!duplex || front) && pageIndex === 0 && (
        <Intro
          recipe={recipe}
          imageUrls={imageUrls}
          presentation={presentation}
          description={plan?.descriptionFragment?.text ?? recipe.description}
        />
      )}
      {pageIndex > 0 && (
        <div className="recipe-page-continuation">
          <p className="recipe-continuation-title">
            {recipe.title} · лист {pageIndex + 1}
          </p>
          {!duplex && plan?.descriptionFragment?.text && (
            <p className="recipe-description">
              {plan.descriptionFragment.text}
            </p>
          )}
        </div>
      )}
      {duplex && pageIndex === 0 && (
        <p className="recipe-continuation-title">{recipe.title}</p>
      )}
      <div
        className={`recipe-main-columns recipe-style-${presentation.styleId}`}
      >
        <Ingredients
          recipe={recipe}
          plan={
            plan ?? { number: 1, ingredientSlices: [], steps: [], extras: [] }
          }
        />
        <Method
          recipe={recipe}
          imageUrls={imageUrls}
          presentation={presentation}
          plan={plan}
        />
      </div>
      {plan?.extras.map((extra) => (
        <ExtraBlock key={extra.kind} {...extra} />
      ))}
      {pageIndex === 0 && !duplex && presentation.showNutrition && (
        <Nutrition recipe={recipe} />
      )}
    </>
  )
  return (
    <article
      aria-label={`Лист ${pageIndex + 1}${duplex ? ` · ${side === 'front' ? 'лицевая сторона' : 'оборотная сторона'}` : ''}`}
      className={`recipe-paper recipe-style-${presentation.styleId} recipe-format-${presentation.formatId} recipe-font-${presentation.fontPair} ${duplex ? 'recipe-duplex-side' : ''} ${front ? 'recipe-side-front' : ''} ${side === 'back' ? 'recipe-side-back' : ''}`}
      data-orientation={presentation.orientation}
      data-page-number={pageIndex + 1}
      data-side={side}
      style={cssVars}
    >
      <div className="recipe-page-content" data-recipe-page-content>
        {content}
      </div>
      {recipe && (
        <footer className="recipe-page-number">
          {pageIndex + 1}
          {duplex ? ` · ${side === 'front' ? 'Лицевая' : 'Оборотная'}` : ''}
        </footer>
      )}
    </article>
  )
}
