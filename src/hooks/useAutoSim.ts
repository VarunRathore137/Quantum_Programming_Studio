import { useEffect, useRef } from 'react';
import { useCircuitStore } from '../store/circuitStore';
import { useSimStore } from '../store/simStore';
import { simulate } from '../lib/sim';
import { validateCircuit } from '../lib/circuit/validator';

export function useAutoSim() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const unsub = useCircuitStore.subscribe((state) => {
      // Clear previous timeout
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Debounce the simulation execution by 400ms
      timerRef.current = setTimeout(() => {
        // Cancel in-flight if any
        if (abortRef.current) {
          abortRef.current.abort();
        }

        const circuit = {
          id: state.id,
          metadata: state.metadata,
          numQubits: state.numQubits,
          numColumns: state.numColumns,
          gates: state.gates
        };

        if (!circuit.id) return;

        // Synchronous linting
        const lintErrors = validateCircuit(circuit);
        useSimStore.getState().setLintErrors(lintErrors);

        // AbortController for pattern matching
        const abortController = new AbortController();
        abortRef.current = abortController;

        useSimStore.getState().setSimStatus('running');
        
        // Use setTimeout to ensure the UI paints the 'running' status before blocking thread with math
        setTimeout(() => {
          if (abortController.signal.aborted) return;
          
          try {
            const result = simulate(circuit);
            
            if (abortController.signal.aborted) return;

            if (result.error?.code === 'QUBIT_LIMIT_EXCEEDED') {
              useSimStore.getState().setSimStatus('cloud');
              return;
            }

            if (result.error) {
               useSimStore.getState().setSimStatus('error');
               useSimStore.getState().setSimError(result.error.message);
               return;
            }

            useSimStore.getState().setSimResult(result);
            useSimStore.getState().setSimStatus('ready');
          } catch (err: any) {
            if (abortController.signal.aborted) return;
            useSimStore.getState().setSimStatus('error');
            useSimStore.getState().setSimError(err.message || 'Simulation runtime error');
          }
        }, 0);
      }, 400);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);
}
