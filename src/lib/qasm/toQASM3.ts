import type { CircuitState, Gate, GateType } from '@/types/circuit.types'

// Map GateType -> QASM 3.0 instruction name (same as 2.0 except declarations differ)
const GATE_MAP: Partial<Record<GateType, string>> = {
   H: 'h', X: 'x', Y: 'y', Z: 'z',
   S: 's', T: 't', Sdg: 'sdg', Tdg: 'tdg',
   CNOT: 'cx', CZ: 'cz', SWAP: 'swap', Toffoli: 'ccx',
   RX: 'rx', RY: 'ry', RZ: 'rz', U3: 'u3', P: 'p',
}

const PARAMETRIC_GATES = new Set<GateType>(['RX', 'RY', 'RZ', 'P'])
const U3_GATE: GateType = 'U3'

function serializeGate(gate: Gate): string {
   const { type, qubits, params } = gate

   if (type === 'MEASURE') {
      // QASM 3.0 measurement syntax
      return 'c[' + qubits[0] + '] = measure q[' + qubits[0] + '];'
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

   if (qubits.length === 2) {
      return name + ' q[' + qubits[0] + '],q[' + qubits[1] + '];'
   }

   if (qubits.length === 3) {
      return name + ' q[' + qubits[0] + '],q[' + qubits[1] + '],q[' + qubits[2] + '];'
   }

   return name + ' q[' + qubits[0] + '];'
}

export function toQASM3(circuit: CircuitState): string {
   const { numQubits, gates } = circuit
   const sorted = [...gates].sort((a, b) => a.column - b.column)

   const lines: string[] = [
      'OPENQASM 3;',
      '',
      'qubit[' + numQubits + '] q;',
      'bit[' + numQubits + '] c;',
      '',
   ]

   for (const gate of sorted) {
      lines.push(serializeGate(gate))
   }

   return lines.join('\n')
}
