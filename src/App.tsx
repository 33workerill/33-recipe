import { useState } from 'react'
import { AppSidebar, MobileNavigation } from '@/components/shell/AppSidebar'
import { EditorWorkspace } from '@/components/shell/EditorWorkspace'
import { PreviewPanel } from '@/components/shell/PreviewPanel'
import { WorkspacePage } from '@/components/shell/WorkspacePage'
import type { WorkspaceSection } from '@/components/shell/navigation'
import { Button } from '@/components/ui/button'
import { NumericValidityContext } from '@/components/shell/numeric-validity-context'
import { useRecipeWorkspace } from '@/features/recipes/data/use-recipe-workspace'

type WorkspacePanel = 'editor' | 'preview'

function App() {
  const [section, setSection] = useState<WorkspaceSection>('editor')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [panel, setPanel] = useState<WorkspacePanel>('editor')
  const workspace = useRecipeWorkspace()

  const navigate = (next: WorkspaceSection) => {
    void workspace
      .prepareSwitch()
      .then(() => {
        setSection(next)
        if (next === 'editor') setPanel('editor')
      })
      .catch(workspace.reportError)
  }

  const create = () => {
    void workspace
      .create()
      .then(() => {
        setSection('editor')
        setPanel('editor')
      })
      .catch(workspace.reportError)
  }

  const open = (id: string) => {
    void workspace
      .open(id)
      .then(() => {
        setSection('editor')
        setPanel('editor')
      })
      .catch(workspace.reportError)
  }

  const duplicate = (id: string) => {
    void workspace
      .duplicate(id)
      .then(() => {
        setSection('editor')
        setPanel('editor')
      })
      .catch(workspace.reportError)
  }

  return (
    <div className="flex min-h-svh min-w-0 bg-background text-foreground">
      <AppSidebar
        active={section}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((current) => !current)}
        onNavigate={navigate}
        onCreate={create}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNavigation
          active={section}
          onNavigate={navigate}
          onCreate={create}
        />

        {workspace.error && section !== 'editor' && (
          <div
            role="alert"
            className="border-b border-destructive/40 bg-destructive/5 px-5 py-3 text-sm text-destructive"
          >
            {workspace.error}
          </div>
        )}

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
                <NumericValidityContext.Provider
                  value={workspace.setInputValidity}
                >
                  <EditorWorkspace
                    key={workspace.current?.recipe.id ?? 'empty'}
                    recipe={workspace.current?.recipe ?? null}
                    status={workspace.status}
                    error={workspace.error}
                    onChange={workspace.edit}
                    onSave={() => {
                      void workspace.flush().catch(() => undefined)
                    }}
                    onCreate={create}
                  />
                </NumericValidityContext.Provider>
              </div>
              <div className={panel === 'editor' ? 'hidden xl:block' : ''}>
                <PreviewPanel />
              </div>
            </div>
          </>
        ) : (
          <WorkspacePage
            section={section}
            recipes={workspace.recipes}
            recentIds={workspace.recentIds}
            loading={workspace.loading}
            onCreate={create}
            onOpen={open}
            onDuplicate={duplicate}
            onDelete={(item) => {
              void workspace.remove(item).catch(workspace.reportError)
            }}
            onExport={workspace.exportBackup}
            onImport={workspace.importBackup}
          />
        )}
      </div>
    </div>
  )
}

export default App
