import { create } from 'zustand';
import { SimResult } from '../lib/sim';
import { LintError } from '../lib/circuit/validator';

export type SimStatus = 'idle' | 'running' | 'ready' | 'error' | 'cloud';

interface SimStore {
  simResult: SimResult | null;
  simStatus: SimStatus;
  simError: string | null;
  lintErrors: LintError[];
  setSimResult: (result: SimResult) => void;
  setSimStatus: (status: SimStatus) => void;
  setSimError: (error: string | null) => void;
  setLintErrors: (errors: LintError[]) => void;
  clearSim: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  simResult: null,
  simStatus: 'idle',
  simError: null,
  lintErrors: [],
  setSimResult: (result) => set({ simResult: result }),
  setSimStatus: (status) => set({ simStatus: status }),
  setSimError: (error) => set({ simError: error }),
  setLintErrors: (errors) => set({ lintErrors: errors }),
  clearSim: () => set({ simResult: null, simStatus: 'idle', simError: null, lintErrors: [] })
}));
