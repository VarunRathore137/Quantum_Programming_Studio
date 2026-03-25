import { useSimStore } from '../../store/simStore';
import { BlochSphere } from './BlochSphere';

export function BlochSpherePanel() {
  const simResult = useSimStore((s) => s.simResult);

  if (!simResult || !simResult.blochVectors) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 text-sm border-2 border-dashed border-zinc-800 rounded-lg">
        Run circuit to see Bloch spheres
      </div>
    );
  }

  const vectors = simResult.blochVectors;

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-zinc-500 italic mb-4">
        Showing {vectors.length} qubits
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="flex flex-wrap gap-4 items-center justify-center pb-4">
          {vectors.map((vector, i) => (
            <BlochSphere key={i} blochVector={vector} qubitIndex={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
