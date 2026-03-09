import { create } from 'zustand'
import { useEffect } from 'react'
import type { Gate } from '@/types/circuit.types'

const MAX_HISTORY = 50

export interface HistoryEntry {
   gates: Gate[]
   numQubits: number
   numColumns: number
}

interface HistoryStore {
   past: HistoryEntry[]
   future: HistoryEntry[]
   pushHistory: (entry: HistoryEntry) => void
   undo: () => HistoryEntry | null
   redo: () => HistoryEntry | null
   clearHistory: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
   past: [],
   future: [],
   pushHistory: (entry) =>
      set(s => ({
         past: [...s.past, entry].slice(-MAX_HISTORY),
         future: [], // clear redo on new action
      })),
   undo: () => {
      const { past, future } = get()
      if (past.length === 0) return null
      const prev = past[past.length - 1]
      set({ past: past.slice(0, -1), future: [prev, ...future] })
      return prev
   },
   redo: () => {
      const { past, future } = get()
      if (future.length === 0) return null
      const next = future[0]
      set({ past: [...past, next], future: future.slice(1) })
      return next
   },
   clearHistory: () => set({ past: [], future: [] }),
}))

/** Hook for keyboard shortcuts — call once in CircuitControls.
 *  Accepts callbacks to avoid circular import with circuitStore. */
export function useUndoRedoKeyboard(opts: {
   onUndo: () => void
   onRedo: () => void
}) {
   const { onUndo, onRedo } = opts
   useEffect(() => {
      const handler = (e: KeyboardEvent) => {
         if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault()
            onUndo()
         }
         if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault()
            onRedo()
         }
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
   }, [onUndo, onRedo])
}
