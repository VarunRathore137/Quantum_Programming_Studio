import type { CircuitState } from '../../types/circuit.types'
import { getGateDefinition } from '../gates/gateDefinitions'

export type LintError = {
   gateId: string
   code: string
   message: string
}

export function validateCircuit(circuit: CircuitState): LintError[] {
   const errors: LintError[] = []
   const occupied = new Set<string>()

   for (const gate of circuit.gates) {
      // 1. Qubit bounds
      if (gate.qubits.some(q => q >= circuit.numQubits)) {
         errors.push({
            gateId: gate.id,
            code: 'QUBIT_OUT_OF_RANGE',
            message: `Gate accesses qubit index out of bounds (${circuit.numQubits} max).`
         })
      }

      // 2. Column bounds
      if (gate.column >= circuit.numColumns) {
         errors.push({
            gateId: gate.id,
            code: 'COLUMN_OUT_OF_RANGE',
            message: `Gate placed beyond maximum circuit depth (${circuit.numColumns}).`
         })
      }

      // 3. Column conflict
      for (const q of gate.qubits) {
         const key = `q${q}_c${gate.column}`
         if (occupied.has(key)) {
            errors.push({
               gateId: gate.id,
               code: 'COLUMN_CONFLICT',
               message: `Multiple gates cannot occupy qubit ${q} at column ${gate.column}.`
            })
         } else {
            occupied.add(key)
         }
      }

      // 4. Missing angle
      const def = getGateDefinition(gate.type)
      if (def?.category === 'parametric' && gate.params?.theta === undefined) {
         errors.push({
            gateId: gate.id,
            code: 'MISSING_ANGLE',
            message: `Parametric gate requires an angle parameter (theta).`
         })
      }
   }

   return errors
}
