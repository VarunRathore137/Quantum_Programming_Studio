import type { Gate } from '@/types/circuit.types'

interface Props {
   gates: Gate[]
   cellSize: number    // 64px
   labelWidth: number  // 48px
}

export function MultiQubitGateOverlay({ gates, cellSize, labelWidth }: Props) {
   const twoQubitGates = gates.filter(g => g.qubits.length >= 2)
   if (twoQubitGates.length === 0) return null

   return (
      <svg
         className="absolute inset-0 pointer-events-none"
         style={{ zIndex: 10, filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.6))' }}
         overflow="visible"
      >
         {twoQubitGates.map(gate => {
            const [control, target] = gate.qubits
            const colX = labelWidth + gate.column * cellSize + cellSize / 2
            const controlY = control * cellSize + cellSize / 2
            const targetY = target * cellSize + cellSize / 2
            const top = Math.min(controlY, targetY)
            const bottom = Math.max(controlY, targetY)

            return (
               <g key={gate.id}>
                  {/* Vertical connecting line */}
                  <line x1={colX} y1={top} x2={colX} y2={bottom} stroke="#7c3aed" strokeWidth={2} />
                  {/* Control dot */}
                  <circle cx={colX} cy={controlY} r={6} fill="#7c3aed" />
                  {/* Target ⊕ symbol */}
                  <circle cx={colX} cy={targetY} r={12} fill="none" stroke="#7c3aed" strokeWidth={2} />
                  <line x1={colX - 12} y1={targetY} x2={colX + 12} y2={targetY} stroke="#7c3aed" strokeWidth={2} />
                  <line x1={colX} y1={targetY - 12} x2={colX} y2={targetY + 12} stroke="#7c3aed" strokeWidth={2} />
               </g>
            )
         })}
      </svg>
   )
}
