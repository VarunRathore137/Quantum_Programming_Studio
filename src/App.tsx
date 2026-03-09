import { StorageContext } from '@/lib/storage/storageContext'
import { IndexedDBAdapter } from '@/lib/storage/IndexedDBAdapter'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectSidebar } from '@/components/sidebar/ProjectSidebar'
import { CircuitEditor } from '@/components/editor/CircuitEditor'

export default function App() {
  return (
    <StorageContext.Provider value={IndexedDBAdapter}>
      <AppShell
        sidebar={<ProjectSidebar />}
        main={<CircuitEditor />}
      />
    </StorageContext.Provider>
  )
}