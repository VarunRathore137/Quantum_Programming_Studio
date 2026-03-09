import { StorageContext } from '@/lib/storage/storageContext'
import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar'

export default function App() {
  return (
    <StorageContext.Provider value={IndexedDBAdapter}>
      <AppShell
        sidebar={<ProjectSidebar />}
        main={
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            Circuit editor coming in Phase 2
          </div>
        }
      />
    </StorageContext.Provider>
  )
}