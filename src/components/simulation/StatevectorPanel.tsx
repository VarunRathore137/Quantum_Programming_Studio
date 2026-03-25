import { useSimStore } from '../../store/simStore';

export function StatevectorPanel() {
  const simResult = useSimStore((s) => s.simResult);

  if (!simResult || !simResult.statevector) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 text-sm border-2 border-dashed border-zinc-800 rounded-lg">
        Run circuit to see statevector
      </div>
    );
  }

  // Calculate magnitude and phase, sort by magnitude desc
  // Map index to basis string
  const numQubits = Math.log2(simResult.statevector.length);
  const states = simResult.statevector.map((c, i) => {
    const mag = Math.sqrt(c.re * c.re + c.im * c.im);
    const phase = Math.atan2(c.im, c.re);
    const basis = i.toString(2).padStart(numQubits, '0');
    return { basis, c, mag, phase };
  }).filter(s => s.mag > 1e-6)
    .sort((a, b) => b.mag - a.mag);

  const topStates = states.slice(0, 32);

  const formatComplex = (re: number, im: number) => {
    const sign = im >= 0 ? '+' : '-';
    return `${re.toFixed(4)} ${sign} ${Math.abs(im).toFixed(4)}i`;
  };

  const formatPhase = (phase: number) => {
    if (Math.abs(phase) < 0.01) return '0';
    const frac = phase / Math.PI;
    return `${frac.toFixed(2)}π`;
  };

  return (
    <div className="flex-1 overflow-y-auto border border-zinc-800/50 rounded-lg bg-zinc-950/30">
      <table className="w-full text-left text-xs font-mono text-zinc-300">
        <thead className="bg-zinc-900 border-b border-zinc-800 sticky top-0">
          <tr>
            <th className="p-2 font-semibold">State</th>
            <th className="p-2 font-semibold">Amplitude</th>
            <th className="p-2 font-semibold">Mag</th>
            <th className="p-2 font-semibold">Phase</th>
          </tr>
        </thead>
        <tbody>
          {topStates.map(({ basis, c, mag, phase }) => (
            <tr key={basis} className="border-b border-zinc-800/30 font-mono hover:bg-zinc-900/50 transition-colors">
              <td className="p-2 text-violet-400">|{basis}⟩</td>
              <td className="p-2">{formatComplex(c.re, c.im)}</td>
              <td className="p-2">{mag.toFixed(4)}</td>
              <td className="p-2 text-blue-400">{formatPhase(phase)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {states.length > 32 && (
        <div className="p-2 text-center text-xs text-zinc-500 italic border-t border-zinc-800">
          Showing top 32 of {states.length} non-zero states
        </div>
      )}
    </div>
  );
}
