/**
 * QuantumCircuitEditor.tsx
 * 
 * React component for the Quantum Circuit Editor
 * Uses QuantumCircuit and QuantumGate classes
 * Demonstrates how to use the data structures
 */

import React, { useState, useEffect } from "react";
import { QuantumCircuit } from "../classes/QuantumCircuit";
import "../styles/QuantumCircuitEditor.css"; // Will create this file

interface CircuitStats {
  numQubits: number;
  numClassicalBits: number;
  totalGates: number;
  depth: number;
  gateTypes: { [key: string]: number };
  createdAt: number;
  lastModified: number;
  name: string;
  description: string;
}

const QuantumCircuitEditor: React.FC = () => {
  // STATE
  const [circuit, setCircuit] = useState<QuantumCircuit>(
    new QuantumCircuit(3, "My First Circuit")
  );

  const [selectedGateType, setSelectedGateType] = useState<string>("H");
  const [selectedQubit, setSelectedQubit] = useState<number>(0);
  const [gateAngle, setGateAngle] = useState<number>(0);
  const [stats, setStats] = useState<CircuitStats>(circuit.getStatistics());
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [qiskitCode, setQiskitCode] = useState<string>("");
  const [showQiskitCode, setShowQiskitCode] = useState<boolean>(false);

  // UPDATE STATS whenever circuit changes
  useEffect(() => {
    setStats(circuit.getStatistics());
  }, [circuit]);

  // ─────────────────────────────────────────────────────────────
  // GATE ACTIONS
  // ─────────────────────────────────────────────────────────────

  /**
   * Add gate to circuit
   */
  const handleAddGate = (): void => {
    try {
      setErrorMessage(""); // Clear previous errors

      const newCircuit = circuit.clone();
      const angle =
        selectedGateType.startsWith("R") && gateAngle !== null ? gateAngle : null;

      newCircuit.addGate(selectedGateType, [selectedQubit], [], angle);
      setCircuit(newCircuit);
    } catch (error) {
      setErrorMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  /**
   * Add CNOT gate (needs special handling)
   */
  const handleAddCNOT = (): void => {
    try {
      setErrorMessage("");

      if (selectedQubit < circuit.numQubits - 1) {
        const newCircuit = circuit.clone();
        newCircuit.addGate("CNOT", [selectedQubit + 1], [selectedQubit], null);
        setCircuit(newCircuit);
      } else {
        setErrorMessage("Cannot add CNOT on last qubit (no target available)");
      }
    } catch (error) {
      setErrorMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  /**
   * Remove gate by ID
   */
  const handleRemoveGate = (gateId: string): void => {
    try {
      setErrorMessage("");

      const newCircuit = circuit.clone();
      newCircuit.removeGate(gateId);
      setCircuit(newCircuit);
    } catch (error) {
      setErrorMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  /**
   * Clear all gates
   */
  const handleClearCircuit = (): void => {
    const newCircuit = new QuantumCircuit(
      circuit.numQubits,
      circuit.name
    );
    setCircuit(newCircuit);
    setErrorMessage("");
  };

  /**
   * Undo
   */
  const handleUndo = (): void => {
    if (circuit.canUndo()) {
      const newCircuit = circuit.clone();
      newCircuit.undo();
      setCircuit(newCircuit);
    }
  };

  /**
   * Redo
   */
  const handleRedo = (): void => {
    if (circuit.canRedo()) {
      const newCircuit = circuit.clone();
      newCircuit.redo();
      setCircuit(newCircuit);
    }
  };

  /**
   * Export to Qiskit code
   */
  const handleExportQiskit = (): void => {
    const code = circuit.exportToQiskit();
    setQiskitCode(code);
    setShowQiskitCode(true);
  };

  /**
   * Export to JSON and download
   */
  const handleExportJSON = (): void => {
    const jsonData = circuit.exportToJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${circuit.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="quantum-circuit-editor">
      <h1>🎯 Quantum Circuit Editor</h1>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="error-box">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* CONTROLS */}
      <div className="controls-section">
        <h2>Add Gates</h2>

        <div className="gate-selector">
          <label>
            Gate Type:
            <select
              value={selectedGateType}
              onChange={(e) => setSelectedGateType(e.target.value)}
            >
              <option value="H">Hadamard (H)</option>
              <option value="X">Pauli-X (X)</option>
              <option value="Y">Pauli-Y (Y)</option>
              <option value="Z">Pauli-Z (Z)</option>
              <option value="RX">Rotation-X (RX)</option>
              <option value="RY">Rotation-Y (RY)</option>
              <option value="RZ">Rotation-Z (RZ)</option>
              <option value="S">Phase (S)</option>
              <option value="T">T-gate (T)</option>
              <option value="MEASURE">Measurement</option>
            </select>
          </label>

          <label>
            Qubit:
            <select
              value={selectedQubit}
              onChange={(e) => setSelectedQubit(parseInt(e.target.value))}
            >
              {Array.from({ length: circuit.numQubits }, (_, i) => (
                <option key={i} value={i}>
                  q[{i}]
                </option>
              ))}
            </select>
          </label>

          {selectedGateType.startsWith("R") && (
            <label>
              Angle (radians):
              <input
                type="number"
                value={gateAngle}
                onChange={(e) => setGateAngle(parseFloat(e.target.value))}
                step="0.1"
              />
            </label>
          )}

          <button onClick={handleAddGate} className="btn btn-primary">
            Add {selectedGateType} Gate
          </button>

          <button onClick={handleAddCNOT} className="btn btn-primary">
            Add CNOT
          </button>
        </div>

        <div className="action-buttons">
          <button
            onClick={handleUndo}
            disabled={!circuit.canUndo()}
            className="btn btn-secondary"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!circuit.canRedo()}
            className="btn btn-secondary"
          >
            ↷ Redo
          </button>
          <button onClick={handleClearCircuit} className="btn btn-danger">
            Clear Circuit
          </button>
        </div>
      </div>

      {/* CIRCUIT VISUALIZATION */}
      <div className="circuit-section">
        <h2>Circuit Diagram</h2>
        <div className="circuit-container">
          {Array.from({ length: circuit.numQubits }, (_, qubitIndex) => (
            <div key={qubitIndex} className="qubit-row">
              <div className="qubit-label">q[{qubitIndex}]</div>
              <div className="qubit-line">
                {circuit.getGatesOnQubit(qubitIndex).map((gate) => (
                  <div
                    key={gate.id}
                    className="gate-box"
                    title={`${gate.type}${gate.angle ? ` (${gate.angle})` : ""}`}
                    onClick={() => handleRemoveGate(gate.id)}
                  >
                    <span className="gate-type">{gate.type}</span>
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGate(gate.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STATISTICS */}
      <div className="stats-section">
        <h2>Circuit Statistics</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <strong>Total Gates:</strong> {stats.totalGates}
          </div>
          <div className="stat-item">
            <strong>Circuit Depth:</strong> {stats.depth}
          </div>
          <div className="stat-item">
            <strong>Qubits:</strong> {stats.numQubits}
          </div>
          <div className="stat-item">
            <strong>Classical Bits:</strong> {stats.numClassicalBits}
          </div>
        </div>

        <div className="gate-types">
          <h3>Gate Types:</h3>
          <ul>
            {Object.entries(stats.gateTypes).map(([type, count]) => (
              <li key={type}>
                {type}: {count}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* EXPORT SECTION */}
      <div className="export-section">
        <h2>Export & Code</h2>

        <button onClick={handleExportQiskit} className="btn btn-info">
          View Qiskit Code
        </button>

        <button onClick={handleExportJSON} className="btn btn-info">
          Download JSON
        </button>

        {showQiskitCode && (
          <div className="code-display">
            <h3>Qiskit Python Code:</h3>
            <pre>{qiskitCode}</pre>
            <button
              onClick={() => setShowQiskitCode(false)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* CIRCUIT INFO */}
      <div className="info-section">
        <h3>Circuit Name: {circuit.name}</h3>
        <p>Created: {new Date(stats.createdAt).toLocaleString()}</p>
        <p>Last Modified: {new Date(stats.lastModified).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default QuantumCircuitEditor;
