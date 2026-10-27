import { useState } from 'react'
import { AppSidebar, MobileNavigation } from '@/components/shell/AppSidebar'
import { EditorWorkspace } from '@/components/shell/EditorWorkspace'
import { PreviewPanel } from '@/components/shell/PreviewPanel'
import { WorkspacePage } from '@/components/shell/WorkspacePage'
import type { WorkspaceSection } from '@/components/shell/navigation'
import { Button } from '@/components/ui/button'

type WorkspacePanel = 'editor' | 'preview'

function App() {
  const [section, setSection] = useState<WorkspaceSection>('editor')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [panel, setPanel] = useState<WorkspacePanel>('editor')

  const navigate = (next: WorkspaceSection) => {
    setSection(next)
    if (next === 'editor') setPanel('editor')
  }

  return (
    <div className="flex min-h-svh min-w-0 bg-background text-foreground">
      <AppSidebar
        active={section}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((current) => !current)}
        onNavigate={navigate}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNavigation active={section} onNavigate={navigate} />

        {section === 'editor' ? (
          <>
            <div
              role="group"
              aria-label="Панель рабочего пространства"
              className="flex gap-1 border-b border-border px-4 py-3 md:px-8 xl:hidden"
            >
              <Button
                type="button"
                variant={panel === 'editor' ? 'secondary' : 'ghost'}
                aria-pressed={panel === 'editor'}
                onClick={() => setPanel('editor')}
                className="min-w-0 flex-1"
              >
                Редактор
              </Button>
              <Button
                type="button"
                variant={panel === 'preview' ? 'secondary' : 'ghost'}
                aria-pressed={panel === 'preview'}
                onClick={() => setPanel('preview')}
                className="min-w-0 flex-1"
              >
                Предпросмотр
              </Button>
            </div>

            <div className="min-w-0 flex-1 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(350px,38%)]">
              <div className={panel === 'preview' ? 'hidden xl:block' : ''}>
                <EditorWorkspace />
              </div>
              <div className={panel === 'editor' ? 'hidden xl:block' : ''}>
                <PreviewPanel />
              </div>
            </div>
          </>
        ) : (
          <WorkspacePage section={section} />
        )}
      </div>
    </div>
  )
}

export default App
