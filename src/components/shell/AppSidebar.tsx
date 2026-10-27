import { useState } from 'react'
import {
  Laptop,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sun,
  X,
} from 'lucide-react'
import {
  navigation,
  type WorkspaceSection,
} from '@/components/shell/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useTheme } from '@/theme/theme-context'
import { ThemeToggle } from '@/theme/theme-toggle'

type NavigationProps = {
  active: WorkspaceSection
  onNavigate: (section: WorkspaceSection) => void
  onCreate: () => void
}

function SidebarTheme({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme()
  if (!collapsed) return <ThemeToggle />

  const modes = [
    { value: 'light', label: 'Светлая тема', Icon: Sun },
    { value: 'dark', label: 'Тёмная тема', Icon: Moon },
    { value: 'system', label: 'Системная тема', Icon: Laptop },
  ] as const

  return (
    <div
      role="group"
      aria-label="Тема интерфейса"
      className="flex flex-col gap-1"
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
        >
          <Icon aria-hidden="true" />
        </Button>
      ))}
    </div>
  )
}

function SidebarBody({
  active,
  collapsed,
  onNavigate,
  onCreate,
}: NavigationProps & { collapsed: boolean }) {
  return (
    <>
      <div
        className={`border-b border-border px-3 pb-5 ${collapsed ? 'pt-16' : 'pt-5'}`}
      >
        <div className="flex items-center gap-2 px-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold tracking-[-0.06em] text-primary-foreground">
            33.
          </span>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-[0.12em]">
              RECIPE
            </span>
          )}
        </div>
      </div>

      <nav aria-label="Основная навигация" className="flex-1 px-3 py-5">
        {!collapsed && (
          <p className="type-caption mb-3 px-3 uppercase tracking-[0.14em] text-muted-foreground">
            Рабочее пространство
          </p>
        )}
        <div className="space-y-1">
          {navigation.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-label={collapsed ? label : undefined}
              aria-current={active === id ? 'page' : undefined}
              title={collapsed ? label : undefined}
              onClick={() => onNavigate(id)}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground"
            >
              <Icon aria-hidden="true" className="size-[18px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </div>

        <div className="mt-7 border-t border-border pt-5">
          {!collapsed && (
            <p className="type-caption mb-3 px-3 uppercase tracking-[0.14em] text-muted-foreground">
              Создание
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCreate}
            aria-label={collapsed ? 'Новый рецепт' : undefined}
            className={collapsed ? 'size-11 p-0' : 'w-full justify-start'}
          >
            <Plus aria-hidden="true" />
            {!collapsed && 'Новый рецепт'}
          </Button>
          {!collapsed && (
            <p className="mt-2 px-3 text-xs leading-5 text-muted-foreground">
              Черновик сохранится в этом браузере.
            </p>
          )}
        </div>
      </nav>

      <div className="border-t border-border px-3 py-4">
        {!collapsed && (
          <p className="type-caption mb-3 px-3 text-muted-foreground">
            Тема интерфейса
          </p>
        )}
        <SidebarTheme collapsed={collapsed} />
        {!collapsed && (
          <p className="mt-4 px-3 text-xs text-muted-foreground">
            Personal Recipe Studio
          </p>
        )}
      </div>
    </>
  )
}

export function AppSidebar({
  active,
  collapsed,
  onCollapse,
  onNavigate,
  onCreate,
}: NavigationProps & { collapsed: boolean; onCollapse: () => void }) {
  return (
    <aside
      aria-label="Боковая панель"
      className={`sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-150 md:flex ${collapsed ? 'w-[76px]' : 'w-[232px]'}`}
    >
      <div className="absolute top-4 right-3">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
          onClick={onCollapse}
          className="size-9"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" />
          ) : (
            <PanelLeftClose aria-hidden="true" />
          )}
        </Button>
      </div>
      <SidebarBody
        active={active}
        collapsed={collapsed}
        onNavigate={onNavigate}
        onCreate={onCreate}
      />
    </aside>
  )
}

export function MobileNavigation({
  active,
  onNavigate,
  onCreate,
}: NavigationProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold tracking-[-0.06em] text-primary-foreground">
          33.
        </span>
        <span className="text-sm font-semibold tracking-[0.12em]">RECIPE</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Открыть меню"
          >
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(84vw,320px)] gap-0 overflow-y-auto p-0"
        >
          <SheetClose asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Закрыть меню"
              className="absolute top-3 right-3 z-10"
            >
              <X aria-hidden="true" />
            </Button>
          </SheetClose>
          <SheetHeader className="sr-only">
            <SheetTitle>Навигация 33 RECIPE</SheetTitle>
            <SheetDescription>Разделы рабочего пространства</SheetDescription>
          </SheetHeader>
          <SidebarBody
            active={active}
            collapsed={false}
            onNavigate={(next) => {
              onNavigate(next)
              setOpen(false)
            }}
            onCreate={() => {
              onCreate()
              setOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>
    </header>
  )
}
