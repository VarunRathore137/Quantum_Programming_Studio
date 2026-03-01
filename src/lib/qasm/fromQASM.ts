import { nanoid } from 'nanoid'
import type { CircuitState, Gate, GateType } from '@/types/circuit.types'

// Result type — never throws, returns typed error union
export type FromQASMResult =
   | { ok: true; circuit: Partial<CircuitState> }
   | { ok: false; error: string }

// QASM 2.0 gate name → GateType mapping
const GATE_MAP: Record<string, GateType> = {
   h: 'H',
   x: 'X',
   y: 'Y',
   z: 'Z',
   s: 'S',
   t: 'T',
   sdg: 'Sdg',
   tdg: 'Tdg',
   cx: 'CNOT',
   cz: 'CZ',
   swap: 'SWAP',
   ccx: 'Toffoli',
   rx: 'RX',
   ry: 'RY',
   rz: 'RZ',
   u3: 'U3',
   p: 'P',
}

/** Parses a qubit ref like `q[0]` → 0 */
function parseQubitRef(s: string): number {
   const m = s.match(/\[(\d+)\]/)
   if (!m) throw new Error(`Invalid qubit ref: ${s}`)
   return parseInt(m[1], 10)
}

/**
 * fromQASM — parse an OpenQASM 2.0 string into a partial CircuitState.
 *
 * AVOID: Does NOT parse QASM 3.0 syntax. Returns `{ ok: false }` on unknown gates
 * instead of throwing, to prevent unhandled rejections in the React event loop.
 */
export function fromQASM(qasm: string): FromQASMResult {
   try {
      // Strip block comments /* ... */
      let src = qasm.replace(/\/\*[\s\S]*?\*\//g, '')

      // Strip line comments // ...
      src = src
         .split('\n')
         .map(line => line.replace(/\/\/.*$/, '').trim())
         .join('\n')

      const lines = src.split('\n').map(l => l.trim()).filter(l => l.length > 0)

      let numQubits = 2 // default
      const gates: Gate[] = []
      let gateColumnIndex = 0

      for (const line of lines) {
         // Skip header / include / creg
         if (
            line.startsWith('OPENQASM') ||
            line.startsWith('include') ||
            line.startsWith('creg') ||
            line === ''
         ) {
            continue
         }

         // qreg declaration: qreg q[N];
         if (line.startsWith('qreg')) {
            const m = line.match(/qreg\s+\w+\[(\d+)\]/)
            if (m) numQubits = parseInt(m[1], 10)
            continue
         }

         // measure q[0] -> c[0];
         if (line.startsWith('measure')) {
            const m = line.match(/measure\s+\w+\[(\d+)\]\s*->\s*\w+\[(\d+)\]/)
            if (m) {
               gates.push({
                  id: nanoid(),
                  type: 'MEASURE',
                  qubits: [parseInt(m[1], 10)],
                  column: gateColumnIndex++,
               })
            }
            continue
         }

         // barrier
         if (line.startsWith('barrier')) {
            gates.push({ id: nanoid(), type: 'BARRIER', qubits: [], column: gateColumnIndex++ })
            continue
         }

         // Parametric gate: rx(1.5707963) q[0];
         const parametricMatch = line.match(/^(\w+)\(([^)]+)\)\s+(.+);$/)
         if (parametricMatch) {
            const [, name, paramStr, qubitStr] = parametricMatch
            const gateType = GATE_MAP[name.toLowerCase()]
            if (!gateType) {
               return { ok: false, error: `Unrecognized gate: ${name}` }
            }
            const qubitRefs = qubitStr.split(',').map(s => parseQubitRef(s.trim()))
            const angles = paramStr.split(',').map(s => parseFloat(s.trim()))
            gates.push({
               id: nanoid(),
               type: gateType,
               qubits: qubitRefs,
               column: gateColumnIndex++,
               params: {
                  theta: angles[0],
                  phi: angles[1],
                  lambda: angles[2],
               },
            })
            continue
         }

         // Standard gate: h q[0]; or cx q[0],q[1];
         const standardMatch = line.match(/^(\w+)\s+(.+);$/)
         if (standardMatch) {
            const [, name, qubitStr] = standardMatch
            const gateType = GATE_MAP[name.toLowerCase()]
            if (!gateType) {
               return { ok: false, error: `Unrecognized gate: ${name}` }
            }
            const qubitRefs = qubitStr.split(',').map(s => parseQubitRef(s.trim()))
            gates.push({
               id: nanoid(),
               type: gateType,
               qubits: qubitRefs,
               column: gateColumnIndex++,
            })
            continue
         }
      }

      return {
         ok: true,
         circuit: {
            numQubits,
            gates,
            numColumns: Math.max(gateColumnIndex, 1),
         },
      }
   } catch (err) {
      return { ok: false, error: String(err) }
   }
}
