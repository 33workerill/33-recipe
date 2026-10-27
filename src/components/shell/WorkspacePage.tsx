import { BookOpenText, Clock3, Settings2 } from 'lucide-react'
import type { WorkspaceSection } from '@/components/shell/navigation'
import { ThemeToggle } from '@/theme/theme-toggle'

export function WorkspacePage({
  section,
}: {
  section: Exclude<WorkspaceSection, 'editor'>
}) {
  const content = {
    recipes: {
      eyebrow: 'КОЛЛЕКЦИЯ',
      title: 'Мои рецепты',
      description:
        'Когда создание и сохранение рецептов станут доступны, ваша коллекция появится здесь.',
      Icon: BookOpenText,
    },
    recent: {
      eyebrow: 'ИСТОРИЯ',
      title: 'Недавние',
      description:
        'История появится после работы с сохранёнными рецептами. Сейчас здесь ещё нет записей.',
      Icon: Clock3,
    },
    settings: {
      eyebrow: 'ПРЕДПОЧТЕНИЯ',
      title: 'Настройки',
      description:
        'Выберите удобную тему интерфейса. Другие настройки появятся по мере развития студии.',
      Icon: Settings2,
    },
  }[section]
  const { Icon } = content

  return (
    <main className="flex flex-1 flex-col px-5 py-8 sm:px-9 sm:py-11">
      <div className="mx-auto w-full max-w-3xl">
        <p className="type-caption tracking-[0.15em] text-muted-foreground">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.055em]">
          {content.title}
        </h1>
        <div className="mt-9 flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em]">
            {section === 'settings' ? 'Тема интерфейса' : 'Пока пусто'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {content.description}
          </p>
          {section === 'settings' && (
            <div className="mt-6">
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
