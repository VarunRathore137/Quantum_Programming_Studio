import { X } from 'lucide-react'
import type { Gate } from '@/types/circuit.types'
import { getGateDefinition } from '@/lib/gates/gateDefinitions'
import { useCircuitStore } from '@/store/circuitStore'
import { AngleEditor } from './AngleEditor'

interface PlacedGateProps {
   gate: Gate
   onDelete: (id: string) => void
}

export function PlacedGate({ gate, onDelete }: PlacedGateProps) {
   const def = getGateDefinition(gate.type)
   const label = def?.label ?? gate.type
   const { updateGateParams } = useCircuitStore()
   const isParametric = def?.category === 'parametric'

   if (gate.type === 'MEASURE') {
      return (
         <div className="relative group flex flex-col items-center justify-center w-14 h-14 select-none">
            <div className="absolute w-2 h-14 bg-red-500/20 border-x border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <span className="relative z-10 text-[10px] font-mono font-bold text-red-200 drop-shadow-md">M</span>
            <button
               onClick={(e) => { e.stopPropagation(); onDelete(gate.id) }}
               className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
               title="Delete gate"
            >
               <X size={10} />
            </button>
         </div>
      )
   }

   return (
      <div className={`
      relative group flex flex-col items-center justify-center rounded-lg
      bg-white/5 backdrop-blur-md border border-white/10 text-white select-none
      shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-shadow
      w-14 ${isParametric ? 'min-h-[56px] py-1' : 'h-14'}
    `}>
         <span className="text-sm font-mono font-bold leading-none">{label}</span>
         {isParametric && (
            <AngleEditor
               value={gate.params?.theta ?? 0}
               onChange={(rad: number) => updateGateParams(gate.id, { theta: rad })}
            />
         )}
         {/* Delete button — shown on hover */}
         <button
            onClick={(e) => { e.stopPropagation(); onDelete(gate.id) }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Delete gate"
         >
            <X size={10} />
         </button>
      </div>
   )
}
