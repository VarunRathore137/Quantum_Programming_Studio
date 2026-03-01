import { describe, it, expect } from 'vitest'
import { fromQASM } from '../fromQASM'

const header = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\n'

describe('fromQASM', () => {
   it('parses numQubits from qreg declaration', () => {
      const r = fromQASM(header)
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.circuit.numQubits).toBe(2)
   })

   it('parses H gate', () => {
      const r = fromQASM(header + 'h q[0];')
      expect(r.ok && r.circuit.gates?.[0].type).toBe('H')
   })

   it('parses CNOT gate with control and target', () => {
      const r = fromQASM(header + 'cx q[0],q[1];')
      expect(r.ok && r.circuit.gates?.[0]).toMatchObject({ type: 'CNOT', qubits: [0, 1] })
   })

   it('parses RX gate with angle param', () => {
      const r = fromQASM(header + 'rx(1.5707963267948966) q[0];')
      expect(r.ok && r.circuit.gates?.[0].params?.theta).toBeCloseTo(Math.PI / 2)
   })

   it('returns ok:false for unknown gate', () => {
      const r = fromQASM(header + 'foo q[0];')
      expect(r.ok).toBe(false)
   })

   it('parses MEASURE gate', () => {
      const r = fromQASM(header + 'measure q[0] -> c[0];')
      expect(r.ok && r.circuit.gates?.[0]).toMatchObject({ type: 'MEASURE', qubits: [0] })
   })
})
