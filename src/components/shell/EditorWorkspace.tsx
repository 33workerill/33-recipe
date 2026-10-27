import { useState, type ReactNode } from 'react'
import {
  Camera,
  FileText,
  ListOrdered,
  NotebookPen,
  Plus,
  Scale,
  X,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IngredientEditor } from '@/components/shell/IngredientEditor'
import { NumericField } from '@/components/shell/NumericField'
import { StepEditor } from '@/components/shell/StepEditor'
import type { SaveStatus } from '@/features/recipes/data/use-recipe-workspace'
import {
  validateCompleteRecipe,
  validateDraftRecipe,
  type Recipe,
} from '@/features/recipes/model'

type Props = {
  recipe: Recipe | null
  status: SaveStatus
  error: string | null
  onChange: (change: (recipe: Recipe) => void) => void
  onSave: () => void
  onCreate: () => void
}

function EditorSection({
  value,
  number,
  title,
  description,
  icon,
  children,
}: {
  value: string
  number: string
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <AccordionItem
      value={value}
      className="border-b border-border last:border-b-0"
    >
      <AccordionTrigger className="gap-4 py-5 hover:no-underline">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="type-caption block text-muted-foreground">
            {number}
          </span>
          <span className="mt-0.5 block text-base font-semibold text-foreground">
            {title}
          </span>
          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
            {description}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pl-0 pb-6 sm:pl-14">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

function TagEditor({
  recipe,
  onChange,
}: {
  recipe: Recipe
  onChange: Props['onChange']
}) {
  const [tag, setTag] = useState('')
  const add = () => {
    const value = tag.trim()
    if (
      !value ||
      recipe.tags.some(
        (existing) =>
          existing.toLocaleLowerCase() === value.toLocaleLowerCase(),
      )
    )
      return
    onChange((draft) => {
      draft.tags.push(value)
    })
    setTag('')
  }
  return (
    <div className="space-y-2">
      <Label htmlFor="recipe-new-tag">Теги</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="recipe-new-tag"
          className="min-w-[160px] flex-1"
          value={tag}
          placeholder="Например, семейный"
          onChange={(event) => setTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus /> Добавить
        </Button>
      </div>
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs"
            >
              {value}
              <button
                type="button"
                aria-label={`Удалить тег ${value}`}
                className="rounded-full p-1 focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() =>
                  onChange((draft) => {
                    draft.tags.splice(index, 1)
                  })
                }
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ExtraFields({
  recipe,
  onChange,
}: {
  recipe: Recipe
  onChange: Props['onChange']
}) {
  const setOptional = (
    key: 'servings' | 'preparationTimeMinutes' | 'cookingTimeMinutes',
    value?: number,
  ) =>
    onChange((draft) => {
      if (value === undefined) delete draft[key]
      else draft[key] = value
    })
  const setNutrition = (
    key: 'calories' | 'protein' | 'fat' | 'carbohydrates',
    value?: number,
  ) =>
    onChange((draft) => {
      if (draft.nutrition) {
        if (value === undefined) delete draft.nutrition[key]
        else draft.nutrition[key] = value
      }
    })
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumericField
          id="recipe-servings"
          label="Порции"
          value={recipe.servings}
          min={0.01}
          onChange={(value) => setOptional('servings', value)}
        />
        <div className="space-y-1.5">
          <Label htmlFor="recipe-difficulty">Сложность</Label>
          <select
            id="recipe-difficulty"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
            value={recipe.difficulty ?? ''}
            onChange={(event) =>
              onChange((draft) => {
                if (event.target.value)
                  draft.difficulty = event.target.value as NonNullable<
                    Recipe['difficulty']
                  >
                else delete draft.difficulty
              })
            }
          >
            <option value="">Не выбрана</option>
            <option value="easy">Легко</option>
            <option value="medium">Средне</option>
            <option value="hard">Сложно</option>
          </select>
        </div>
        <NumericField
          id="recipe-prep"
          label="Подготовка, мин"
          value={recipe.preparationTimeMinutes}
          onChange={(value) => setOptional('preparationTimeMinutes', value)}
        />
        <NumericField
          id="recipe-cook"
          label="Приготовление, мин"
          value={recipe.cookingTimeMinutes}
          onChange={(value) => setOptional('cookingTimeMinutes', value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="recipe-tips">Советы</Label>
        <Textarea
          id="recipe-tips"
          value={recipe.tips}
          rows={3}
          onChange={(event) =>
            onChange((draft) => {
              draft.tips = event.target.value
            })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="recipe-notes">Личные заметки</Label>
        <Textarea
          id="recipe-notes"
          value={recipe.notes}
          rows={3}
          onChange={(event) =>
            onChange((draft) => {
              draft.notes = event.target.value
            })
          }
        />
      </div>
      <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={!!recipe.nutrition}
            onChange={(event) =>
              onChange((draft) => {
                if (event.target.checked)
                  draft.nutrition = { basis: 'per_serving' }
                else delete draft.nutrition
              })
            }
            className="size-4 accent-primary"
          />
          Пищевая ценность
        </label>
        {recipe.nutrition && (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nutrition-basis">Основание расчёта</Label>
              <select
                id="nutrition-basis"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                value={recipe.nutrition.basis}
                onChange={(event) =>
                  onChange((draft) => {
                    if (draft.nutrition)
                      draft.nutrition.basis = event.target.value as NonNullable<
                        Recipe['nutrition']
                      >['basis']
                  })
                }
              >
                <option value="per_serving">На порцию</option>
                <option value="per_100g">На 100 г</option>
                <option value="per_recipe">На весь рецепт</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumericField
                id="nutrition-calories"
                label="Калории"
                value={recipe.nutrition.calories}
                onChange={(value) => setNutrition('calories', value)}
              />
              <NumericField
                id="nutrition-protein"
                label="Белки, г"
                value={recipe.nutrition.protein}
                onChange={(value) => setNutrition('protein', value)}
              />
              <NumericField
                id="nutrition-fat"
                label="Жиры, г"
                value={recipe.nutrition.fat}
                onChange={(value) => setNutrition('fat', value)}
              />
              <NumericField
                id="nutrition-carbs"
                label="Углеводы, г"
                value={recipe.nutrition.carbohydrates}
                onChange={(value) => setNutrition('carbohydrates', value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Значения вводятся вручную и не рассчитываются автоматически.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function EditorWorkspace({
  recipe,
  status,
  error,
  onChange,
  onSave,
  onCreate,
}: Props) {
  const complete = recipe ? validateCompleteRecipe(recipe) : null
  const draft = recipe ? validateDraftRecipe(recipe) : null
  const statusText = {
    changes: 'Изменения',
    saving: 'Сохранение…',
    saved: 'Сохранено',
    error: 'Ошибка сохранения',
  }[status]
  return (
    <main
      aria-label="Редактор рецепта"
      className="mx-auto w-full max-w-[860px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-7">
        <div className="max-w-xl">
          <p className="type-caption uppercase tracking-[0.16em] text-muted-foreground">
            Ваша рабочая область
          </p>
          <h1 className="mt-3 break-words text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.055em]">
            {recipe?.title || 'Редактор рецепта'}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            {recipe
              ? 'Заполняйте разделы в удобном порядке. Незавершённый рецепт сохраняется как черновик.'
              : 'Создайте первый рецепт или откройте сохранённый из библиотеки.'}
          </p>
        </div>
        {recipe && (
          <div className="flex flex-col items-start gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={onSave}
              disabled={status === 'saving'}
            >
              Сохранить рецепт
            </Button>
            <span
              role="status"
              aria-live="polite"
              className={`text-xs ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {statusText}
            </span>
            <span className="text-xs text-muted-foreground">
              {complete?.success ? 'Готов к оформлению' : 'Черновик'}
            </span>
          </div>
        )}
      </div>
      {!recipe ? (
        <div className="mt-9 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">Здесь начнётся ваш рецепт</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Черновики хранятся только в этом браузере. Сохраните резервную копию
            в настройках.
          </p>
          <Button
            type="button"
            variant="primary"
            className="mt-6"
            onClick={onCreate}
          >
            <Plus /> Новый рецепт
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={onSave}
              >
                Повторить сохранение
              </Button>
            </div>
          )}
          {draft && !draft.success && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-destructive/40 p-4 text-sm text-destructive"
            >
              <p className="font-medium">Проверьте данные черновика:</p>
              <ul className="mt-2 list-disc pl-5">
                {draft.issues.slice(0, 5).map((issue, index) => (
                  <li key={index}>
                    {issue.path.join(' → ') || 'Рецепт'}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-7 rounded-2xl border border-border bg-surface px-5 py-5 sm:px-6">
            <p className="type-caption uppercase tracking-[0.14em] text-muted-foreground">
              Текущий рецепт
            </p>
            <p className="mt-3 break-words text-xl font-semibold tracking-[-0.04em]">
              {recipe.title || 'Без названия'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {recipe.description ||
                'Добавьте описание, ингредиенты и шаги приготовления.'}
            </p>
          </div>
          <div className="mt-9 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Содержание рецепта</h2>
            <span className="type-caption text-muted-foreground">
              5 разделов
            </span>
          </div>
          <Accordion type="multiple" defaultValue={['basics']} className="mt-3">
            <EditorSection
              value="basics"
              number="01 / ОСНОВА"
              title="Основная информация"
              description="Название, описание, категория и теги"
              icon={<FileText aria-hidden="true" className="size-5" />}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recipe-title">Название</Label>
                  <Input
                    id="recipe-title"
                    value={recipe.title}
                    placeholder="Например, семейный пирог"
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.title = event.target.value
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipe-description">Описание</Label>
                  <Textarea
                    id="recipe-description"
                    value={recipe.description}
                    rows={3}
                    placeholder="Короткая история или описание блюда"
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.description = event.target.value
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipe-category">Категория</Label>
                  <Input
                    id="recipe-category"
                    value={recipe.category}
                    placeholder="Например, выпечка"
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.category = event.target.value
                      })
                    }
                  />
                </div>
                <TagEditor recipe={recipe} onChange={onChange} />
              </div>
            </EditorSection>
            <EditorSection
              value="ingredients"
              number="02 / СОСТАВ"
              title="Ингредиенты"
              description="Продукты, количества и группы"
              icon={<Scale aria-hidden="true" className="size-5" />}
            >
              <IngredientEditor recipe={recipe} change={onChange} />
            </EditorSection>
            <EditorSection
              value="steps"
              number="03 / ПРОЦЕСС"
              title="Приготовление"
              description="Нумерованные шаги в нужном порядке"
              icon={<ListOrdered aria-hidden="true" className="size-5" />}
            >
              <StepEditor recipe={recipe} change={onChange} />
            </EditorSection>
            <EditorSection
              value="photos"
              number="04 / ВИЗУАЛ"
              title="Фотографии"
              description="Изображения блюда и этапов"
              icon={<Camera aria-hidden="true" className="size-5" />}
            >
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Загрузка фотографий появится на следующем этапе Fast Track.
              </div>
            </EditorSection>
            <EditorSection
              value="extra"
              number="05 / ДЕТАЛИ"
              title="Дополнительно"
              description="Порции, время, сложность, КБЖУ и заметки"
              icon={<NotebookPen aria-hidden="true" className="size-5" />}
            >
              <ExtraFields recipe={recipe} onChange={onChange} />
            </EditorSection>
          </Accordion>
        </>
      )}
    </main>
  )
}
