import { useState } from 'react'
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core'
import { useCircuitStore } from '@/store/circuitStore'
import { getGateDefinition } from '@/lib/gates/gateDefinitions'
import { MultiQubitGateOverlay } from './MultiQubitGateOverlay'
import type { DragGateItem } from '@/types/dragdrop.types'
import type { GateType } from '@/types/circuit.types'
import { GridCell } from './GridCell'
import { PlacedGate } from './PlacedGate'

const CELL_SIZE = 64
const LABEL_WIDTH = 48

export function CircuitGrid() {
   const { numQubits, numColumns, gates, addGate, removeGate } = useCircuitStore()
   const [activeItem, setActiveItem] = useState<DragGateItem | null>(null)
   const [pendingTwoQubit, setPendingTwoQubit] = useState<{
      gateType: GateType
      column: number
      controlQubit: number
   } | null>(null)

   // Build occupation map: "q0_c1" → gateId
   const occupied = new Map<string, string>()
   for (const g of gates) {
      for (const q of g.qubits) {
         occupied.set(`q${q}_c${g.column}`, g.id)
      }
   }

   const handleDragEnd = (event: DragEndEvent) => {
      setActiveItem(null)
      const { over, active } = event
      if (!over) return

      const dragData = active.data.current as DragGateItem
      const { qubit, column } = over.data.current as { qubit: number; column: number }
      const def = getGateDefinition(dragData.gateType as GateType)
      if (!def) return

      if (def.numQubits >= 2) {
         // Two-qubit gate: show target qubit picker
         setPendingTwoQubit({ gateType: dragData.gateType as GateType, column, controlQubit: qubit })
         return
      }

      // Single-qubit gate: validate cell is free
      const key = `q${qubit}_c${column}`
      if (occupied.has(key)) return

      addGate({
         type: dragData.gateType as GateType,
         qubits: [qubit],
         column,
         params: def.defaultParams ? { ...def.defaultParams } : undefined,
      })
   }

   return (
      <DndContext
         onDragStart={(e) => setActiveItem(e.active.data.current as DragGateItem)}
         onDragEnd={handleDragEnd}
      >
         <div className="relative overflow-auto flex-1 p-4">
            <div className="relative inline-block">
               {/* Qubit rows */}
               <div className="flex flex-col gap-0">
                  {Array.from({ length: numQubits }, (_, qi) => (
                     <div key={qi} className="flex items-center">
                        {/* Qubit label */}
                        <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-zinc-400 font-mono">
                           q[{qi}]
                        </div>
                        {/* Horizontal wire line + cells */}
                        <div className="flex items-center relative">
                           {/* Wire */}
                           <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-600 -translate-y-0.5 pointer-events-none" />
                           {Array.from({ length: numColumns }, (_, ci) => {
                              const key = `q${qi}_c${ci}`
                              const gateId = occupied.get(key)
                              // Only render PlacedGate for the gate's primary qubit (qubits[0])
                              const gate = gateId ? gates.find(g => g.id === gateId && g.qubits[0] === qi) : undefined
                              return (
                                 <GridCell key={ci} qubit={qi} column={ci} isOccupied={!!gateId}>
                                    {gate && <PlacedGate gate={gate} onDelete={removeGate} />}
                                 </GridCell>
                              )
                           })}
                        </div>
                     </div>
                  ))}
               </div>

               {/* SVG overlay for multi-qubit gate connectors */}
               <MultiQubitGateOverlay gates={gates} cellSize={CELL_SIZE} labelWidth={LABEL_WIDTH} />
            </div>

            {/* Two-qubit target picker modal */}
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

         {/* DragOverlay: floating chip following cursor */}
         <DragOverlay>
            {activeItem && (
               <div className="w-14 h-14 rounded-lg bg-violet-600 border-2 border-violet-400 flex items-center justify-center text-white font-mono font-bold text-sm opacity-90 shadow-lg shadow-violet-900/50">
                  {activeItem.gateType}
               </div>
            )}
         </DragOverlay>
      </DndContext>
   )
}
