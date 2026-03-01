import { create } from 'zustand'
import type { CircuitState, Gate } from '@/types/circuit.types'
import { toQASM2 } from '@/lib/qasm/toQASM2'
import { toQASM3 } from '@/lib/qasm/toQASM3'
import { toQiskit } from '@/lib/qasm/toQiskit'
import { nanoid } from 'nanoid'

interface CircuitStore extends CircuitState {
   // Actions
   addGate: (gate: Omit<Gate, 'id'>) => void
   removeGate: (id: string) => void
   setNumQubits: (n: number) => void
   setNumColumns: (n: number) => void
   setGates: (gates: Gate[]) => void  // used by QASM import
   // Export
   exportQASM2: () => string
   exportQASM3: () => string
   exportQiskit: () => string
   // Project
   loadProject: (state: CircuitState) => void
   resetCircuit: () => void
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
   addGate: (gate) => set(s => ({ gates: [...s.gates, { ...gate, id: nanoid() }] })),
   removeGate: (id) => set(s => ({ gates: s.gates.filter(g => g.id !== id) })),
   setNumQubits: (n) => set({ numQubits: n }),
   setNumColumns: (n) => set({ numColumns: n }),
   setGates: (gates) => set({ gates }),
   exportQASM2: () => toQASM2(get()),
   exportQASM3: () => toQASM3(get()),
   exportQiskit: () => toQiskit(get()),
   loadProject: (state) => set(state),
   resetCircuit: () => set(defaultCircuit),
}))
