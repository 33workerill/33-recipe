import { lazy, Suspense } from 'react'
import App from '@/App'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/theme/theme-provider'

const UiShowcase = lazy(async () => ({
  default: (await import('@/pages/UiShowcase')).UiShowcase,
}))

export function Root() {
  const path = window.location.pathname.replace(/\/$/, '')

  return (
    <ThemeProvider>
      <TooltipProvider>
        {path === '/ui' ? (
          <Suspense
            fallback={
              <main className="flex min-h-svh items-center justify-center text-muted-foreground">
                Загрузка дизайн-системы…
              </main>
            }
          >
            <UiShowcase />
          </Suspense>
        ) : (
          <App />
        )}
      </TooltipProvider>
    </ThemeProvider>
  )
}
