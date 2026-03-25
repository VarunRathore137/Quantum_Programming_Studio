import { Gate } from '../../types/circuit.types';
import { Complex } from './complex';

const I_COMPLEX: Complex = { re: 0, im: 1 };
const M_I_COMPLEX: Complex = { re: 0, im: -1 };
const ZERO: Complex = { re: 0, im: 0 };
const ONE: Complex = { re: 1, im: 0 };
const SQRT2_INV: Complex = { re: 1 / Math.SQRT2, im: 0 };
const M_SQRT2_INV: Complex = { re: -1 / Math.SQRT2, im: 0 };

// Base Pauli / Clifford gates
const GATE_MATRICES: Record<string, Complex[][]> = {
  H: [
    [SQRT2_INV, SQRT2_INV],
    [SQRT2_INV, M_SQRT2_INV]
  ],
  X: [
    [ZERO, ONE],
    [ONE, ZERO]
  ],
  Y: [
    [ZERO, M_I_COMPLEX],
    [I_COMPLEX, ZERO]
  ],
  Z: [
    [ONE, ZERO],
    [ZERO, { re: -1, im: 0 }]
  ],
  S: [
    [ONE, ZERO],
    [ZERO, I_COMPLEX]
  ],
  T: [
    [ONE, ZERO],
    [ZERO, { re: 1 / Math.SQRT2, im: 1 / Math.SQRT2 }]
  ],
  Sdg: [
    [ONE, ZERO],
    [ZERO, M_I_COMPLEX]
  ],
  Tdg: [
    [ONE, ZERO],
    [ZERO, { re: 1 / Math.SQRT2, im: -1 / Math.SQRT2 }]
  ],
};

const getRX = (theta: number): Complex[][] => [
  [{ re: Math.cos(theta / 2), im: 0 }, { re: 0, im: -Math.sin(theta / 2) }],
  [{ re: 0, im: -Math.sin(theta / 2) }, { re: Math.cos(theta / 2), im: 0 }]
];

const getRY = (theta: number): Complex[][] => [
  [{ re: Math.cos(theta / 2), im: 0 }, { re: -Math.sin(theta / 2), im: 0 }],
  [{ re: Math.sin(theta / 2), im: 0 }, { re: Math.cos(theta / 2), im: 0 }]
];

const getRZ = (theta: number): Complex[][] => [
  [{ re: Math.cos(theta / 2), im: -Math.sin(theta / 2) }, ZERO],
  [ZERO, { re: Math.cos(theta / 2), im: Math.sin(theta / 2) }]
];

const getP = (theta: number): Complex[][] => [
  [ONE, ZERO],
  [ZERO, { re: Math.cos(theta), im: Math.sin(theta) }]
];

const getU3 = (theta: number, phi: number, lambda: number): Complex[][] => [
  [
    { re: Math.cos(theta / 2), im: 0 },
    { re: -Math.cos(lambda) * Math.sin(theta / 2), im: -Math.sin(lambda) * Math.sin(theta / 2) }
  ],
  [
    { re: Math.cos(phi) * Math.sin(theta / 2), im: Math.sin(phi) * Math.sin(theta / 2) },
    {
      re: Math.cos(phi + lambda) * Math.cos(theta / 2),
      im: Math.sin(phi + lambda) * Math.cos(theta / 2)
    }
  ]
];

export const getGateMatrix = (gate: Gate): Complex[][] | null => {
  if (gate.type === 'MEASURE' || gate.type === 'BARRIER') {
    return null;
  }

  // Pre-defined non-parametric simple matrices
  if (['H', 'X', 'Y', 'Z', 'S', 'T', 'Sdg', 'Tdg'].includes(gate.type)) {
    return GATE_MATRICES[gate.type as string];
  }

  // Parametric single-qubit gates
  const t = gate.params?.theta ?? 0;
  const p = gate.params?.phi ?? 0;
  const l = gate.params?.lambda ?? 0;

  if (gate.type === 'RX') return getRX(t);
  if (gate.type === 'RY') return getRY(t);
  if (gate.type === 'RZ') return getRZ(t);
  if (gate.type === 'P') return getP(t);
  if (gate.type === 'U3') return getU3(t, p, l);

  // Multi-qubit gate logic requires 4x4 or 8x8 definition if applied densely,
  // but statevector.ts sparsity should just use the 2x2 target matrix and condition on controls.
  // Wait, standard gateMatrix returns 4x4 for CNOT/CZ.
  // If the plan states: `Two-qubit gates (CNOT, CZ, SWAP) return 4x4. Toffoli returns 8x8.` 
  // Let's implement full matrices.
  
  if (gate.type === 'CNOT') {
    return [
      [ONE, ZERO, ZERO, ZERO],
      [ZERO, ONE, ZERO, ZERO],
      [ZERO, ZERO, ZERO, ONE],
      [ZERO, ZERO, ONE, ZERO]
    ];
  }

  if (gate.type === 'CZ') {
    return [
      [ONE, ZERO, ZERO, ZERO],
      [ZERO, ONE, ZERO, ZERO],
      [ZERO, ZERO, ONE, ZERO],
      [ZERO, ZERO, ZERO, { re: -1, im: 0 }]
    ];
  }

  if (gate.type === 'SWAP') {
    return [
      [ONE, ZERO, ZERO, ZERO],
      [ZERO, ZERO, ONE, ZERO],
      [ZERO, ONE, ZERO, ZERO],
      [ZERO, ZERO, ZERO, ONE]
    ];
  }

  if (gate.type === 'Toffoli') {
    return [
      [ONE, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
      [ZERO, ONE, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
      [ZERO, ZERO, ONE, ZERO, ZERO, ZERO, ZERO, ZERO],
      [ZERO, ZERO, ZERO, ONE, ZERO, ZERO, ZERO, ZERO],
      [ZERO, ZERO, ZERO, ZERO, ONE, ZERO, ZERO, ZERO],
      [ZERO, ZERO, ZERO, ZERO, ZERO, ONE, ZERO, ZERO],
      [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ONE],
      [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ONE, ZERO]
    ];
  }

  throw new Error(`Gate type not matching logic: ${gate.type}`);
};

// Also export the base 2x2 unitary for multi-qubit gates to simplify statevector sparsity
export const getTargetMatrix = (gate: Gate): Complex[][] | null => {
  if (['CNOT', 'Toffoli'].includes(gate.type)) return GATE_MATRICES['X'];
  if (gate.type === 'CZ') return GATE_MATRICES['Z'];
  if (gate.type === 'SWAP') return null; // Needs special handling in statevector
  return getGateMatrix(gate);
};
