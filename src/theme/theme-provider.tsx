import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'
import { ThemeContext, type ThemeMode } from '@/theme/theme-context'

const STORAGE_KEY = '33-recipe-app-theme'
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'

function getStoredTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : 'system'
  } catch {
    return 'system'
  }
}

function isSystemDark() {
  return window.matchMedia?.(SYSTEM_QUERY).matches ?? false
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme)
  const [systemDark, setSystemDark] = useState(isSystemDark)
  const resolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const media = window.matchMedia?.(SYSTEM_QUERY)
    if (!media) return
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The in-memory choice still works when storage is unavailable.
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
