import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useCircuitStore } from '@/store/circuitStore'
import { PlacedGate } from './PlacedGate'

interface GridCellProps {
   qubit: number
   column: number
}

export const GridCell = React.memo(function GridCell({ qubit, column }: GridCellProps) {
   const gate = useCircuitStore(s => s.gates.find(g => g.column === column && g.qubits.includes(qubit)))
   const isOccupied = !!gate

   const dropId = `cell-q${qubit}-c${column}`
   const { setNodeRef, isOver } = useDroppable({
      id: dropId,
      data: { qubit, column },
      disabled: isOccupied, // prevent drop on occupied cells
   })

   return (
      <div
         ref={setNodeRef}
         className={`
        relative w-16 h-16 border border-zinc-800 flex items-center justify-center
        transition-colors duration-100
        ${isOver && !isOccupied ? 'bg-violet-900/40 border-violet-500' : 'bg-transparent'}
        ${isOccupied ? 'cursor-default' : 'cursor-crosshair hover:bg-zinc-800/40'}
      `}
      >
         {gate && gate.qubits[0] === qubit && <PlacedGate gateId={gate.id} />}
      </div>
   )
})
