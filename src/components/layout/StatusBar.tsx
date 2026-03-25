import { useEffect, useState } from 'react';
import { useSimStore } from '../../store/simStore';

export function StatusBar() {
  const [initialized, setInitialized] = useState(false);
  const simStatus = useSimStore((s) => s.simStatus);
  const simResult = useSimStore((s) => s.simResult);
  const simError = useSimStore((s) => s.simError);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getStatusContent = () => {
    if (!initialized) {
      return (
        <div className="flex items-center space-x-2 text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
          <span>Simulator initializing...</span>
        </div>
      );
    }

    switch (simStatus) {
      case 'idle':
        return (
          <div className="flex items-center space-x-2 text-zinc-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Simulator ready</span>
          </div>
        );
      case 'running':
        return (
          <div className="flex items-center space-x-2 text-violet-300">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span>Simulating...</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center space-x-2 text-zinc-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span>Simulator ready</span>
            {simResult && <span className="text-zinc-600 ml-2">({simResult.gateCount} ops)</span>}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-400">
            <span>✕</span>
            <span>Simulation error: {simError}</span>
          </div>
        );
      case 'cloud':
        return (
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest font-bold">
              Cloud
            </span>
            <span className="text-blue-200">Cloud simulator — circuit exceeds 20 qubits</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <footer className="w-full h-[28px] bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/50 flex items-center justify-between px-4 font-mono text-[11px] z-50 shrink-0">
      <div className="flex items-center">
        {getStatusContent()}
      </div>
      <div className="text-zinc-600 select-none">
        Quantum Programming Studio v1.0.0
      </div>
    </footer>
  );
}
