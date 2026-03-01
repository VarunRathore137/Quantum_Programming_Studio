import Dexie, { type EntityTable } from 'dexie'
import type { StorageAdapter } from './StorageAdapter'

interface StoredItem {
   key: string
   data: unknown
}

class AppDB extends Dexie {
   items!: EntityTable<StoredItem, 'key'>

   constructor() {
      super('QuantumStudioDB')
      this.version(1).stores({ items: 'key' })
   }
}

const db = new AppDB()

export const IndexedDBAdapter: StorageAdapter = {
   save: async (key, data) => {
      await db.items.put({ key, data })
   },
   load: async (key) => {
      const r = await db.items.get(key)
      return r?.data ?? null
   },
   delete: async (key) => {
      await db.items.delete(key)
   },
   list: async () => {
      const all = await db.items.toArray()
      return all.map(r => r.key)
   },
}
