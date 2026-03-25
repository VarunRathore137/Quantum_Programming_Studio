import { Undo2, Redo2 } from 'lucide-react'
import { useCircuitStore } from '@/store/circuitStore'
import { useHistoryStore, useUndoRedoKeyboard } from '@/store/historyStore'

export function CircuitControls() {
   const { numQubits, numColumns, setNumQubits, setNumColumns, setGates, gates } = useCircuitStore()
   const { undo, redo, past, future } = useHistoryStore()

   const handleUndo = () => {
      const prev = undo()
      if (prev) {
         setGates(prev.gates)
         // Use the store's setNumQubits/setNumColumns but skip pushing to history
         useCircuitStore.setState({ numQubits: prev.numQubits, numColumns: prev.numColumns })
      }
   }

   const handleRedo = () => {
      const next = redo()
      if (next) {
         setGates(next.gates)
         useCircuitStore.setState({ numQubits: next.numQubits, numColumns: next.numColumns })
      }
   }

   useUndoRedoKeyboard({ onUndo: handleUndo, onRedo: handleRedo })

   const handleQubitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10)
      if (!isNaN(val) && val >= 1 && val <= 20) {
         setNumQubits(val)
      }
   }

   const handleColumnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10)
      if (!isNaN(val) && val >= 1 && val <= 50) {
         setNumColumns(val)
      }
   }

   return (
      <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
         {/* Undo / Redo */}
         <div className="flex items-center gap-1">
            <button
               onClick={handleUndo}
               disabled={past.length === 0}
               className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               title="Undo (Ctrl+Z)"
            >
               <Undo2 size={16} />
            </button>
            <button
               onClick={handleRedo}
               disabled={future.length === 0}
               className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               title="Redo (Ctrl+Y)"
            >
               <Redo2 size={16} />
            </button>
         </div>

         <div className="h-4 w-px bg-zinc-700" />

         {/* Qubit count */}
         <label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono">Qubits</span>
            <input
               type="number"
               min={1}
               max={20}
               value={numQubits}
               onChange={handleQubitsChange}
               className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-100 font-mono text-xs text-center focus:outline-none focus:border-violet-500 transition-colors"
            />
         </label>

         {/* Column count */}
         <label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono">Columns</span>
            <input
               type="number"
               min={1}
               max={50}
               value={numColumns}
               onChange={handleColumnsChange}
               className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-100 font-mono text-xs text-center focus:outline-none focus:border-violet-500 transition-colors"
            />
         </label>

         <div className="flex-1" />

         <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-mono">
               Depth: {Math.max(-1, ...gates.map(g => g.column)) + 1}
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-500/30 rounded transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Simulate
            </button>
            <button className="px-3 py-1.5 text-xs font-semibold bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/30 rounded transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
               Run on Hardware
            </button>
         </div>
      </div>
   )
}
