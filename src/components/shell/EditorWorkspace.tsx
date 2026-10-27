import type { ReactNode } from 'react'
import {
  Camera,
  ChefHat,
  Clock3,
  FileText,
  ListOrdered,
  NotebookPen,
  Scale,
  Tags,
  Users,
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

function PlaceholderRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-right text-xs text-muted-foreground">{detail}</span>
    </div>
  )
}

export function EditorWorkspace() {
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
          <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.055em]">
            Редактор рецепта
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Здесь будет удобно собирать рецепт по шагам. Пока доступна структура
            будущего редактора — ввод и сохранение появятся позже.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <Button type="button" variant="primary" disabled>
            Сохранить рецепт
          </Button>
          <span className="text-xs text-muted-foreground">
            Сохранение пока недоступно
          </span>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-border bg-surface px-5 py-5 sm:px-6">
        <p className="type-caption uppercase tracking-[0.14em] text-muted-foreground">
          Будущий рецепт
        </p>
        <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-foreground">
          Место для вашего названия
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Начните с основной информации, затем добавьте ингредиенты и шаги.
        </p>
      </div>

      <div className="mt-9 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Структура рецепта</h2>
        <span className="type-caption text-muted-foreground">5 разделов</span>
      </div>

      <Accordion type="multiple" defaultValue={['basics']} className="mt-3">
        <EditorSection
          value="basics"
          number="01 / ОСНОВА"
          title="Основная информация"
          description="Название, описание и категория блюда"
          icon={<FileText aria-hidden="true" className="size-5" />}
        >
          <p
            id="editor-unavailable"
            className="mb-5 text-xs leading-5 text-muted-foreground"
          >
            Поля показаны для знакомства со структурой и пока недоступны для
            ввода.
          </p>
          <fieldset
            disabled
            aria-describedby="editor-unavailable"
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="shell-recipe-title">Название</Label>
              <Input
                id="shell-recipe-title"
                placeholder="Например, семейный пирог"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shell-recipe-description">Описание</Label>
              <Textarea
                id="shell-recipe-description"
                placeholder="Короткая история или описание блюда"
                className="min-h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shell-recipe-category">Категория</Label>
              <Input
                id="shell-recipe-category"
                placeholder="Выбор категории появится позже"
              />
            </div>
          </fieldset>
        </EditorSection>

        <EditorSection
          value="ingredients"
          number="02 / СОСТАВ"
          title="Ингредиенты"
          description="Продукты, количества и группы"
          icon={<Scale aria-hidden="true" className="size-5" />}
        >
          <div className="space-y-2">
            <PlaceholderRow
              label="Список ингредиентов"
              detail="Добавление появится позже"
            />
            <PlaceholderRow
              label="Группы ингредиентов"
              detail="Для частей блюда"
            />
          </div>
        </EditorSection>

        <EditorSection
          value="steps"
          number="03 / ПРОЦЕСС"
          title="Приготовление"
          description="Понятные нумерованные шаги"
          icon={<ListOrdered aria-hidden="true" className="size-5" />}
        >
          <div className="flex items-center gap-4 rounded-lg border border-dashed border-border bg-background px-4 py-5">
            <span className="type-caption text-muted-foreground">01</span>
            <span className="text-sm text-muted-foreground">
              Здесь появятся шаги приготовления.
            </span>
          </div>
        </EditorSection>

        <EditorSection
          value="photos"
          number="04 / ВИЗУАЛ"
          title="Фотографии"
          description="Изображения блюда и этапов"
          icon={<Camera aria-hidden="true" className="size-5" />}
        >
          <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center">
            <Camera
              aria-hidden="true"
              className="mb-3 size-5 text-muted-foreground"
            />
            <p className="text-sm font-medium">Место для фотографий</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Загрузка появится на этапе работы с изображениями.
            </p>
          </div>
        </EditorSection>

        <EditorSection
          value="extra"
          number="05 / ДЕТАЛИ"
          title="Дополнительно"
          description="Порции, время, сложность, КБЖУ и заметки"
          icon={<NotebookPen aria-hidden="true" className="size-5" />}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: 'Порции', Icon: Users },
              { label: 'Время приготовления', Icon: Clock3 },
              { label: 'Сложность', Icon: ChefHat },
              { label: 'КБЖУ', Icon: Tags },
              { label: 'Заметки', Icon: NotebookPen },
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Эти параметры станут доступны вместе с полноценным редактором.
          </p>
        </EditorSection>
      </Accordion>
    </main>
  )
}
