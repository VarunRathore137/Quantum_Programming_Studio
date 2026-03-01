import { describe, it, expect } from 'vitest'
import { toQiskit } from '../toQiskit'
import type { CircuitState } from '@/types/circuit.types'

const makeCircuit = (g: CircuitState['gates'], nq = 2): CircuitState => ({
   id: 'test', numQubits: nq, numColumns: 4,
   metadata: { name: 'Test', createdAt: '', updatedAt: '' },
   gates: g
})

describe('toQiskit', () => {
   it('produces valid Qiskit Python boilerplate for empty circuit', () => {
      const out = toQiskit(makeCircuit([]))
      expect(out).toContain('from qiskit import QuantumCircuit')
      expect(out).toContain('qc = QuantumCircuit(2, 2)')
      expect(out).toContain('print(qc.draw())')
   })
   it('serializes H gate: qc.h(0)', () => {
      const out = toQiskit(makeCircuit([{ id: '1', type: 'H', qubits: [0], column: 0 }]))
      expect(out).toContain('qc.h(0)')
   })
   it('serializes CNOT gate: qc.cx(0, 1)', () => {
      const out = toQiskit(makeCircuit([{ id: '1', type: 'CNOT', qubits: [0, 1], column: 0 }]))
      expect(out).toContain('qc.cx(0, 1)')
   })
   it('serializes RX gate with angle: qc.rx(1.5707963267948966, 0)', () => {
      const out = toQiskit(makeCircuit([{ id: '1', type: 'RX', qubits: [0], column: 0, params: { theta: Math.PI / 2 } }]))
      expect(out).toContain('qc.rx(1.5707963267948966, 0)')
   })
   it('serializes MEASURE: qc.measure(0, 0)', () => {
      const out = toQiskit(makeCircuit([{ id: '1', type: 'MEASURE', qubits: [0], column: 1 }]))
      expect(out).toContain('qc.measure(0, 0)')
   })
})
