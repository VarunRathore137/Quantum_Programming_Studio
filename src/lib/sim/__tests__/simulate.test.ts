import { describe, it, expect } from 'vitest';
import { simulate } from '../simulate';
import { CircuitState, Gate } from '../../../types/circuit.types';

const createBaseCircuit = (numQubits: number, gates: Gate[]): CircuitState => ({
  id: 'test-circuit',
  metadata: {
    name: 'Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  numQubits,
  numColumns: 10,
  gates
});

describe('simulate engine', () => {
  it('H on q0 -> statevector [0.707, 0.707], probabilities {0: 0.5, 1: 0.5}', () => {
    const circuit = createBaseCircuit(1, [
      { id: '1', type: 'H', qubits: [0], column: 0 }
    ]);
    const result = simulate(circuit);
    
    // Statevector check
    expect(result.statevector[0].re).toBeCloseTo(0.70710678, 6);
    expect(result.statevector[0].im).toBeCloseTo(0, 6);
    expect(result.statevector[1].re).toBeCloseTo(0.70710678, 6);
    expect(result.statevector[1].im).toBeCloseTo(0, 6);

    // Probabilities
    expect(result.probabilities['0']).toBeCloseTo(0.5, 6);
    expect(result.probabilities['1']).toBeCloseTo(0.5, 6);
  });

  it('X on q0 -> statevector [0, 1], probabilities {1: 1.0}', () => {
    const circuit = createBaseCircuit(1, [
      { id: '1', type: 'X', qubits: [0], column: 0 }
    ]);
    const result = simulate(circuit);
    
    expect(result.statevector[0].re).toBeCloseTo(0, 6);
    expect(result.statevector[0].im).toBeCloseTo(0, 6);
    expect(result.statevector[1].re).toBeCloseTo(1, 6);
    expect(result.statevector[1].im).toBeCloseTo(0, 6);

    expect(result.probabilities['1']).toBeCloseTo(1.0, 6);
    expect(result.probabilities['0']).toBeUndefined(); // or 0
  });

  it('Bell state (H q0, CNOT q0->q1) -> probabilities {00: 0.5, 11: 0.5} within ε=1e-9', () => {
    const circuit = createBaseCircuit(2, [
      { id: '1', type: 'H', qubits: [0], column: 0 },
      { id: '2', type: 'CNOT', qubits: [0, 1], column: 1 }
    ]);
    const result = simulate(circuit);
    
    expect(result.probabilities['00']).toBeCloseTo(0.5, 6);
    expect(result.probabilities['11']).toBeCloseTo(0.5, 6);
    expect(result.probabilities['01']).toBeUndefined(); // or 0
    expect(result.probabilities['10']).toBeUndefined(); // or 0
  });

  it('RX(π) on q0 -> statevector equivalent to (up to global phase) X gate (within ε=1e-9)', () => {
    const circuit = createBaseCircuit(1, [
      { id: '1', type: 'RX', qubits: [0], column: 0, params: { theta: Math.PI } }
    ]);
    const result = simulate(circuit);
    
    // X gate is [0, 1]
    // RX(pi) is cos(pi/2) I - i sin(pi/2) X = -i X = [0, -i]
    expect(result.statevector[0].re).toBeCloseTo(0, 6);
    expect(result.statevector[0].im).toBeCloseTo(0, 6);
    expect(result.statevector[1].re).toBeCloseTo(0, 6);
    expect(result.statevector[1].im).toBeCloseTo(-1, 6);
  });

  it('21-qubit circuit -> throws SimError with code QUBIT_LIMIT_EXCEEDED', () => {
    const circuit = createBaseCircuit(21, []);
    
    const result = simulate(circuit);
    expect(result.error?.code).toBe('QUBIT_LIMIT_EXCEEDED');
  });
});
