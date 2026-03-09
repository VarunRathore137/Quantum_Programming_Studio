import type { GateType } from '@/types/circuit.types'

export interface GateDefinition {
   type: GateType
   label: string          // short symbol: "H", "X", "CX"
   name: string           // full name: "Hadamard", "Pauli-X", "CNOT"
   category: 'single' | 'two-qubit' | 'parametric' | 'measurement'
   beginner: boolean      // show in beginner palette?
   numQubits: number      // 1 or 2 (for validation in drop zone)
   defaultParams?: { theta?: number; phi?: number; lambda?: number }
   description: string    // tooltip text
}

export const GATE_DEFINITIONS: GateDefinition[] = [
   // === SINGLE QUBIT (Beginner) ===
   { type: 'H', label: 'H', name: 'Hadamard', category: 'single', beginner: true, numQubits: 1, description: 'Creates equal superposition' },
   { type: 'X', label: 'X', name: 'Pauli-X', category: 'single', beginner: true, numQubits: 1, description: 'Bit flip (NOT gate)' },
   { type: 'Y', label: 'Y', name: 'Pauli-Y', category: 'single', beginner: false, numQubits: 1, description: 'Bit + phase flip' },
   { type: 'Z', label: 'Z', name: 'Pauli-Z', category: 'single', beginner: true, numQubits: 1, description: 'Phase flip' },
   { type: 'S', label: 'S', name: 'S Gate', category: 'single', beginner: false, numQubits: 1, description: '√Z phase gate' },
   { type: 'T', label: 'T', name: 'T Gate', category: 'single', beginner: false, numQubits: 1, description: 'π/8 phase gate' },
   { type: 'Sdg', label: 'S†', name: 'S-Dagger', category: 'single', beginner: false, numQubits: 1, description: 'Inverse S gate' },
   { type: 'Tdg', label: 'T†', name: 'T-Dagger', category: 'single', beginner: false, numQubits: 1, description: 'Inverse T gate' },
   // === TWO-QUBIT (Beginner: CNOT only) ===
   { type: 'CNOT', label: 'CX', name: 'CNOT', category: 'two-qubit', beginner: true, numQubits: 2, description: 'Controlled-NOT (entangling)' },
   { type: 'CZ', label: 'CZ', name: 'Ctrl-Z', category: 'two-qubit', beginner: false, numQubits: 2, description: 'Controlled-Phase flip' },
   { type: 'SWAP', label: '⇌', name: 'SWAP', category: 'two-qubit', beginner: false, numQubits: 2, description: 'Exchange two qubits' },
   { type: 'Toffoli', label: 'CCX', name: 'Toffoli', category: 'two-qubit', beginner: false, numQubits: 3, description: 'Controlled-Controlled-NOT' },
   // === PARAMETRIC ===
   { type: 'RX', label: 'Rx', name: 'RX', category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 2 }, description: 'X-axis rotation by θ' },
   { type: 'RY', label: 'Ry', name: 'RY', category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 2 }, description: 'Y-axis rotation by θ' },
   { type: 'RZ', label: 'Rz', name: 'RZ', category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 2 }, description: 'Z-axis rotation by θ' },
   { type: 'U3', label: 'U', name: 'U3', category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: 0, phi: 0, lambda: 0 }, description: 'General single-qubit gate (θ, φ, λ)' },
   { type: 'P', label: 'P', name: 'Phase', category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 4 }, description: 'Phase gate by θ' },
   // === MEASUREMENT ===
   { type: 'MEASURE', label: '⊗', name: 'Measure', category: 'measurement', beginner: true, numQubits: 1, description: 'Measure qubit in Z basis' },
   { type: 'BARRIER', label: '|', name: 'Barrier', category: 'measurement', beginner: false, numQubits: 1, description: 'Circuit barrier (timing marker)' },
]

export const BEGINNER_GATES = GATE_DEFINITIONS.filter(g => g.beginner)

export const ADVANCED_GATE_CATEGORIES: Record<string, GateDefinition[]> = {
   'Single Qubit': GATE_DEFINITIONS.filter(g => g.category === 'single'),
   'Two Qubit': GATE_DEFINITIONS.filter(g => g.category === 'two-qubit'),
   'Parametric': GATE_DEFINITIONS.filter(g => g.category === 'parametric'),
   'Measurement': GATE_DEFINITIONS.filter(g => g.category === 'measurement'),
}

export function getGateDefinition(type: GateType): GateDefinition | undefined {
   return GATE_DEFINITIONS.find(g => g.type === type)
}
