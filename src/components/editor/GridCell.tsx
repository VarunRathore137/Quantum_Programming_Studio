import { useDroppable } from '@dnd-kit/core'

interface GridCellProps {
   qubit: number
   column: number
   isOccupied: boolean
   children?: React.ReactNode
}

export function GridCell({ qubit, column, isOccupied, children }: GridCellProps) {
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
         {children}
      </div>
   )
}
