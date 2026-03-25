import { useState } from 'react'
import { BEGINNER_GATES, ADVANCED_GATE_CATEGORIES } from '@/lib/gates/gateDefinitions'
import { DraggableGateChip } from './DraggableGateChip'

export function GatePalette() {
   const [advanced, setAdvanced] = useState(false)

   return (
      <aside className="w-52 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950/40 backdrop-blur-xl flex flex-col overflow-y-auto z-10">
         {/* Header + toggle */}
         <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gates</span>
            <button
               onClick={() => setAdvanced(v => !v)}
               className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
               {advanced ? 'Beginner' : 'Advanced'}
            </button>
         </div>

         {/* Gate chips */}
         <div className="flex-1 overflow-y-auto p-2">
            {!advanced ? (
               // Beginner: flat grid, no categories
               <div className="grid grid-cols-2 gap-2">
                  {BEGINNER_GATES.map(gate => <DraggableGateChip key={gate.type} gate={gate} />)}
               </div>
            ) : (
               // Advanced: categorized sections
               Object.entries(ADVANCED_GATE_CATEGORIES).map(([cat, gates]) => (
                  <div key={cat} className="mb-4">
                     <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 px-1">{cat}</p>
                     <div className="grid grid-cols-2 gap-2">
                        {gates.map(gate => <DraggableGateChip key={gate.type} gate={gate} />)}
                     </div>
                  </div>
               ))
            )}
         </div>
      </aside>
   )
}
