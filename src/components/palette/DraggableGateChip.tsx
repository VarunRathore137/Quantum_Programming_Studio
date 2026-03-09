import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { GateDefinition } from '@/lib/gates/gateDefinitions'
import type { DragGateItem } from '@/types/dragdrop.types'

interface Props { gate: GateDefinition }

export function DraggableGateChip({ gate }: Props) {
   const dragData: DragGateItem = {
      gateType: gate.type,
      angle: gate.defaultParams?.theta ?? null,
      timestamp: Date.now(),
   }
   const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `palette-${gate.type}`,
      data: dragData,
   })
   const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }

   return (
      <div
         ref={setNodeRef}
         style={style}
         {...listeners}
         {...attributes}
         title={gate.description}
         className={`
        select-none cursor-grab active:cursor-grabbing
        flex flex-col items-center justify-center
        w-14 h-14 rounded-lg border border-zinc-700
        bg-zinc-800 hover:bg-zinc-700 hover:border-violet-500
        text-zinc-100 transition-colors
        ${isDragging ? 'ring-2 ring-violet-400' : ''}
      `}
      >
         <span className="text-lg font-mono font-bold leading-none">{gate.label}</span>
         <span className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[52px] text-center">{gate.name}</span>
      </div>
   )
}
