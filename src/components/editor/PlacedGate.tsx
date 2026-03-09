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

   return (
      <div className="relative group w-14 h-14 flex flex-col items-center justify-center rounded-lg bg-violet-600 border border-violet-400 text-white select-none">
         <span className="text-sm font-mono font-bold leading-none">{label}</span>
         {isParametric && (
            <AngleEditor
               value={gate.params?.theta ?? 0}
               onChange={rad => updateGateParams(gate.id, { theta: rad })}
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
