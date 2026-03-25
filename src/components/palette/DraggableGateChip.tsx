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

   if (gate.type === 'MEASURE') {
      return (
         <div
            ref={setNodeRef} style={style} {...listeners} {...attributes} title={gate.description}
            className={`select-none cursor-grab active:cursor-grabbing w-14 h-14 flex items-center justify-center relative transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
         >
            <div className={`absolute w-2 h-14 bg-red-500/20 border-x border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] ${isDragging ? 'shadow-red-400' : ''}`} />
            <span className="relative z-10 text-[10px] font-mono font-bold text-red-200 drop-shadow-md">M</span>
         </div>
      )
   }

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
        w-14 h-14 rounded-lg border border-white/10
        bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-cyan-400/50
        text-zinc-100 transition-all duration-200
        hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]
        ${isDragging ? 'ring-2 ring-cyan-400 bg-white/10 border-cyan-400' : ''}
      `}
      >
         <span className="text-lg font-mono font-bold leading-none">{gate.label}</span>
         <span className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[52px] text-center text-shadow-sm">{gate.name}</span>
      </div>
   )
}
