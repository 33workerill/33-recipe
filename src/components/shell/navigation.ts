import { BookOpenText, Clock3, LayoutTemplate, Settings2 } from 'lucide-react'

export type WorkspaceSection = 'editor' | 'recipes' | 'recent' | 'settings'

export const navigation = [
  { id: 'editor', label: 'Редактор', Icon: LayoutTemplate },
  { id: 'recipes', label: 'Мои рецепты', Icon: BookOpenText },
  { id: 'recent', label: 'Недавние', Icon: Clock3 },
  { id: 'settings', label: 'Настройки', Icon: Settings2 },
] as const
