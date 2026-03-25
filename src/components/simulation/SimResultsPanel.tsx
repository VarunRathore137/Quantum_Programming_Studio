import { useState } from 'react';
import { useSimStore } from '../../store/simStore';
import { ProbabilityHistogram } from './ProbabilityHistogram';
import { StatevectorPanel } from './StatevectorPanel';

export function SimResultsPanel() {
  const [tab, setTab] = useState<'probabilities' | 'statevector'>('probabilities');
  const simStatus = useSimStore((s) => s.simStatus);
  const simError = useSimStore((s) => s.simError);

  return (
    <div className="w-80 min-w-[320px] h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl border-l border-zinc-800/50 text-zinc-100">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/50 bg-zinc-950/40">
        <div className="flex space-x-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setTab('probabilities')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'probabilities' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Probabilities
          </button>
          <button
            onClick={() => setTab('statevector')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'statevector' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            Statevector
          </button>
        </div>
        
        {simStatus === 'running' && (
          <div className="flex items-center space-x-2 text-xs text-violet-400">
            <div className="w-3 h-3 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <span>Simulating</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col relative">
        {simStatus === 'cloud' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-900/90 backdrop-blur-sm z-10 text-center space-y-3">
            <span className="text-3xl">☁️</span>
            <div className="text-sm font-medium text-blue-300">Running on Cloud Simulator</div>
            <div className="text-xs text-zinc-400">Local simulation limit (20 qubits) exceeded.</div>
          </div>
        )}

        {simStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-900/90 backdrop-blur-sm z-10 text-center space-y-2">
            <div className="text-red-400 font-semibold text-sm">Simulation Failed</div>
            <div className="text-xs text-zinc-500">{simError}</div>
          </div>
        )}

        {tab === 'probabilities' && <ProbabilityHistogram />}
        {tab === 'statevector' && <StatevectorPanel />}
      </div>
    </div>
  );
}
