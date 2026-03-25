import { useSimStore } from '../../store/simStore';
import { useCircuitStore } from '../../store/circuitStore';

export function MetricsPanel() {
  const simResult = useSimStore((s) => s.simResult);
  const numQubits = useCircuitStore((s) => s.numQubits);

  const gateCount = simResult ? simResult.gateCount : 0;
  const depth = simResult ? simResult.depth : '—';

  return (
    <div className="flex items-center space-x-3 px-4 py-1.5 bg-zinc-950/40 backdrop-blur-md border-b border-zinc-800/50 font-mono text-[11px] text-zinc-400 z-10 w-full">
      <div className="flex items-center space-x-1.5 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-800/60 shadow-inner">
        <span className="text-violet-400">⎋</span>
        <span>{gateCount} gates</span>
      </div>
      
      <div className="flex items-center space-x-1.5 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-800/60 shadow-inner">
        <span className="text-blue-400">↕</span>
        <span>depth {depth}</span>
      </div>

      <div className="flex items-center space-x-1.5 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-800/60 shadow-inner">
        <span className="text-emerald-400">⊗</span>
        <span>{numQubits} qubits</span>
      </div>
    </div>
  );
}
