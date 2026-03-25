import { useSimStore } from '../../store/simStore';

export function ProbabilityHistogram() {
  const simResult = useSimStore((s) => s.simResult);

  if (!simResult) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 text-sm border-2 border-dashed border-zinc-800 rounded-lg">
        Run circuit to see probabilities
      </div>
    );
  }

  // Convert to array and sort descending
  const probs = Object.entries(simResult.probabilities)
    .sort(([, a], [, b]) => b - a);

  const topProbs = probs.slice(0, 32);
  const hasMore = probs.length > 32;

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar space-y-2">
      {topProbs.map(([basis, prob]) => {
        const pct = (prob * 100).toFixed(1);
        return (
          <div key={basis} className="flex flex-col space-y-1">
            <div className="flex justify-between text-xs font-mono text-zinc-300">
              <span>|{basis}⟩</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                style={{ width: `${prob * 100}%`, transition: 'width 300ms ease' }}
              />
            </div>
          </div>
        );
      })}
      
      {hasMore && (
        <div className="pt-2 text-center text-xs text-zinc-500 italic">
          Showing top 32 of {probs.length} states
        </div>
      )}
    </div>
  );
}
