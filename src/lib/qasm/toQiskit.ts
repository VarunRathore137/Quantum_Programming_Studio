import type { CircuitState, Gate, GateType } from '@/types/circuit.types'

// Map GateType -> Qiskit method name (lowercase)
const GATE_MAP: Partial<Record<GateType, string>> = {
   H: 'h', X: 'x', Y: 'y', Z: 'z',
   S: 's', T: 't', Sdg: 'sdg', Tdg: 'tdg',
   CNOT: 'cx', CZ: 'cz', SWAP: 'swap', Toffoli: 'ccx',
   RX: 'rx', RY: 'ry', RZ: 'rz', U3: 'u', P: 'p',
}

const PARAMETRIC_GATES = new Set<GateType>(['RX', 'RY', 'RZ', 'P'])
const U3_GATE: GateType = 'U3'

function serializeGate(gate: Gate): string {
   const { type, qubits, params } = gate

   if (type === 'MEASURE') {
      return 'qc.measure(' + qubits[0] + ', ' + qubits[0] + ')'
   }

   if (type === 'BARRIER') {
      return 'qc.barrier()'
   }

   const method = GATE_MAP[type]
   if (!method) return '# unsupported gate: ' + type

   if (type === U3_GATE) {
      const theta = params?.theta ?? 0
      const phi = params?.phi ?? 0
      const lambda = params?.lambda ?? 0
      return 'qc.u(' + theta + ', ' + phi + ', ' + lambda + ', ' + qubits[0] + ')'
   }

   if (PARAMETRIC_GATES.has(type)) {
      const angle = params?.theta ?? 0
      return 'qc.' + method + '(' + angle + ', ' + qubits[0] + ')'
   }

   if (qubits.length === 3) {
      return 'qc.' + method + '(' + qubits[0] + ', ' + qubits[1] + ', ' + qubits[2] + ')'
   }

   if (qubits.length === 2) {
      return 'qc.' + method + '(' + qubits[0] + ', ' + qubits[1] + ')'
   }

   return 'qc.' + method + '(' + qubits[0] + ')'
}

export function toQiskit(circuit: CircuitState): string {
   const { numQubits, gates } = circuit
   const sorted = [...gates].sort((a, b) => a.column - b.column)

   const lines: string[] = [
      'from qiskit import QuantumCircuit',
      'from qiskit.circuit.library import *',
      '',
      'qc = QuantumCircuit(' + numQubits + ', ' + numQubits + ')',
      '',
   ]

   for (const gate of sorted) {
      lines.push(serializeGate(gate))
   }

   lines.push('')
   lines.push('print(qc.draw())')

   return lines.join('\n')
}
