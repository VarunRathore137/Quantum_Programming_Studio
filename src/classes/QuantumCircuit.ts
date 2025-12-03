/**
 * QuantumCircuit.ts
 * 
 * Main data structure for quantum circuits
 * Manages all gates, validation, export, history
 */

import { QuantumGate } from "./QuantumGate";

// Define circuit snapshot for history
interface CircuitSnapshot {
  name: string;
  numQubits: number;
  gates: QuantumGate[];
  timestamp: number;
}

// Define gate library
interface GateLibrary {
  [key: string]: {
    name: string;
    qubits: number;
    parametric: boolean;
  };
}

// Main QuantumCircuit class
export class QuantumCircuit {
  name: string;
  numQubits: number;
  numClassicalBits: number;
  gates: QuantumGate[];
  createdAt: number;
  lastModified: number;
  description: string;

  // History for undo/redo
  history: CircuitSnapshot[];
  currentHistoryIndex: number;

  // Available gates library
  AVAILABLE_GATES: GateLibrary;

  constructor(
    numQubits: number,
    name: string = "Untitled Circuit",
    numClassicalBits: number | null = null
  ) {
    this.name = name;
    this.numQubits = numQubits;
    this.numClassicalBits = numClassicalBits || numQubits;
    this.gates = [];
    this.createdAt = Date.now();
    this.lastModified = Date.now();
    this.description = "";

    // Initialize history
    this.history = [this.getCircuitSnapshot()];
    this.currentHistoryIndex = 0;

    // Define available gates
    this.AVAILABLE_GATES = {
      H: { name: "Hadamard", qubits: 1, parametric: false },
      X: { name: "Pauli-X", qubits: 1, parametric: false },
      Y: { name: "Pauli-Y", qubits: 1, parametric: false },
      Z: { name: "Pauli-Z", qubits: 1, parametric: false },
      S: { name: "Phase", qubits: 1, parametric: false },
      T: { name: "T-gate", qubits: 1, parametric: false },
      RX: { name: "Rotation-X", qubits: 1, parametric: true },
      RY: { name: "Rotation-Y", qubits: 1, parametric: true },
      RZ: { name: "Rotation-Z", qubits: 1, parametric: true },
      CNOT: { name: "Controlled-NOT", qubits: 2, parametric: false },
      SWAP: { name: "SWAP", qubits: 2, parametric: false },
      MEASURE: { name: "Measurement", qubits: 1, parametric: false }
    };
  }

  /**
   * Create a deep clone of this circuit, including gates and history.
   */
  clone(): QuantumCircuit {
    const cloned = new QuantumCircuit(
      this.numQubits,
      this.name,
      this.numClassicalBits
    );

    // Copy metadata
    cloned.createdAt = this.createdAt;
    cloned.lastModified = this.lastModified;
    cloned.description = this.description;

    // Deep clone gates
    cloned.gates = this.gates.map((g) => g.clone());

    // Deep clone history snapshots
    cloned.history = this.history.map((snapshot) => ({
      ...snapshot,
      gates: snapshot.gates.map((g) => g.clone())
    }));
    cloned.currentHistoryIndex = this.currentHistoryIndex;

    return cloned;
  }

  // ─────────────────────────────────────────────────────────────
  // CORE METHODS: Add/Remove/Modify Gates
  // ─────────────────────────────────────────────────────────────

  /**
   * Add single gate to circuit
   * 
   * WORKFLOW:
   * 1. Create gate object
   * 2. Validate
   * 3. Add to gates array
   * 4. Save checkpoint
   * 5. Return gate ID
   * 
   * RETURNS: Gate ID (string)
   */
  addGate(
    type: string,
    targets: number[] = [],
    controls: number[] = [],
    angle: number | null = null,
    position: { row: number; column: number } | null = null
  ): string {
    // Auto-calculate position if not provided
    if (position === null) {
      const row = targets.length > 0 ? targets[0] : 0;
      const column = this.getCircuitDepth();
      position = { row, column };
    }

    // Step 1: Create gate
    const gate = new QuantumGate(type, targets, controls, angle, position);

    // Step 2: Validate
    const validation = gate.validate(this.numQubits);
    if (!validation.valid) {
      throw new Error(`Cannot add gate: ${validation.errors.join(", ")}`);
    }

    // Step 3: Add to circuit
    this.gates.push(gate);

    // Step 4: Update metadata
    this.lastModified = Date.now();

    // Step 5: Save to history
    this.saveCheckpoint();

    // Step 6: Return gate ID
    return gate.id;
  }

  /**
   * Remove gate by ID
   */
  removeGate(gateId: string): void {
    const initialLength = this.gates.length;

    this.gates = this.gates.filter((gate) => gate.id !== gateId);

    if (this.gates.length === initialLength) {
      throw new Error(`Gate with ID ${gateId} not found`);
    }

    this.lastModified = Date.now();
    this.saveCheckpoint();
  }

  /**
   * Get gate by ID
   */
  getGate(gateId: string): QuantumGate | null {
    return this.gates.find((gate) => gate.id === gateId) || null;
  }

  /**
   * Modify gate properties
   */
  modifyGate(
    gateId: string,
    updates: Partial<{
      type: string;
      targets: number[];
      controls: number[];
      angle: number | null;
      position: { row: number; column: number };
    }>
  ): void {
    const gate = this.getGate(gateId);

    if (!gate) {
      throw new Error(`Gate with ID ${gateId} not found`);
    }

    // Create modified gate for validation
    const modifiedGate = new QuantumGate(
      updates.type || gate.type,
      updates.targets || gate.targets,
      updates.controls || gate.controls,
      updates.angle !== undefined ? updates.angle : gate.angle
    );

    // Validate
    const validation = modifiedGate.validate(this.numQubits);
    if (!validation.valid) {
      throw new Error(`Invalid modification: ${validation.errors.join(", ")}`);
    }

    // Apply changes
    Object.assign(gate, updates);
    this.lastModified = Date.now();
    this.saveCheckpoint();
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY METHODS: Get Information
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all gates (returns copy)
   */
  getAllGates(): QuantumGate[] {
    return [...this.gates];
  }

  /**
   * Get gates that act on specific qubit
   */
  getGatesOnQubit(qubitIndex: number): QuantumGate[] {
    if (qubitIndex < 0 || qubitIndex >= this.numQubits) {
      throw new Error(
        `Qubit index ${qubitIndex} out of range [0, ${this.numQubits - 1}]`
      );
    }

    return this.gates.filter(
      (gate) =>
        gate.targets.includes(qubitIndex) ||
        gate.controls.includes(qubitIndex)
    );
  }

  /**
   * Get circuit depth (max sequential layers)
   */
  getCircuitDepth(): number {
    if (this.gates.length === 0) {
      return 0;
    }

    const maxColumn = Math.max(...this.gates.map((gate) => gate.position.column));
    return maxColumn + 1;
  }

  /**
   * Get total gate count
   */
  getGateCount(): number {
    return this.gates.length;
  }

  /**
   * Get circuit statistics
   */
  getStatistics() {
    const gateTypes: { [key: string]: number } = {};

    for (const gate of this.gates) {
      gateTypes[gate.type] = (gateTypes[gate.type] || 0) + 1;
    }

    return {
      numQubits: this.numQubits,
      numClassicalBits: this.numClassicalBits,
      totalGates: this.gates.length,
      depth: this.getCircuitDepth(),
      gateTypes,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      name: this.name,
      description: this.description
    };
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Validate entire circuit
   */
  validateCircuit(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const gate of this.gates) {
      const validation = gate.validate(this.numQubits);
      if (!validation.valid) {
        errors.push(`Gate ${gate.id}: ${validation.errors.join(", ")}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT/IMPORT
  // ─────────────────────────────────────────────────────────────

  /**
   * Export circuit to JSON
   */
  exportToJSON() {
    return {
      name: this.name,
      numQubits: this.numQubits,
      numClassicalBits: this.numClassicalBits,
      description: this.description,
      gates: this.gates.map((gate) => gate.toJSON()),
      createdAt: this.createdAt,
      lastModified: this.lastModified
    };
  }

  /**
   * Export circuit to Qiskit Python code
   */
  exportToQiskit(): string {
    let code = "from qiskit import QuantumCircuit\n\n";
    code += `qc = QuantumCircuit(${this.numQubits}, ${this.numClassicalBits})\n\n`;
    code += "# Add gates\n";

    // Sort gates by column for proper order
    const sortedGates = [...this.gates].sort(
      (a, b) => a.position.column - b.position.column
    );

    let measurementAdded = false;

    for (const gate of sortedGates) {
      if (gate.type === "H") {
        code += `qc.h(${gate.targets[0]})\n`;
      } else if (gate.type === "X") {
        code += `qc.x(${gate.targets[0]})\n`;
      } else if (gate.type === "Y") {
        code += `qc.y(${gate.targets[0]})\n`;
      } else if (gate.type === "Z") {
        code += `qc.z(${gate.targets[0]})\n`;
      } else if (gate.type === "S") {
        code += `qc.s(${gate.targets[0]})\n`;
      } else if (gate.type === "T") {
        code += `qc.t(${gate.targets[0]})\n`;
      } else if (gate.type === "RX") {
        code += `qc.rx(${gate.angle}, ${gate.targets[0]})\n`;
      } else if (gate.type === "RY") {
        code += `qc.ry(${gate.angle}, ${gate.targets[0]})\n`;
      } else if (gate.type === "RZ") {
        code += `qc.rz(${gate.angle}, ${gate.targets[0]})\n`;
      } else if (gate.type === "CNOT") {
        code += `qc.cx(${gate.controls[0]}, ${gate.targets[0]})\n`;
      } else if (gate.type === "SWAP") {
        code += `qc.swap(${gate.targets[0]}, ${gate.targets[1] || 0})\n`;
      } else if (gate.type === "MEASURE" && !measurementAdded) {
        const allQubits = Array.from({ length: this.numQubits }, (_, i) => i);
        code += `qc.measure(${JSON.stringify(allQubits)}, ${JSON.stringify(allQubits)})\n`;
        measurementAdded = true;
      }
    }

    return code;
  }

  /**
   * Export to OpenQASM format
   */
  exportToOpenQASM(): string {
    let code = "OPENQASM 2.0;\n";
    code += 'include "qelib1.inc";\n\n';
    code += `qreg q[${this.numQubits}];\n`;
    code += `creg c[${this.numClassicalBits}];\n\n`;

    // Sort gates by column
    const sortedGates = [...this.gates].sort(
      (a, b) => a.position.column - b.position.column
    );

    for (const gate of sortedGates) {
      if (gate.type === "H") {
        code += `h q[${gate.targets[0]}];\n`;
      } else if (gate.type === "X") {
        code += `x q[${gate.targets[0]}];\n`;
      } else if (gate.type === "Y") {
        code += `y q[${gate.targets[0]}];\n`;
      } else if (gate.type === "Z") {
        code += `z q[${gate.targets[0]}];\n`;
      } else if (gate.type === "RX") {
        code += `rx(${gate.angle}) q[${gate.targets[0]}];\n`;
      } else if (gate.type === "RY") {
        code += `ry(${gate.angle}) q[${gate.targets[0]}];\n`;
      } else if (gate.type === "RZ") {
        code += `rz(${gate.angle}) q[${gate.targets[0]}];\n`;
      } else if (gate.type === "CNOT") {
        code += `cx q[${gate.controls[0]}], q[${gate.targets[0]}];\n`;
      } else if (gate.type === "MEASURE") {
        code += `measure q[${gate.targets[0]}] -> c[${gate.targets[0]}];\n`;
      }
    }

    return code;
  }

  /**
   * Import circuit from JSON
   */
  importFromJSON(jsonData: any): void {
    if (!jsonData.gates || !Array.isArray(jsonData.gates)) {
      throw new Error("Invalid JSON: missing gates array");
    }

    // Clear existing gates
    this.gates = [];

    // Add gates from JSON
    for (const gateData of jsonData.gates) {
      try {
        this.addGate(
          gateData.type,
          gateData.targets,
          gateData.controls,
          gateData.angle,
          gateData.position
        );
      } catch (error) {
        throw new Error(
          `Failed to import gate: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Update metadata
    this.name = jsonData.name || this.name;
    this.description = jsonData.description || "";
  }

  // ─────────────────────────────────────────────────────────────
  // HISTORY: Undo/Redo
  // ─────────────────────────────────────────────────────────────

  /**
   * Get snapshot of current circuit state
   */
  private getCircuitSnapshot(): CircuitSnapshot {
    return {
      name: this.name,
      numQubits: this.numQubits,
      gates: this.gates.map((g) => g.clone()),
      timestamp: Date.now()
    };
  }

  /**
   * Save checkpoint to history
   */
  saveCheckpoint(): void {
    // Remove future history if user undid and then did new action
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }

    // Save current state
    this.history.push(this.getCircuitSnapshot());
    this.currentHistoryIndex = this.history.length - 1;

    // Keep history manageable (max 50 states)
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
      this.currentHistoryIndex = this.history.length - 1;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): void {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      this.restoreFromHistory(this.currentHistoryIndex);
    }
  }

  /**
   * Redo to next state
   */
  redo(): void {
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.currentHistoryIndex++;
      this.restoreFromHistory(this.currentHistoryIndex);
    }
  }

  /**
   * Restore circuit from history snapshot
   */
  private restoreFromHistory(index: number): void {
    const snapshot = this.history[index];
    this.name = snapshot.name;
    this.numQubits = snapshot.numQubits;
    this.gates = snapshot.gates.map((g) => g.clone());
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentHistoryIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentHistoryIndex < this.history.length - 1;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [this.getCircuitSnapshot()];
    this.currentHistoryIndex = 0;
  }
}
