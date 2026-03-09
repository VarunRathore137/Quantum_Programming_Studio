import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { useStorage } from '@/lib/storage/storageContext'
import { useCircuitStore } from '@/store/circuitStore'

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
