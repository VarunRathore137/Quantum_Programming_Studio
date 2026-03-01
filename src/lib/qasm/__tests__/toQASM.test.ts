import { describe, it, expect } from 'vitest'
import { toQASM2 } from '../toQASM2'
import { toQASM3 } from '../toQASM3'
import type { CircuitState } from '@/types/circuit.types'

// Helper to build a minimal circuit
const makeCircuit = (g: CircuitState['gates'], nq = 2): CircuitState => ({
   id: 'test', numQubits: nq, numColumns: 4,
   metadata: { name: 'Test', createdAt: '', updatedAt: '' },
   gates: g
})

describe('toQASM2', () => {
   it('produces valid QASM 2.0 header for empty circuit', () => {
      const out = toQASM2(makeCircuit([]))
      expect(out).toContain('OPENQASM 2.0')
      expect(out).toContain('include "qelib1.inc"')
      expect(out).toContain('qreg q[2]')
      expect(out).toContain('creg c[2]')
   })
   it('serializes single-qubit H gate: h q[0];', () => {
      const out = toQASM2(makeCircuit([{ id: '1', type: 'H', qubits: [0], column: 0 }]))
      expect(out).toContain('h q[0];')
   })
   it('serializes CNOT gate: cx q[0],q[1];', () => {
      const out = toQASM2(makeCircuit([{ id: '1', type: 'CNOT', qubits: [0, 1], column: 0 }]))
      expect(out).toContain('cx q[0],q[1];')
   })
   it('serializes RX gate with angle: rx(1.5707963267948966) q[0];', () => {
      const out = toQASM2(makeCircuit([{ id: '1', type: 'RX', qubits: [0], column: 0, params: { theta: Math.PI / 2 } }]))
      expect(out).toContain('rx(1.5707963267948966) q[0];')
   })
   it('serializes MEASURE: measure q[0] -> c[0];', () => {
      const out = toQASM2(makeCircuit([{ id: '1', type: 'MEASURE', qubits: [0], column: 1 }]))
      expect(out).toContain('measure q[0] -> c[0];')
   })
})

describe('toQASM3', () => {
   it('produces valid QASM 3.0 header', () => {
      const out = toQASM3(makeCircuit([]))
      expect(out).toContain('OPENQASM 3;')
      expect(out).toContain('qubit[2] q;')
   })
   it('serializes H gate in QASM 3.0 syntax: h q[0];', () => {
      const out = toQASM3(makeCircuit([{ id: '1', type: 'H', qubits: [0], column: 0 }]))
      expect(out).toContain('h q[0];')
   })
})
