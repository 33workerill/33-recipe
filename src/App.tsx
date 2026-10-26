function App() {
  return (
    <div className="flex min-h-svh flex-col bg-[#f6f6f4] text-[#20201e]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-10 sm:py-9">
        <div className="text-sm font-semibold tracking-[-0.035em]">
          33 RECIPE
        </div>
        <span className="text-xs text-[#757570]">Personal Recipe Studio</span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20 sm:px-10 sm:py-28">
        <div className="max-w-3xl">
          <p className="mb-9 text-xs font-medium uppercase tracking-[0.18em] text-[#777772]">
            Персональная студия рецептов
          </p>
          <span
            aria-hidden="true"
            className="block text-6xl font-semibold tracking-[-0.09em] sm:text-8xl"
          >
            33.
          </span>
          <h1 className="mt-7 text-4xl font-semibold leading-[1.08] tracking-[-0.065em] sm:mt-10 sm:text-6xl">
            Рецепты, к которым хочется возвращаться.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#5c5c57] sm:text-lg sm:leading-8">
            33 RECIPE — личное пространство для создания, оформления и хранения
            любимых рецептов. Со временем здесь появятся удобный редактор,
            красивые шаблоны и форматы для печати.
          </p>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-[#dcdcd8] px-6 py-6 text-xs text-[#757570] sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span>33 RECIPE · Personal Recipe Studio</span>
        <span>Проект на этапе Foundation</span>
      </footer>
    </div>
  )
}

export default App
