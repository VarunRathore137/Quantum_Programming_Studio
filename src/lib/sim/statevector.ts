import { Gate } from '../../types/circuit.types';
import { Complex, cadd, cmul } from './complex';
import { getTargetMatrix } from './gates';

// Sparse implementation: O(2^n) time & space instead of dense Kronecker matrices.

export const initializeStatevector = (numQubits: number): Complex[] => {
  const size = 1 << numQubits;
  const sv: Complex[] = new Array(size).fill(0).map(() => ({ re: 0, im: 0 }));
  sv[0] = { re: 1, im: 0 };
  return sv;
};

export const applyGate = (sv: Complex[], gate: Gate, _numQubits: number): Complex[] => {
  // We use LSB = q0 convention (q0 is the 0th bit of the index).
  const newSv: Complex[] = new Array(sv.length).fill(0).map(() => ({ re: 0, im: 0 }));
  
  if (gate.type === 'MEASURE' || gate.type === 'BARRIER') {
    return sv.map(a => ({ ...a }));
  }

  // Handle SWAP separately due to specific index permutation
  if (gate.type === 'SWAP') {
    const [q1, q2] = gate.qubits;
    for (let i = 0; i < sv.length; i++) {
      const bit1 = (i >> q1) & 1;
      const bit2 = (i >> q2) & 1;
      let newIdx = i;
      if (bit1 !== bit2) {
        newIdx ^= (1 << q1) | (1 << q2);
      }
      newSv[newIdx] = { ...sv[i] };
    }
    return newSv;
  }

  // Single or controlled standard gates
  const u = getTargetMatrix(gate)!; 
  
  // Distinguish target & controls
  const target = gate.qubits[gate.qubits.length - 1];
  const controls = gate.qubits.slice(0, -1);

  const tMask = 1 << target;
  let cMask = 0;
  for (const c of controls) {
    cMask |= (1 << c);
  }

  for (let i = 0; i < sv.length; i++) {
    // If it's a controlled gate and the control bits aren't 1, it's Identity
    if (controls.length > 0 && (i & cMask) !== cMask) {
      newSv[i] = cadd(newSv[i], sv[i]);
      continue;
    }

    const tBit = (i >> target) & 1; // 0 or 1
    const baseIdx = i & ~tMask;     // The index with target bit = 0

    // Multiply this amplitude to the newly computed locations
    const amp = sv[i];
    
    // U applies to |tBit>:  U|tBit> = U[0][tBit]|0> + U[1][tBit]|1>
    newSv[baseIdx] = cadd(newSv[baseIdx], cmul(u[0][tBit], amp));
    newSv[baseIdx | tMask] = cadd(newSv[baseIdx | tMask], cmul(u[1][tBit], amp));
  }
  
  return newSv;
};
