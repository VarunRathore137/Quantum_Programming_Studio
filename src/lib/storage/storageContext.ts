import { createContext, useContext } from 'react'
import { IndexedDBAdapter } from './IndexedDBAdapter'
import type { StorageAdapter } from './StorageAdapter'

export const StorageContext = createContext<StorageAdapter>(IndexedDBAdapter)
export const useStorage = () => useContext(StorageContext)
// Wrap app with <StorageContext.Provider value={IndexedDBAdapter}> in App.tsx
