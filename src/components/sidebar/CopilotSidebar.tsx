import { BlochSphere } from './BlochSphere'

export function CopilotSidebar() {
   return (
      <aside className="w-80 flex-shrink-0 border-l border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl flex flex-col overflow-y-auto z-20">
         {/* Live 3D Bloch Sphere */}
         <div className="border-b border-zinc-800/50 p-4 pt-6 bg-black/20">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 text-center">
               Live Bloch Sphere
            </h3>
            <BlochSphere />
         </div>

         {/* State Probability */}
         <div className="p-4 border-b border-zinc-800/50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
               State Probability
            </h3>
            <div className="space-y-3">
               {[
                  { state: '|00⟩', prob: 0.5, color: 'bg-violet-500' },
                  { state: '|01⟩', prob: 0.0, color: 'bg-zinc-700' },
                  { state: '|10⟩', prob: 0.0, color: 'bg-zinc-700' },
                  { state: '|11⟩', prob: 0.5, color: 'bg-violet-500' },
               ].map((item) => (
                  <div key={item.state} className="flex items-center gap-3 text-sm">
                     <span className="font-mono text-zinc-300 w-8">{item.state}</span>
                     <div className="flex-1 h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                        <div
                           className={`h-full ${item.color} shadow-[0_0_10px_rgba(139,92,246,0.5)]`}
                           style={{ width: `${item.prob * 100}%` }}
                        />
                     </div>
                     <span className="font-mono text-zinc-400 text-xs w-8 text-right">
                        {(item.prob * 100).toFixed(0)}%
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {/* AI Suggestions (Ghost Diffs) */}
         <div className="p-4 flex-1">
            <h3 className="text-xs font-semibold flex items-center gap-2 text-violet-300 uppercase tracking-wider mb-4">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               AI Copilot
            </h3>
            <div className="space-y-4">
               <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-900/10 backdrop-blur-md">
                  <p className="text-sm text-zinc-300 mb-2">
                     Suggestion: Apply <strong className="text-violet-400 font-mono">RY(&pi;/2)</strong> to <strong className="text-violet-400 font-mono">q[1]</strong> to prepare a superposition state before entanglement.
                  </p>
                  <div className="flex gap-2">
                     <button className="px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                        Apply Diff
                     </button>
                     <button className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors">
                        Dismiss
                     </button>
                  </div>
               </div>
               
               <div className="p-3 rounded-lg border border-zinc-700/50 bg-zinc-800/20 backdrop-blur-md">
                  <p className="text-sm text-zinc-400 mb-2">
                     Consider swapping <strong className="font-mono">CX</strong> with <strong className="font-mono">CZ</strong> for better phase alignment.
                  </p>
               </div>
            </div>
         </div>
      </aside>
   )
}
