import type { CircuitState, Gate, GateType } from '@/types/circuit.types'

// Map GateType -> QASM 2.0 instruction name
const GATE_MAP: Partial<Record<GateType, string>> = {
   H: 'h', X: 'x', Y: 'y', Z: 'z',
   S: 's', T: 't', Sdg: 'sdg', Tdg: 'tdg',
   CNOT: 'cx', CZ: 'cz', SWAP: 'swap', Toffoli: 'ccx',
   RX: 'rx', RY: 'ry', RZ: 'rz', U3: 'u3', P: 'p',
}

// Parametric gates that take angle arguments
const PARAMETRIC_GATES = new Set<GateType>(['RX', 'RY', 'RZ', 'P'])
const U3_GATE: GateType = 'U3'

function serializeGate(gate: Gate): string {
   const { type, qubits, params } = gate

   if (type === 'MEASURE') {
      return 'measure q[' + qubits[0] + '] -> c[' + qubits[0] + '];'
   }

   if (type === 'BARRIER') {
      return 'barrier ' + qubits.map(q => 'q[' + q + ']').join(',') + ';'
   }

   const name = GATE_MAP[type]
   if (!name) return '// unsupported gate: ' + type

   if (type === U3_GATE) {
      const theta = params?.theta ?? 0
      const phi = params?.phi ?? 0
      const lambda = params?.lambda ?? 0
      return 'u3(' + theta + ',' + phi + ',' + lambda + ') q[' + qubits[0] + '];'
   }

   if (PARAMETRIC_GATES.has(type)) {
      const angle = params?.theta ?? 0
      return name + '(' + angle + ') q[' + qubits[0] + '];'
   }

   // Two-qubit gates
   if (qubits.length === 2) {
      return name + ' q[' + qubits[0] + '],q[' + qubits[1] + '];'
   }

   // Three-qubit (Toffoli)
   if (qubits.length === 3) {
      return name + ' q[' + qubits[0] + '],q[' + qubits[1] + '],q[' + qubits[2] + '];'
   }

   // Single-qubit
   return name + ' q[' + qubits[0] + '];'
}

export function toQASM2(circuit: CircuitState): string {
   const { numQubits, gates } = circuit
   const sorted = [...gates].sort((a, b) => a.column - b.column)

   const lines: string[] = [
      'OPENQASM 2.0;',
      'include "qelib1.inc";',
      '',
      'qreg q[' + numQubits + '];',
      'creg c[' + numQubits + '];',
      '',
   ]

   for (const gate of sorted) {
      lines.push(serializeGate(gate))
   }

   return lines.join('\n')
}
