import { ThemeToggle } from '@/theme/theme-toggle'

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10 sm:py-8">
        <a
          href="/"
          className="shrink-0 text-sm font-semibold tracking-[-0.035em]"
        >
          33 RECIPE
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-xs text-muted-foreground lg:inline">
            Personal Recipe Studio
          </span>
          <a
            href="/ui"
            className="type-caption text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            33 UI
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20 sm:px-10 sm:py-28">
        <div className="max-w-3xl">
          <p className="type-caption mb-9 uppercase tracking-[0.18em] text-muted-foreground">
            Персональная студия рецептов
          </p>
          <span aria-hidden="true" className="type-display block">
            33.
          </span>
          <h1 className="type-h1 mt-7 sm:mt-10">
            Рецепты, к которым хочется возвращаться.
          </h1>
          <p className="type-body-lg mt-7 max-w-xl text-muted-foreground">
            33 RECIPE — личное пространство для создания, оформления и хранения
            любимых рецептов. Со временем здесь появятся удобный редактор,
            красивые шаблоны и форматы для печати.
          </p>
        </div>
      </main>

      <footer className="type-caption mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-border px-6 py-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span>33 RECIPE · Personal Recipe Studio</span>
        <span>Проект на этапе Design System</span>
      </footer>
    </div>
  )
}

export default App
