import { Laptop, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/theme-context'

const modes = [
  { value: 'light', label: 'Светлая тема', Icon: Sun },
  { value: 'dark', label: 'Тёмная тема', Icon: Moon },
  { value: 'system', label: 'Системная тема', Icon: Laptop },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Тема интерфейса"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1"
    >
      {modes.map(({ value, label, Icon }) => (
        <Button
          key={value}
          type="button"
          size="icon"
          variant={theme === value ? 'secondary' : 'ghost'}
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          onClick={() => setTheme(value)}
          className="size-9 rounded-lg sm:size-10"
        >
          <Icon aria-hidden="true" className="size-4" />
        </Button>
      ))}
    </div>
  )
}
