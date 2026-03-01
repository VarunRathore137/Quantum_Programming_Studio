export type GateType =
   | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Sdg' | 'Tdg'
   | 'CNOT' | 'CZ' | 'SWAP' | 'Toffoli'
   | 'RX' | 'RY' | 'RZ' | 'U3' | 'P'
   | 'MEASURE' | 'BARRIER';

export interface Gate {
   id: string;            // UUID
   type: GateType;
   qubits: number[];      // [targetQubit] for single, [control, target] for two-qubit
   column: number;        // Time step (0-indexed)
   params?: {             // For parametric gates (RX, RY, RZ, U3, P)
      theta?: number;      // Angle in radians
      phi?: number;
      lambda?: number;
   };
   label?: string;        // Custom display label (optional, UI only)
}

export interface CircuitMetadata {
   name: string;
   description?: string;
   createdAt: string;     // ISO date string
   updatedAt: string;
}

export interface CircuitState {
   id: string;            // UUID
   metadata: CircuitMetadata;
   numQubits: number;     // 1–30
   numColumns: number;    // 1–100
   gates: Gate[];
}

export interface CircuitProject {
   id: string;
   metadata: CircuitMetadata;
   circuits: CircuitState[];
   activeCircuitId: string;
}
