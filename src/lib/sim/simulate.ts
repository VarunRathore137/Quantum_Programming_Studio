import { CircuitState } from '../../types/circuit.types';
import { Complex, cabs2 } from './complex';
import { initializeStatevector, applyGate } from './statevector';

export type SimError = {
  code: string;
  message: string;
};

export type SimResult = {
  statevector: Complex[];
  probabilities: Record<string, number>;
  blochVectors: Array<{ x: number; y: number; z: number } | null>;
  gateCount: number;
  depth: number;
  error?: SimError;
};


function computeBlochVectors(sv: Complex[], numQubits: number) {
  const blochVectors: Array<{ x: number; y: number; z: number } | null> = [];

  for (let q = 0; q < numQubits; q++) {
    const qMask = 1 << q;
    
    let pauliX = 0;
    let pauliY = 0;
    let pauliZ = 0;

    for (let i = 0; i < sv.length; i++) {
        const tBit = (i >> q) & 1;
        const amp1 = sv[i];
        
        // Z expectation: sum |a_i|^2 * (1 if tBit=0 else -1)
        const prob = cabs2(amp1);
        pauliZ += tBit === 0 ? prob : -prob;

        // X and Y expectations pair index i with index j (flipped target bit)
        if (tBit === 0) {
            const j = i | qMask;
            const amp2 = sv[j];
            
            // Re(amp1* · amp2) = amp1.re*amp2.re + amp1.im*amp2.im
            const reSq = amp1.re * amp2.re + amp1.im * amp2.im;
            // Im(amp1* · amp2) = amp1.re*amp2.im - amp1.im*amp2.re
            const imSq = amp1.re * amp2.im - amp1.im * amp2.re;

            pauliX += 2 * reSq;
            pauliY += 2 * imSq;
        }
    }

    // Purity check using r = sqrt(px^2 + py^2 + pz^2)
    const r = Math.sqrt(pauliX * pauliX + pauliY * pauliY + pauliZ * pauliZ);
    if (r < 0.99) { // Mixed state -> entangled
        blochVectors.push(null);
    } else {
        blochVectors.push({ x: pauliX, y: pauliY, z: pauliZ });
    }
  }

  return blochVectors;
}

export const simulate = (circuit: CircuitState): SimResult => {
  if (circuit.numQubits > 20) {
    return {
      statevector: [],
      probabilities: {},
      blochVectors: [],
      gateCount: 0,
      depth: 0,
      error: {
        code: 'QUBIT_LIMIT_EXCEEDED',
        message: 'Cannot locally simulate more than 20 qubits'
      }
    };
  }

  // Sort gates by column, to ensure chronological application
  const gates = [...circuit.gates].sort((a, b) => a.column - b.column);
  
  let depth = 0;
  if (gates.length > 0) {
    depth = Math.max(...gates.map(g => g.column)) + 1;
  }

  let sv = initializeStatevector(circuit.numQubits);

  for (const gate of gates) {
    sv = applyGate(sv, gate, circuit.numQubits);
  }

  // Gather probabilities
  const probabilities: Record<string, number> = {};
  for (let i = 0; i < sv.length; i++) {
    const prob = cabs2(sv[i]);
    if (prob > 1e-9) {
      // Create binary string, note JS bitwise goes up to 32
      // Using LSB=q0 conventionally means bit 0 is q0, so we might want to reverse it 
      // if standard notation places q0 on the right. 
      // Let's assume standard notation: |q_{n-1} ... q_1 q_0>
      const basisState = i.toString(2).padStart(circuit.numQubits, '0');
      probabilities[basisState] = prob;
    }
  }

  const blochVectors = computeBlochVectors(sv, circuit.numQubits);

  return {
    statevector: sv,
    probabilities,
    blochVectors,
    gateCount: gates.length,
    depth
  };
};
