import { create } from 'zustand'
import type { CircuitState, Gate } from '@/types/circuit.types'
import type { StorageAdapter } from '@/lib/storage/StorageAdapter'
import { toQASM2 } from '@/lib/qasm/toQASM2'
import { toQASM3 } from '@/lib/qasm/toQASM3'
import { toQiskit } from '@/lib/qasm/toQiskit'
import { nanoid } from 'nanoid'

// Import lazy to break any circular dep risk — accessed via .getState() only
import { useHistoryStore } from './historyStore'

interface CircuitStore extends CircuitState {
   // Actions
   addGate: (gate: Omit<Gate, 'id'>) => void
   removeGate: (id: string) => void
   updateGateParams: (id: string, params: Gate['params']) => void
   setNumQubits: (n: number) => void
   setNumColumns: (n: number) => void
   setGates: (gates: Gate[]) => void // used by QASM import + undo/redo
   // Export
   exportQASM2: () => string
   exportQASM3: () => string
   exportQiskit: () => string
   // In-memory circuit state setter (used to load an in-memory CircuitState snapshot)
   setCircuit: (state: CircuitState) => void
   resetCircuit: () => void
   // Persistence — inject adapter so the store stays testable and decoupled from Dexie
   saveProject: (adapter: StorageAdapter) => Promise<void>
   loadProject: (id: string, adapter: StorageAdapter) => Promise<boolean>
   listProjects: (adapter: StorageAdapter) => Promise<string[]>
}

const defaultCircuit: CircuitState = {
   id: nanoid(),
   numQubits: 3,
   numColumns: 8,
   metadata: {
      name: 'Untitled Circuit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
   },
   gates: [],
}

export const useCircuitStore = create<CircuitStore>((set, get) => ({
   ...defaultCircuit,
   addGate: (gate) => {
      const { gates, numQubits, numColumns } = get()
      useHistoryStore.getState().pushHistory({ gates, numQubits, numColumns })
      set(s => ({ gates: [...s.gates, { ...gate, id: nanoid() }] }))
   },
   removeGate: (id) => {
      const { gates, numQubits, numColumns } = get()
      useHistoryStore.getState().pushHistory({ gates, numQubits, numColumns })
      set(s => ({ gates: s.gates.filter(g => g.id !== id) }))
   },
   updateGateParams: (id, params) => {
      const { gates, numQubits, numColumns } = get()
      useHistoryStore.getState().pushHistory({ gates, numQubits, numColumns })
      set(s => ({
         gates: s.gates.map(g => g.id === id ? { ...g, params: { ...g.params, ...params } } : g)
      }))
   },
   setNumQubits: (n) => {
      const { gates, numQubits, numColumns } = get()
      useHistoryStore.getState().pushHistory({ gates, numQubits, numColumns })
      set({ numQubits: n })
   },
   setNumColumns: (n) => {
      const { gates, numQubits, numColumns } = get()
      useHistoryStore.getState().pushHistory({ gates, numQubits, numColumns })
      set({ numColumns: n })
   },
   setGates: (gates) => set({ gates }),
   exportQASM2: () => toQASM2(get()),
   exportQASM3: () => toQASM3(get()),
   exportQiskit: () => toQiskit(get()),
   setCircuit: (state) => {
      useHistoryStore.getState().clearHistory()
      set(state)
   },
   resetCircuit: () => {
      useHistoryStore.getState().clearHistory()
      set(defaultCircuit)
   },
   // Persistence — StorageAdapter is injected, never imported directly
   saveProject: async (adapter) => {
      const { id, metadata, numQubits, numColumns, gates } = get()
      await adapter.save(id, { id, metadata, numQubits, numColumns, gates })
   },
   loadProject: async (id, adapter) => {
      const data = await adapter.load(id)
      if (!data) return false
      useHistoryStore.getState().clearHistory()
      set(data as CircuitState)
      return true
   },
   listProjects: async (adapter) => adapter.list(),
}))
