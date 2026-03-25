import { useState } from 'react'
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core'
import { GatePalette } from '../palette/GatePalette'
import { CircuitControls } from './CircuitControls'
import { CircuitGrid } from './CircuitGrid'
import { CodeEditorPane } from './CodeEditorPane'
import { SimResultsPanel } from '../simulation/SimResultsPanel'
import { CopilotSidebar } from '../sidebar/CopilotSidebar'
import { useCircuitStore } from '@/store/circuitStore'
import { getGateDefinition } from '@/lib/gates/gateDefinitions'
import type { DragGateItem } from '@/types/dragdrop.types'
import type { GateType } from '@/types/circuit.types'

export function CircuitEditor() {
   const [activeItem, setActiveItem] = useState<DragGateItem | null>(null)
   const [pendingTwoQubit, setPendingTwoQubit] = useState<{
      gateType: GateType
      column: number
      controlQubit: number
   } | null>(null)

   const { gates, addGate } = useCircuitStore()

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
         // Two-qubit gate: open target qubit picker
         setPendingTwoQubit({ gateType: dragData.gateType as GateType, column, controlQubit: qubit })
         return
      }

      // Single-qubit: validate free cell
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
      // DndContext MUST wrap both GatePalette (useDraggable) and CircuitGrid (useDroppable)
      <DndContext
         onDragStart={(e) => setActiveItem(e.active.data.current as DragGateItem)}
         onDragEnd={handleDragEnd}
      >
         <div className="flex flex-col h-full">
            <CircuitControls />
            <div className="flex flex-1 overflow-hidden">
               <GatePalette />
               <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex flex-1 overflow-hidden">
                     <CircuitGrid
                        pendingTwoQubit={pendingTwoQubit}
                        setPendingTwoQubit={setPendingTwoQubit}
                        occupied={occupied}
                     />
                     <SimResultsPanel />
                  </div>
                  <CodeEditorPane />
               </div>
               <CopilotSidebar />
            </div>
         </div>

         {/* DragOverlay renders the floating chip while dragging */}
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
