import React from 'react'
import { useCircuitStore } from '@/store/circuitStore'
import { MultiQubitGateOverlay } from './MultiQubitGateOverlay'
import type { GateType } from '@/types/circuit.types'
import { GridCell } from './GridCell'

const CELL_SIZE = 64
const LABEL_WIDTH = 48

interface CircuitGridProps {
   pendingTwoQubit: { gateType: GateType; column: number; controlQubit: number } | null
   setPendingTwoQubit: (v: { gateType: GateType; column: number; controlQubit: number } | null) => void
}

export const CircuitGrid = React.memo(function CircuitGrid({ pendingTwoQubit, setPendingTwoQubit }: CircuitGridProps) {
   const numQubits = useCircuitStore(s => s.numQubits)
   const numColumns = useCircuitStore(s => s.numColumns)
   const addGate = useCircuitStore(s => s.addGate)
   // We only subscribe to the gates list reference and ID changes to trigger a re-render for overlay if gates are added/removed
   // The cells themselves will handle their own state
   const gates = useCircuitStore(s => s.gates)

   return (
      <div className="relative overflow-auto flex-1 p-4">
         <div className="relative inline-block">
            {/* SVG overlay BEFORE grid (renders under gates) */}
            <MultiQubitGateOverlay gates={gates} cellSize={CELL_SIZE} labelWidth={LABEL_WIDTH} />

            {/* Qubit rows */}
            <div className="flex flex-col gap-0 relative z-10">
               {Array.from({ length: numQubits }, (_, qi) => (
                  <div key={qi} className="flex items-center">
                     {/* Qubit label */}
                     <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-zinc-400 font-mono">
                        q[{qi}]
                     </div>
                     {/* Wire + cells */}
                     <div className="flex items-center relative">
                        {/* Glowing quantum wire */}
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-cyan-500/40 -translate-y-px pointer-events-none shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                        {Array.from({ length: numColumns }, (_, ci) => (
                           <GridCell key={ci} qubit={qi} column={ci} />
                        ))}
                     </div>
                  </div>
               ))}
            </div>

            {/* Mock Ghost Diff Gates for AI Copilot */}
            <div
               className="absolute w-14 h-14 rounded-lg border-2 border-dashed border-violet-400 bg-violet-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-violet-100 shadow-[0_0_15px_rgba(167,139,250,0.5)] z-20 pointer-events-none"
               style={{ left: LABEL_WIDTH + 2 * CELL_SIZE + CELL_SIZE / 2 - 28, top: 1 * CELL_SIZE + CELL_SIZE / 2 - 28 }}
            >
               <span className="text-lg font-mono font-bold leading-none">RY</span>
               <span className="text-[10px] text-violet-300 mt-0.5">π/2</span>
            </div>
            
            <div
               className="absolute w-14 h-14 rounded-lg border-2 border-dashed border-violet-400 bg-violet-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-violet-100 shadow-[0_0_15px_rgba(167,139,250,0.5)] z-20 pointer-events-none"
               style={{ left: LABEL_WIDTH + 4 * CELL_SIZE + CELL_SIZE / 2 - 28, top: 2 * CELL_SIZE + CELL_SIZE / 2 - 28 }}
            >
               <span className="text-lg font-mono font-bold leading-none">CCX</span>
            </div>
         </div>

         {/* Two-qubit target picker */}
         {pendingTwoQubit && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
               <div className="bg-zinc-900 border border-violet-500 rounded-lg p-4 shadow-xl shadow-black/50">
                  <p className="text-xs text-zinc-400 mb-2">
                     Select target qubit for{' '}
                     <strong className="text-violet-400">{pendingTwoQubit.gateType}</strong>{' '}
                     at col {pendingTwoQubit.column}:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                     {Array.from({ length: numQubits }, (_, qi) => qi)
                        .filter(qi => qi !== pendingTwoQubit.controlQubit)
                        .map(qi => (
                           <button
                              key={qi}
                              onClick={() => {
                                 const gates = useCircuitStore.getState().gates
                                 const occupied = new Map<string, string>()
                                 for (const g of gates) {
                                    for (const q of g.qubits) {
                                       occupied.set(`q${q}_c${g.column}`, g.id)
                                    }
                                 }
                                 const key1 = `q${pendingTwoQubit.controlQubit}_c${pendingTwoQubit.column}`
                                 const key2 = `q${qi}_c${pendingTwoQubit.column}`
                                 if (occupied.has(key1) || occupied.has(key2)) return
                                 addGate({
                                    type: pendingTwoQubit.gateType,
                                    qubits: [pendingTwoQubit.controlQubit, qi],
                                    column: pendingTwoQubit.column,
                                 })
                                 setPendingTwoQubit(null)
                              }}
                              className="px-3 py-1 rounded bg-zinc-800 hover:bg-violet-700 text-zinc-100 text-xs border border-zinc-700 hover:border-violet-400 transition-colors"
                           >
                              q[{qi}]
                           </button>
                        ))}
                     <button
                        onClick={() => setPendingTwoQubit(null)}
                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-red-900 text-zinc-400 text-xs border border-zinc-700"
                     >
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   )
})
