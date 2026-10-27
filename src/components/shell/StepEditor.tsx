import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NumericField } from '@/components/shell/NumericField'
import {
  createCookingStep,
  type CookingStep,
  type Recipe,
} from '@/features/recipes/model'

export function StepEditor({
  recipe,
  change,
}: {
  recipe: Recipe
  change: (mutator: (recipe: Recipe) => void) => void
}) {
  const updateStep = (index: number, update: (step: CookingStep) => void) =>
    change((draft) => update(draft.steps[index]))
  const move = (from: number, to: number) =>
    change((draft) => {
      const [step] = draft.steps.splice(from, 1)
      draft.steps.splice(to, 0, step)
    })

  return (
    <div className="space-y-4">
      {recipe.steps.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          Опишите приготовление шаг за шагом. Черновик можно сохранить и без
          шагов.
        </p>
      )}
      {recipe.steps.map((step, index) => (
        <section
          key={step.id}
          aria-label={`Шаг ${index + 1}`}
          className="rounded-xl border border-border bg-background p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Шаг {index + 1}</h3>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={index === 0}
                aria-label={`Шаг ${index + 1} вверх`}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={index === recipe.steps.length - 1}
                aria-label={`Шаг ${index + 1} вниз`}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Удалить шаг ${index + 1}`}
                onClick={() => {
                  if (window.confirm(`Удалить шаг ${index + 1}?`))
                    change((draft) => {
                      draft.steps.splice(index, 1)
                    })
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`step-title-${step.id}`}>Заголовок шага</Label>
              <Input
                id={`step-title-${step.id}`}
                value={step.title ?? ''}
                placeholder="Необязательно"
                onChange={(event) =>
                  updateStep(index, (item) => {
                    if (event.target.value) item.title = event.target.value
                    else delete item.title
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`step-instruction-${step.id}`}>Инструкция</Label>
              <Textarea
                id={`step-instruction-${step.id}`}
                value={step.instruction}
                rows={5}
                className="min-h-28"
                placeholder="Что нужно сделать?"
                onChange={(event) =>
                  updateStep(index, (item) => {
                    item.instruction = event.target.value
                  })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumericField
                id={`step-duration-${step.id}`}
                label="Время, мин"
                value={step.durationMinutes}
                onChange={(value) =>
                  updateStep(index, (item) => {
                    if (value === undefined) delete item.durationMinutes
                    else item.durationMinutes = value
                  })
                }
              />
              <NumericField
                id={`step-temperature-${step.id}`}
                label="Температура, °C"
                value={step.temperatureCelsius}
                onChange={(value) =>
                  updateStep(index, (item) => {
                    if (value === undefined) delete item.temperatureCelsius
                    else item.temperatureCelsius = value
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`step-note-${step.id}`}>Заметка к шагу</Label>
              <Input
                id={`step-note-${step.id}`}
                value={step.note ?? ''}
                placeholder="Необязательно"
                onChange={(event) =>
                  updateStep(index, (item) => {
                    if (event.target.value) item.note = event.target.value
                    else delete item.note
                  })
                }
              />
            </div>
          </div>
        </section>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          change((draft) => {
            draft.steps.push(createCookingStep())
          })
        }
      >
        <Plus /> Добавить шаг
      </Button>
    </div>
  )
}
