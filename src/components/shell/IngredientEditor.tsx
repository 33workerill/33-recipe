import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumericField } from '@/components/shell/NumericField'
import {
  createIngredient,
  createIngredientGroup,
  type Ingredient,
  type IngredientUnit,
  type Recipe,
} from '@/features/recipes/model'

const units = [
  ['g', 'г'],
  ['kg', 'кг'],
  ['ml', 'мл'],
  ['l', 'л'],
  ['pcs', 'шт'],
  ['tsp', 'ч. л.'],
  ['tbsp', 'ст. л.'],
  ['pinch', 'щепотка'],
  ['to_taste', 'по вкусу'],
] as const

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return
  const [item] = items.splice(from, 1)
  items.splice(to, 0, item)
}

function unitValue(unit: IngredientUnit): string {
  return unit.kind === 'custom' ? 'custom' : unit.code
}

export function IngredientEditor({
  recipe,
  change,
}: {
  recipe: Recipe
  change: (mutator: (recipe: Recipe) => void) => void
}) {
  const addGroup = () =>
    change((draft) => {
      draft.ingredientGroups.push(createIngredientGroup())
    })
  const updateIngredient = (
    groupIndex: number,
    ingredientIndex: number,
    update: (ingredient: Ingredient) => void,
  ) => {
    change((draft) =>
      update(draft.ingredientGroups[groupIndex].ingredients[ingredientIndex]),
    )
  }

  return (
    <div className="space-y-5">
      {recipe.ingredientGroups.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          Добавьте первую группу и продукты для рецепта.
        </p>
      )}
      {recipe.ingredientGroups.map((group, groupIndex) => (
        <section
          key={group.id}
          className="rounded-xl border border-border bg-background p-4 sm:p-5"
          aria-label={`Группа ингредиентов ${groupIndex + 1}`}
        >
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[170px] flex-1 space-y-1.5">
              <Label htmlFor={`group-${group.id}`}>
                Название группы {groupIndex + 1}
              </Label>
              <Input
                id={`group-${group.id}`}
                value={group.title ?? ''}
                placeholder="Например, тесто"
                onChange={(event) =>
                  change((draft) => {
                    draft.ingredientGroups[groupIndex].title =
                      event.target.value
                  })
                }
              />
            </div>
            <div
              className="flex gap-1"
              aria-label={`Порядок группы ${groupIndex + 1}`}
            >
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={groupIndex === 0}
                aria-label={`Группу ${groupIndex + 1} вверх`}
                onClick={() =>
                  change((draft) =>
                    move(draft.ingredientGroups, groupIndex, groupIndex - 1),
                  )
                }
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={groupIndex === recipe.ingredientGroups.length - 1}
                aria-label={`Группу ${groupIndex + 1} вниз`}
                onClick={() =>
                  change((draft) =>
                    move(draft.ingredientGroups, groupIndex, groupIndex + 1),
                  )
                }
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Удалить группу ${groupIndex + 1}`}
                onClick={() => {
                  if (
                    window.confirm(
                      `Удалить группу «${group.title || groupIndex + 1}» и все её ингредиенты?`,
                    )
                  )
                    change((draft) => {
                      draft.ingredientGroups.splice(groupIndex, 1)
                    })
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {group.ingredients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                В группе пока нет ингредиентов.
              </p>
            )}
            {group.ingredients.map((ingredient, ingredientIndex) => (
              <div
                key={ingredient.id}
                className="rounded-lg border border-border bg-surface p-3 sm:p-4"
                aria-label={`Ингредиент ${ingredientIndex + 1}`}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_100px_130px]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`ingredient-name-${ingredient.id}`}>
                      Продукт {ingredientIndex + 1}
                    </Label>
                    <Input
                      id={`ingredient-name-${ingredient.id}`}
                      value={ingredient.name}
                      placeholder="Например, мука"
                      onChange={(event) =>
                        updateIngredient(
                          groupIndex,
                          ingredientIndex,
                          (item) => {
                            item.name = event.target.value
                          },
                        )
                      }
                    />
                  </div>
                  <NumericField
                    id={`ingredient-amount-${ingredient.id}`}
                    label="Количество"
                    value={ingredient.amount}
                    onChange={(amount) =>
                      updateIngredient(groupIndex, ingredientIndex, (item) => {
                        if (amount === undefined) delete item.amount
                        else item.amount = amount
                      })
                    }
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor={`ingredient-unit-${ingredient.id}`}>
                      Единица
                    </Label>
                    <select
                      id={`ingredient-unit-${ingredient.id}`}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                      value={unitValue(ingredient.unit)}
                      onChange={(event) =>
                        updateIngredient(
                          groupIndex,
                          ingredientIndex,
                          (item) => {
                            item.unit =
                              event.target.value === 'custom'
                                ? { kind: 'custom', label: '' }
                                : {
                                    kind: 'standard',
                                    code: event.target.value as Extract<
                                      IngredientUnit,
                                      { kind: 'standard' }
                                    >['code'],
                                  }
                          },
                        )
                      }
                    >
                      {units.map(([code, label]) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                      <option value="custom">Своя единица</option>
                    </select>
                  </div>
                </div>
                {ingredient.unit.kind === 'custom' && (
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor={`ingredient-custom-${ingredient.id}`}>
                      Своя единица
                    </Label>
                    <Input
                      id={`ingredient-custom-${ingredient.id}`}
                      value={ingredient.unit.label}
                      placeholder="Введите свою единицу"
                      onChange={(event) =>
                        updateIngredient(
                          groupIndex,
                          ingredientIndex,
                          (item) => {
                            item.unit = {
                              kind: 'custom',
                              label: event.target.value,
                            }
                          },
                        )
                      }
                    />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="min-w-[160px] flex-1 space-y-1.5">
                    <Label htmlFor={`ingredient-note-${ingredient.id}`}>
                      Заметка
                    </Label>
                    <Input
                      id={`ingredient-note-${ingredient.id}`}
                      value={ingredient.note ?? ''}
                      placeholder="Необязательно"
                      onChange={(event) =>
                        updateIngredient(
                          groupIndex,
                          ingredientIndex,
                          (item) => {
                            if (event.target.value)
                              item.note = event.target.value
                            else delete item.note
                          },
                        )
                      }
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={ingredientIndex === 0}
                      aria-label={`Ингредиент ${ingredientIndex + 1} вверх`}
                      onClick={() =>
                        change((draft) =>
                          move(
                            draft.ingredientGroups[groupIndex].ingredients,
                            ingredientIndex,
                            ingredientIndex - 1,
                          ),
                        )
                      }
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={
                        ingredientIndex === group.ingredients.length - 1
                      }
                      aria-label={`Ингредиент ${ingredientIndex + 1} вниз`}
                      onClick={() =>
                        change((draft) =>
                          move(
                            draft.ingredientGroups[groupIndex].ingredients,
                            ingredientIndex,
                            ingredientIndex + 1,
                          ),
                        )
                      }
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Удалить ингредиент ${ingredientIndex + 1}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Удалить ингредиент «${ingredient.name || ingredientIndex + 1}»?`,
                          )
                        )
                          change((draft) => {
                            draft.ingredientGroups[
                              groupIndex
                            ].ingredients.splice(ingredientIndex, 1)
                          })
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() =>
              change((draft) => {
                draft.ingredientGroups[groupIndex].ingredients.push(
                  createIngredient(),
                )
              })
            }
          >
            <Plus /> Добавить ингредиент
          </Button>
        </section>
      ))}
      <Button type="button" variant="outline" onClick={addGroup}>
        <Plus /> Добавить группу
      </Button>
    </div>
  )
}
