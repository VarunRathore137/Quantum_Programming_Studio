import { create } from 'zustand';
import { SimResult } from '../lib/sim';

export type SimStatus = 'idle' | 'running' | 'ready' | 'error' | 'cloud';

interface SimStore {
  simResult: SimResult | null;
  simStatus: SimStatus;
  simError: string | null;
  setSimResult: (result: SimResult) => void;
  setSimStatus: (status: SimStatus) => void;
  setSimError: (error: string | null) => void;
  clearSim: () => void;
}

export const useSimStore = create<SimStore>((set) => ({
  simResult: null,
  simStatus: 'idle',
  simError: null,
  setSimResult: (result) => set({ simResult: result }),
  setSimStatus: (status) => set({ simStatus: status }),
  setSimError: (error) => set({ simError: error }),
  clearSim: () => set({ simResult: null, simStatus: 'idle', simError: null })
}));
