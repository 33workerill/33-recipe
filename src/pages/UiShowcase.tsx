import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from '@/theme/theme-context'
import { ThemeToggle } from '@/theme/theme-toggle'

const sections = [
  { id: 'colors', number: '01', title: 'Colors' },
  { id: 'typography', number: '02', title: 'Typography' },
  { id: 'buttons', number: '03', title: 'Buttons' },
  { id: 'forms', number: '04', title: 'Form Controls' },
  { id: 'navigation', number: '05', title: 'Navigation' },
  { id: 'containers', number: '06', title: 'Cards & Containers' },
  { id: 'feedback', number: '07', title: 'Feedback' },
  { id: 'overlays', number: '08', title: 'Dialogs & Overlays' },
  { id: 'dark-mode', number: '09', title: 'Dark Mode Preview' },
] as const

const swatches = [
  ['Background', '--background'],
  ['Foreground', '--foreground'],
  ['Surface / Card', '--card'],
  ['Muted', '--muted'],
  ['Muted Foreground', '--muted-foreground'],
  ['Border', '--border'],
  ['Input', '--input'],
  ['Ring / Focus', '--ring'],
  ['Primary', '--primary'],
  ['Secondary', '--secondary'],
  ['Destructive', '--destructive'],
  ['Success', '--success'],
  ['Warning', '--warning'],
] as const

function ShowcaseSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string
  number: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-t border-border py-10 sm:py-12"
    >
      <div className="mb-8 grid gap-2 sm:grid-cols-[3rem_1fr] sm:gap-4">
        <span className="type-caption pt-1 text-muted-foreground">
          {number}
        </span>
        <div>
          <h2 id={`${id}-title`} className="type-h2">
            {title}
          </h2>
          <p className="type-small mt-2 max-w-2xl text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="sm:pl-16">{children}</div>
    </section>
  )
}

function ColorSwatch({ name, token }: { name: string; token: string }) {
  return (
    <div className="min-w-0">
      <div
        className="h-20 rounded-xl border border-border shadow-[0_1px_0_var(--border)]"
        style={{ backgroundColor: `var(${token})` }}
        aria-hidden="true"
      />
      <p className="type-label mt-3 break-words">{name}</p>
      <code className="type-caption break-all text-muted-foreground">
        {token}
      </code>
    </div>
  )
}

export function UiShowcase() {
  const [notice, setNotice] = useState('')
  const [checked, setChecked] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const { theme, resolvedTheme } = useTheme()

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-10">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[-0.04em]"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              33
            </span>
            <span className="hidden sm:inline">RECIPE</span>
          </a>
          <span className="type-caption hidden text-muted-foreground md:inline">
            DESIGN SYSTEM / 02
          </span>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="type-caption hidden items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:inline-flex"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" /> На главную
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
        <div className="border-b border-border py-14 sm:py-20">
          <div className="type-caption mb-6 flex items-center gap-3 uppercase tracking-[0.16em] text-muted-foreground">
            <span
              className="inline-block size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            33 UI · Foundations
          </div>
          <h1 className="type-display max-w-4xl">
            Пространство для хороших идей.
          </h1>
          <p className="type-body-lg mt-7 max-w-2xl text-muted-foreground">
            Спокойная система интерфейса для личной студии рецептов. Каждый
            элемент помогает сосредоточиться на содержимом.
          </p>
          <p
            role="status"
            aria-live="polite"
            className="type-small mt-5 min-h-6 text-muted-foreground"
          >
            {notice ||
              'Наведите указатель, перейдите клавишей Tab и попробуйте элементы ниже.'}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
          <nav
            aria-label="Разделы дизайн-системы"
            className="self-start pt-8 lg:sticky lg:top-24"
          >
            <ol className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 lg:grid-cols-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    className="type-small flex min-h-10 items-center gap-2 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
                    href={`#${section.id}`}
                  >
                    <span className="type-caption text-muted-foreground">
                      {section.number}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <main className="min-w-0">
            <ShowcaseSection
              id="colors"
              number="01"
              title="Colors"
              description="Цвет имеет роль. Токены меняются вместе с темой, а компоненты используют их по смыслу."
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
                {swatches.map(([name, token]) => (
                  <ColorSwatch key={token} name={name} token={token} />
                ))}
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="typography"
              number="02"
              title="Typography"
              description="Один системный шрифт с поддержкой кириллицы. Масштаб и интервалы создают иерархию без декоративных гарнитур."
            >
              <div className="divide-y divide-border rounded-xl border border-border bg-surface px-5 sm:px-7">
                {[
                  ['Display', 'type-display', 'Хорошая еда объединяет.'],
                  ['Heading 1', 'type-h1', 'Семейные рецепты'],
                  ['Heading 2', 'type-h2', 'Простые привычки'],
                  ['Heading 3', 'type-h3', 'Начните с любимого'],
                  [
                    'Body Large',
                    'type-body-lg',
                    'Сохраняйте блюда, к которым хочется возвращаться.',
                  ],
                  [
                    'Body',
                    'type-body',
                    'Каждый рецепт начинается с маленькой истории и понятных шагов.',
                  ],
                  [
                    'Small',
                    'type-small',
                    'Небольшой поясняющий текст остаётся читаемым.',
                  ],
                  ['Caption', 'type-caption', 'Подпись к элементу · 12 px'],
                  ['Label', 'type-label', 'Название рецепта'],
                  ['Button Text', 'type-button', 'Сохранить подборку'],
                ].map(([label, className, sample]) => (
                  <div
                    key={label}
                    className="grid gap-3 py-5 lg:grid-cols-[8rem_1fr]"
                  >
                    <span className="type-caption pt-1 text-muted-foreground">
                      {label}
                    </span>
                    <span className={className}>{sample}</span>
                  </div>
                ))}
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="buttons"
              number="03"
              title="Buttons"
              description="Приоритет действия виден по тону. Наведение, нажатие, фокус и недоступность имеют отдельные состояния."
            >
              <div className="space-y-7 rounded-xl border border-border bg-surface p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    onClick={() => setNotice('Основное действие нажато')}
                  >
                    Primary <ArrowUpRight aria-hidden="true" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setNotice('Вторичное действие нажато')}
                  >
                    Secondary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNotice('Контурная кнопка нажата')}
                  >
                    Outline
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setNotice('Лёгкая кнопка нажата')}
                  >
                    Ghost
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setNotice('Демонстрация опасного действия')}
                  >
                    Destructive
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Добавить пример"
                    onClick={() => setNotice('Пример добавлен')}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                  <Button disabled>Disabled</Button>
                  <Button disabled aria-busy="true">
                    <LoaderCircle aria-hidden="true" className="animate-spin" />{' '}
                    Loading
                  </Button>
                  <Button size="sm" variant="outline">
                    Small
                  </Button>
                  <Button size="lg">Large</Button>
                </div>
                <p className="type-caption text-muted-foreground">
                  Проверьте Tab для фокуса, Enter или Space для действия; на
                  сенсорном экране нажмите любую доступную кнопку.
                </p>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="forms"
              number="04"
              title="Form Controls"
              description="Поля имеют видимые подписи, подсказки и доступное сообщение об ошибке. Управление работает мышью, касанием и клавиатурой."
            >
              <div className="grid gap-8 rounded-xl border border-border bg-surface p-5 sm:p-7 xl:grid-cols-2">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-name">Название рецепта</Label>
                    <Input
                      id="recipe-name"
                      placeholder="Например, яблочный пирог"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipe-email">
                      Email для примера ошибки
                    </Label>
                    <Input
                      id="recipe-email"
                      type="email"
                      defaultValue="неверный адрес"
                      aria-invalid="true"
                      aria-describedby="email-error"
                    />
                    <p id="email-error" className="type-small text-destructive">
                      Введите адрес в формате name@example.com.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipe-note">Заметка</Label>
                    <Textarea
                      id="recipe-note"
                      placeholder="Пара слов о семейной традиции"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disabled-input">Недоступное поле</Label>
                    <Input
                      id="disabled-input"
                      disabled
                      placeholder="Только для просмотра"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="demo-checkbox"
                      checked={checked}
                      onCheckedChange={(value) => setChecked(value === true)}
                    />
                    <Label htmlFor="demo-checkbox">Показывать заметки</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="demo-switch"
                      checked={enabled}
                      onCheckedChange={setEnabled}
                    />
                    <Label htmlFor="demo-switch">Компактный просмотр</Label>
                  </div>
                  <fieldset className="space-y-3">
                    <legend className="type-label">Вид карточки</legend>
                    <RadioGroup defaultValue="list" aria-label="Вид карточки">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="list" id="view-list" />
                        <Label htmlFor="view-list">Список</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="grid" id="view-grid" />
                        <Label htmlFor="view-grid">Сетка</Label>
                      </div>
                    </RadioGroup>
                  </fieldset>
                  <div className="space-y-2">
                    <Label htmlFor="category-select">Категория</Label>
                    <Select defaultValue="family">
                      <SelectTrigger id="category-select" className="w-full">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Семейные</SelectItem>
                        <SelectItem value="daily">На каждый день</SelectItem>
                        <SelectItem value="holiday">Для праздника</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="navigation"
              number="05"
              title="Navigation"
              description="Переключение контекста без лишнего движения: вкладки, меню, подсказка и раскрывающийся ответ."
            >
              <div className="grid gap-8 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-7">
                  <Tabs defaultValue="overview">
                    <TabsList
                      aria-label="Демонстрация вкладок"
                      className="h-10"
                    >
                      <TabsTrigger value="overview">Обзор</TabsTrigger>
                      <TabsTrigger value="details">Детали</TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="overview"
                      className="type-small pt-5 text-muted-foreground"
                    >
                      Общая информация остаётся на первом плане.
                    </TabsContent>
                    <TabsContent
                      value="details"
                      className="type-small pt-5 text-muted-foreground"
                    >
                      Дополнительные детали появляются по запросу.
                    </TabsContent>
                  </Tabs>
                  <Separator className="my-6" />
                  <div className="flex flex-wrap items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Действия <ChevronDown aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Вид примера</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setNotice('Выбран компактный вид')}
                        >
                          Компактный вид
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setNotice('Выбран свободный вид')}
                        >
                          Свободный вид
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Показать подсказку"
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Короткая подсказка по действию
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface px-5 py-4 sm:px-7">
                  <Accordion type="single" collapsible defaultValue="principle">
                    <AccordionItem value="principle">
                      <AccordionTrigger>
                        Зачем нужны семантические токены?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          Они позволяют менять тему без замены цветов в каждом
                          компоненте.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="motion">
                      <AccordionTrigger>
                        Что происходит при Reduced Motion?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>Переходы и анимации сокращаются до минимума.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="containers"
              number="06"
              title="Cards & Containers"
              description="Поверхности отделяют смысловые блоки тонкой линией. Карточки не спорят с текстом за внимание."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Личная коллекция</CardTitle>
                    <CardDescription>
                      Пример спокойной информационной карточки.
                    </CardDescription>
                    <CardAction>
                      <BookOpen
                        aria-hidden="true"
                        className="size-5 text-muted-foreground"
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="type-body">
                      Любимые рецепты всегда под рукой.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <span className="type-caption text-muted-foreground">
                      Демонстрационные данные · 12 рецептов
                    </span>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Тонкая иерархия</CardTitle>
                    <CardDescription>
                      Заголовок, описание и одно действие.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="type-small text-muted-foreground">
                      Отступы и типографика создают структуру без тяжёлой тени.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotice('Карточка выбрана')}
                    >
                      Подробнее <ArrowUpRight aria-hidden="true" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="feedback"
              number="07"
              title="Feedback"
              description="Состояние должно быть понятно по тексту и форме, а не только по цвету."
            >
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge>Активно</Badge>
                  <Badge variant="secondary">Черновик</Badge>
                  <Badge variant="outline">Архив</Badge>
                  <Badge variant="destructive">Ошибка</Badge>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  <Alert>
                    <CircleCheck aria-hidden="true" />
                    <AlertTitle>Готово</AlertTitle>
                    <AlertDescription>
                      Действие завершено. Сообщение остаётся читаемым в обеих
                      темах.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <CircleAlert aria-hidden="true" />
                    <AlertTitle>Требуется внимание</AlertTitle>
                    <AlertDescription>
                      Проверьте заполненные поля и попробуйте снова.
                    </AlertDescription>
                  </Alert>
                </div>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <p className="type-label mb-4">Загрузка карточки</p>
                  <div
                    aria-label="Пример состояния загрузки"
                    className="flex items-center gap-4"
                  >
                    <Skeleton className="size-12 shrink-0 rounded-lg" />
                    <div className="w-full max-w-sm space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="overlays"
              number="08"
              title="Dialogs & Overlays"
              description="Модальные слои удерживают фокус внутри и возвращают его на вызвавший элемент после закрытия."
            >
              <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-5 sm:p-7">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <SlidersHorizontal aria-hidden="true" /> Открыть диалог
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Настройки примера</DialogTitle>
                      <DialogDescription>
                        Проверьте Tab, Escape и возврат фокуса после закрытия.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="dialog-title">Название подборки</Label>
                      <Input
                        id="dialog-title"
                        placeholder="Домашние завтраки"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="secondary">Закрыть</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          onClick={() =>
                            setNotice('Демонстрационный диалог закрыт')
                          }
                        >
                          Готово <Check aria-hidden="true" />
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Открыть боковую панель</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Боковая панель</SheetTitle>
                      <SheetDescription>
                        Место для контекстных действий без смены страницы.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="type-body flex-1 px-4 text-muted-foreground">
                      Содержимое здесь исключительно демонстрационное.
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="secondary">Закрыть панель</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="dark-mode"
              number="09"
              title="Dark Mode Preview"
              description="Одна система токенов обслуживает светлый, тёмный и системный режимы. Выбор сохраняется между посещениями."
            >
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="type-caption uppercase tracking-[0.14em] text-muted-foreground">
                      Текущий режим · {theme}
                    </p>
                    <h3 className="type-h3 mt-3">
                      Палитра {resolvedTheme === 'dark' ? 'тёмная' : 'светлая'}
                    </h3>
                    <p className="type-small mt-2 max-w-md text-muted-foreground">
                      Переключите тему в верхней панели. Поверхность, текст и
                      элементы управления изменятся вместе.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-muted p-2">
                    <span
                      className="size-6 rounded-full bg-background ring-1 ring-border"
                      aria-label="Фон"
                    />
                    <span
                      className="size-6 rounded-full bg-secondary"
                      aria-label="Вторичный цвет"
                    />
                    <span
                      className="size-6 rounded-full bg-primary"
                      aria-label="Основной цвет"
                    />
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => setNotice('Предпросмотр темы проверен')}
                  >
                    Основное действие
                  </Button>
                  <Button variant="outline">Вторичное действие</Button>
                  <Badge variant="secondary">Спокойный статус</Badge>
                </div>
              </div>
            </ShowcaseSection>
          </main>
        </div>
      </div>
    </div>
  )
}
