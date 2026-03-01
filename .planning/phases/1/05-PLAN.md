---
phase: 1
plan: 5
wave: 4
depends_on: ["1.1", "1.2", "1.3"]
files_modified:
  - src/App.tsx
  - src/components/layout/AppShell.tsx
  - src/components/sidebar/ProjectSidebar.tsx
  - src/components/sidebar/ProjectSidebarItem.tsx
  - src/components/sidebar/NewProjectDialog.tsx
  - src/hooks/useProjectManager.ts
  - src/lib/storage/storageContext.ts
autonomous: false

must_haves:
  truths:
    - "User can type a project name and save it — name persists across page refresh"
    - "Sidebar lists all saved projects and clicking one loads it into the circuit store"
    - "User can create a new project with a name via the New Project dialog"
    - "App loads and shows the sidebar within 3 seconds (no waiting for circuit simulation)"
    - "Dark mode IDE aesthetic with sidebar on the left, main canvas area on the right"
  artifacts:
    - "src/components/layout/AppShell.tsx defines the 2-panel layout (sidebar + main)"
    - "src/components/sidebar/ProjectSidebar.tsx renders project list + New Project button"
    - "src/hooks/useProjectManager.ts encapsulates save/load/list/delete via StorageAdapter"
    - "src/lib/storage/storageContext.ts provides IndexedDBAdapter via React context"
  key_links:
    - "AppShell is the persistent layout shell all Phase 2+ panels live inside"
    - "ProjectSidebar satisfies UX-04 (save/load projects) and UX-05 (organize in sidebar)"

user_setup: []
---

# Plan 1.5: Project Sidebar + App Shell UI

<objective>
Build the app shell layout and the project sidebar — the permanent UI chrome that every subsequent phase will add panels into. Users can create, name, save, load, and see a list of their circuit projects.

Purpose: This plan closes UX-04 and UX-05, delivers the last Phase 1 success criteria, and establishes the layout scaffold Phase 2's visual circuit editor will slot into. A real user could open the app after this plan and do meaningful work (create + save + reload circuits).
Output: AppShell 2-panel layout, ProjectSidebar with CRUD, NewProjectDialog, useProjectManager hook.
</objective>

<context>
Load for context:
- .planning/REQUIREMENTS.md (UX-04, UX-05)
- .planning/DECISIONS.md (Decision 4: StorageAdapter pattern — sidebar never calls Dexie directly)
- src/store/circuitStore.ts (useCircuitStore — source of circuit state)
- src/lib/storage/IndexedDBAdapter.ts (adapter to inject via context)
- src/types/circuit.types.ts (CircuitState, CircuitProject types)
</context>

<tasks>

<task type="auto">
  <name>Build AppShell layout + StorageAdapter context provider</name>
  <files>
    src/lib/storage/storageContext.ts
    src/components/layout/AppShell.tsx
    src/App.tsx
  </files>
  <action>
    1. Create `src/lib/storage/storageContext.ts`:
    ```ts
    import { createContext, useContext } from 'react'
    import { IndexedDBAdapter } from './IndexedDBAdapter'
    import type { StorageAdapter } from './StorageAdapter'

    export const StorageContext = createContext<StorageAdapter>(IndexedDBAdapter)
    export const useStorage = () => useContext(StorageContext)
    // Wrap app with <StorageContext.Provider value={IndexedDBAdapter}> in App.tsx
    ```

    2. Create `src/components/layout/AppShell.tsx`:
    ```tsx
    import { ReactNode } from 'react'

    interface AppShellProps {
      sidebar: ReactNode
      main: ReactNode
    }

    export function AppShell({ sidebar, main }: AppShellProps) {
      return (
        <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
          <aside className="w-64 flex-shrink-0 border-r border-zinc-800 flex flex-col">
            {sidebar}
          </aside>
          <main className="flex-1 overflow-hidden flex flex-col">
            {main}
          </main>
        </div>
      )
    }
    ```

    3. Update `src/App.tsx` to wrap with StorageContext and render AppShell:
    ```tsx
    import { StorageContext } from '@/lib/storage/storageContext'
    import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter'
    import { AppShell } from '@/components/layout/AppShell'
    import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar'

    export default function App() {
      return (
        <StorageContext.Provider value={IndexedDBAdapter}>
          <AppShell
            sidebar={<ProjectSidebar />}
            main={<div className="flex-1 flex items-center justify-center text-zinc-500">Circuit editor coming in Phase 2</div>}
          />
        </StorageContext.Provider>
      )
    }
    ```
    AVOID: Do NOT render a loading spinner for the IndexedDB adapter — IndexedDB is always available synchronously in the browser. Loading states are for async data fetches, not the adapter itself.
  </action>
  <verify>
    `npm run dev` → open http://localhost:5173.
    App renders a 2-panel layout: left sidebar (dark, 256px wide), right main area (placeholder text visible).
    No console errors.
  </verify>
  <done>2-panel shell renders. Left sidebar visible. Right main shows placeholder. 0 console errors.</done>
</task>

<task type="auto">
  <name>Build ProjectSidebar with project CRUD + NewProjectDialog</name>
  <files>
    src/hooks/useProjectManager.ts
    src/components/sidebar/ProjectSidebar.tsx
    src/components/sidebar/ProjectSidebarItem.tsx
    src/components/sidebar/NewProjectDialog.tsx
  </files>
  <action>
    1. Create `src/hooks/useProjectManager.ts`:
    ```ts
    import { useCallback, useEffect, useState } from 'react'
    import { nanoid } from 'nanoid'
    import { useStorage } from '@/lib/storage/storageContext'
    import { useCircuitStore } from '@/store/circuitStore'
    import type { CircuitState } from '@/types/circuit.types'

    const PROJECT_LIST_KEY = '__project_list__'

    export function useProjectManager() {
      const adapter = useStorage()
      const store = useCircuitStore()
      const [projectIds, setProjectIds] = useState<string[]>([])
      const [loading, setLoading] = useState(true)

      const refreshList = useCallback(async () => {
        const raw = await adapter.load(PROJECT_LIST_KEY)
        setProjectIds(Array.isArray(raw) ? raw : [])
        setLoading(false)
      }, [adapter])

      useEffect(() => { refreshList() }, [refreshList])

      const saveCurrentProject = useCallback(async () => {
        await store.saveProject(adapter)
        const list = new Set(projectIds)
        list.add(store.id)
        const newList = [...list]
        await adapter.save(PROJECT_LIST_KEY, newList)
        setProjectIds(newList)
      }, [adapter, store, projectIds])

      const loadProject = useCallback(async (id: string) => {
        await store.loadProject(id, adapter)
      }, [adapter, store])

      const createNewProject = useCallback(async (name: string) => {
        store.resetCircuit()
        // Generate new ID for the reset circuit
        const newId = nanoid()
        useCircuitStore.setState(s => ({ ...s, id: newId, metadata: { ...s.metadata, name } }))
        await saveCurrentProject()
      }, [saveCurrentProject, store])

      const deleteProject = useCallback(async (id: string) => {
        await adapter.delete(id)
        const newList = projectIds.filter(p => p !== id)
        await adapter.save(PROJECT_LIST_KEY, newList)
        setProjectIds(newList)
      }, [adapter, projectIds])

      return { projectIds, loading, saveCurrentProject, loadProject, createNewProject, deleteProject, refreshList }
    }
    ```

    2. Create `src/components/sidebar/NewProjectDialog.tsx` (shadcn/ui Dialog):
    ```tsx
    import { useState } from 'react'
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
    import { Button } from '@/components/ui/button'
    import { Input } from '@/components/ui/input'

    interface NewProjectDialogProps {
      open: boolean
      onOpenChange: (open: boolean) => void
      onCreate: (name: string) => void
    }

    export function NewProjectDialog({ open, onOpenChange, onCreate }: NewProjectDialogProps) {
      const [name, setName] = useState('')
      const handleCreate = () => {
        if (!name.trim()) return
        onCreate(name.trim())
        setName('')
        onOpenChange(false)
      }
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="bg-zinc-900 border-zinc-700">
            <DialogHeader><DialogTitle>New Circuit Project</DialogTitle></DialogHeader>
            <Input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="My Quantum Circuit"
              className="bg-zinc-800 border-zinc-600"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }
    ```

    3. Create `src/components/sidebar/ProjectSidebarItem.tsx`:
    A single project item row with name, load-on-click, and a delete icon button.
    Show project name (load from store if id matches active) or just the ID truncated.
    Use `lucide-react` Trash2 icon for delete button (install `lucide-react`).

    4. Create `src/components/sidebar/ProjectSidebar.tsx`:
    - Header: "Quantum Studio" title + version chip
    - "New Project" button (opens NewProjectDialog)
    - "Save" button (triggers saveCurrentProject)
    - List of ProjectSidebarItems (one per projectId)
    - Loading skeleton (3 gray placeholder bars) while `loading === true`
    - Import shadcn/ui Button, use lucide-react Plus and Save icons

    Run: `npx shadcn@latest add dialog input` to install required shadcn/ui components.
    Install `lucide-react` as a dependency.
    AVOID: Do NOT store the full CircuitState in the project list key — only store IDs. Full circuit data is stored separately by project ID. This avoids the list growing unbounded.
    AVOID: Do NOT use React.memo on sidebar items yet — premature optimization. Add only if profiling shows a problem.
  </action>
  <verify>
    Manual verification in browser (http://localhost:5173):
    1. Click "New Project" → dialog opens → type "Bell State Test" → click Create
    2. Sidebar shows "Bell State Test" entry
    3. Refresh page → "Bell State Test" entry still shows in sidebar (survived reload)
    4. Click the project entry → circuit loads (store.metadata.name updates to "Bell State Test")
    5. Click delete (Trash2 icon) on the entry → entry removed from sidebar
    6. Sidebar "Save" button → no errors in console
  </verify>
  <done>
    Project CRUD works in browser. Sidebar survives page refresh. Active project name shows in sidebar.
    Phase 1 Success Criteria 1 (Vite + React 19 deployable) and 4 (project name persists) are met.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Full Phase 1 visual + functional verification</name>
  <files></files>
  <action>
    Open http://localhost:5173 and verify:
    1. ✅ Dark IDE aesthetic — near-black background, zinc-tone sidebar border
    2. ✅ Left sidebar: "Quantum Studio" title, "New Project" button, "Save" button
    3. ✅ Create a project named "Bell State" → appears in list → refresh page → still there
    4. ✅ Click the project → it becomes active (no visual editor yet, but no errors thrown)
    5. ✅ Delete the project → removal confirmed from sidebar

    Then run: `npm run build` — must complete with 0 TypeScript errors.
    Then run: `npm test -- --run` — all QASM + fromQASM tests still pass.
  </action>
  <verify>`npm run build` exits 0. `npm test -- --run` exits 0. Browser UI shows project CRUD working.</verify>
  <done>All Phase 1 success criteria are met. Phase 1 is complete. Ready for Phase 2 planning.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0 — no TypeScript errors
- [ ] `npm test -- --run` passes all tests
- [ ] Sidebar renders with dark theme, matches IDE aesthetic
- [ ] Project name persists across page refresh (IndexedDB confirmed working)
- [ ] loadProject/saveProject/deleteProject all work without console errors
- [ ] AppShell 2-panel layout is responsive to viewport height
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] All 5 Phase 1 success criteria met:
  - [ ] 1. Vite + React 19 + TypeScript scaffolded and buildable ✓ (Plan 1.1)
  - [ ] 2. CircuitStore serializes to valid OpenQASM ✓ (Plan 1.2)
  - [ ] 3. Importing QASM re-creates circuit in store ✓ (Plan 1.3)
  - [ ] 4. Project name persists across refresh ✓ (Plan 1.5)
  - [ ] 5. FastAPI /health endpoint live on Railway ✓ (Plan 1.4)
</success_criteria>
