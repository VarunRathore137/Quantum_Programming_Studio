# Roadmap — Quantum Programming Studio

**7 phases** | **40 requirements mapped** | All v1 requirements covered ✓

---

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|-----------------|
| 1 | Foundation & Circuit Core | Stable data model + project skeleton | CIRCUIT-09,10,11, UX-04,05 | 5 |
| 2 | Visual Circuit Editor | Drag-and-drop editor fully working | CIRCUIT-01,02,03,04,05,06,07,08, UX-03 | 5 |
| 3 | Simulation & Visualization | Instant feedback loop — core value delivered | SIM-01,02,03,04,05,06,07, UX-01,02 | 6 |
| 4 | Code Editor & Sync | Bi-directional visual ↔ code sync | SYNC-01,02,03,04 | 4 |
| 5 | Templates & AI Copilot | Rapid prototyping accelerators | TEMPLATES-01,02,03, AI-01,02,03,04,05 | 5 |
| 6 | Noise Models & Cloud Backend | Realism layer + large-circuit support | NOISE-01,02, SIM-03 | 4 |
| 7 | Hardware Submission | Real device access — market readiness | HW-01,02,03,04,05,06 | 5 |

---

## Phase Details

---

### Phase 1: Foundation & Circuit Core

**Goal:** Establish the project scaffold, circuit data model, and export pipeline. Every other phase builds on this.

**Requirements:**
- CIRCUIT-09: User can export circuit as OpenQASM 3.0
- CIRCUIT-10: User can export circuit as Qiskit Python code
- CIRCUIT-11: User can import a circuit from QASM text or file
- UX-04: User can create, save, and load circuit projects (localStorage)
- UX-05: User can name and organize circuits in a project sidebar

**Success Criteria:**
1. Vite + React 19 + TypeScript project scaffolded and deployable to Vercel
2. `CircuitStore` (Zustand) holds a circuit with gates and correctly serializes to valid OpenQASM 3.0
3. Importing a known QASM file re-creates the expected circuit in the store
4. User can type a project name and it persists across page refresh (localStorage)
5. FastAPI backend skeleton is running on Railway with a `/health` endpoint

---

### Phase 2: Visual Circuit Editor

**Goal:** A fully functional drag-and-drop circuit editor that feels responsive and professional. The walking skeleton of the product.

**Requirements:**
- CIRCUIT-01: User can drag gates onto the circuit grid
- CIRCUIT-02: User can delete gates
- CIRCUIT-03: User can undo/redo
- CIRCUIT-04: User can set qubit count
- CIRCUIT-05: User can set column count
- CIRCUIT-06: User can place multi-qubit gates (CNOT, etc.)
- CIRCUIT-07: User can set parametric gate angles
- CIRCUIT-08: Beginner/Advanced palette toggle
- UX-03: Dark mode IDE aesthetic

**Success Criteria:**
1. User drags H gate onto qubit 0 col 0 — gate appears in correct grid cell, circuit store updates
2. Ctrl+Z undoes the last gate placement; Ctrl+Y re-applies it
3. CNOT gate can be placed spanning two qubits (control + target) with a visual connecting line
4. RX gate shows an angle input field; changing it updates the gate params in the store
5. Beginner palette shows ≤10 gates; Advanced palette shows all gates with categories

---

### Phase 3: Simulation & Visualization

**Goal:** Instant feedback loop — drop a gate, run simulation, see statevector and Bloch sphere update. This is the core value proposition.

**Requirements:**
- SIM-01: One-click simulate button
- SIM-02: WASM statevector simulation ≤20 qubits
- SIM-03: Cloud offload >20 qubits (placeholder until Phase 6)
- SIM-04: Probability histogram
- SIM-05: Bloch sphere per qubit
- SIM-06: Statevector amplitudes display
- SIM-07: Circuit metrics panel
- UX-01: App loads in <3 seconds; simulator initializes in background
- UX-02: Status bar showing simulator state

**Success Criteria:**
1. Bell state circuit (H on q0, CNOT q0→q1) simulates and shows 50/50 probability histogram
2. Single qubit |+⟩ state shows Bloch sphere vector pointing to +X axis (equatorial)
3. Status bar transitions: "Simulator initializing..." → "Simulator ready" within 8 seconds of first load
4. 20-qubit GHZ state simulates in <2 seconds in browser
5. 21-qubit circuit shows "☁ Running on cloud simulator" badge (cloud route stubbed for now)
6. Circuit metrics show correct gate count and depth for a 3-gate circuit

---

### Phase 4: Code Editor & Bi-Directional Sync

**Goal:** The split-view code editor stays in sync with the visual editor in both directions. No feedback loops, clean undo history.

**Requirements:**
- SYNC-01: Visual edit → code updates in real time
- SYNC-02: Valid QASM code edit → visual circuit updates (500ms debounce)
- SYNC-03: Invalid QASM shows inline error annotations without clearing visual circuit
- SYNC-04: Unified undo/redo stack across both editors

**Success Criteria:**
1. Drag H gate onto qubit 0 → CodeMirror shows `h q[0];` appended to QASM within 100ms
2. Type `x q[1];` in code editor → X gate appears on qubit 1 in visual editor after 500ms pause
3. Type `h q[999];` (invalid qubit) → red underline annotation; visual circuit unchanged
4. Ctrl+Z while focused on code editor undoes the last circuit change (not just text edit)

---

### Phase 5: Templates & AI Copilot

**Goal:** Accelerate prototyping — users can scaffold a Bell state or Grover's circuit in seconds, and get AI-powered gate suggestions.

**Requirements:**
- TEMPLATES-01: Library of pre-built templates
- TEMPLATES-02: Configurable template parameters
- TEMPLATES-03: Templates load as editable circuits
- AI-01: BYOK settings panel
- AI-02: Copilot panel with gate suggestions
- AI-03: Suggestions shown as visual diff before applying
- AI-04: Copilot can explain circuit issues
- AI-05 *(stretch)*: Natural language → circuit sketch

**Success Criteria:**
1. User selects "Bell State" template → H + CNOT circuit loads in <500ms, is editable
2. User selects "Grover's Search, n=3" → 3-qubit Grover's circuit loads with correct oracle skeleton
3. User pastes OpenAI API key → key stored in sessionStorage, settings panel shows "✓ Connected"
4. User types "suggest the next gate for a QFT subcircuit" → copilot shows a gate diff in the visual editor
5. User clicks "Apply" on suggestion → gate is added to circuit with undo-able history entry

---

### Phase 6: Noise Models & Cloud Backend

**Goal:** Add realism to simulation — overlay real hardware noise, and fully wire the cloud backend for large circuits.

**Requirements:**
- NOISE-01: Configurable noise model (depolarizing, T1/T2, readout error)
- NOISE-02: Real IBM backend noise profile overlay
- SIM-03: Cloud backend fully operational (not stubbed)

**Success Criteria:**
1. User enables "Depolarizing noise, p=0.01" → simulation results show mixed probabilities vs ideal
2. User selects "IBM Brisbane" from noise profile dropdown → real backend error rates loaded and applied to simulation
3. 25-qubit circuit sent to cloud backend → result returned and displayed identically to local sim result
4. "☁ Running on cloud simulator" badge appears and disappears correctly when toggling qubit count across the 20-qubit threshold

---

### Phase 7: Hardware Submission

**Goal:** One-click submission to real quantum hardware. IBM first, then AWS/Azure/IonQ.

**Requirements:**
- HW-01: Submit to IBM Quantum
- HW-02: IBM job status tracking
- HW-03: Result retrieval and display
- HW-04: Queue time estimation
- HW-05: Credentials in sessionStorage only
- HW-06 *(stretch)*: AWS Braket, Azure Quantum, IonQ support

**Success Criteria:**
1. User enters IBM API token → stored in sessionStorage, token never sent to our backend
2. User clicks "Submit to IBM Brisbane" → job submitted, Job ID displayed
3. Job status panel shows "Queued (est. 15 min)" updating every 30s with exponential backoff
4. Completed job results display as a histogram identical in format to simulation results
5. User sees estimated queue time and shot cost before confirming submission

---

## Requirement Traceability

| REQ-ID | Phase |
|--------|-------|
| CIRCUIT-01 | 2 |
| CIRCUIT-02 | 2 |
| CIRCUIT-03 | 2 |
| CIRCUIT-04 | 2 |
| CIRCUIT-05 | 2 |
| CIRCUIT-06 | 2 |
| CIRCUIT-07 | 2 |
| CIRCUIT-08 | 2 |
| CIRCUIT-09 | 1 |
| CIRCUIT-10 | 1 |
| CIRCUIT-11 | 1 |
| SYNC-01 | 4 |
| SYNC-02 | 4 |
| SYNC-03 | 4 |
| SYNC-04 | 4 |
| SIM-01 | 3 |
| SIM-02 | 3 |
| SIM-03 | 3 + 6 |
| SIM-04 | 3 |
| SIM-05 | 3 |
| SIM-06 | 3 |
| SIM-07 | 3 |
| TEMPLATES-01 | 5 |
| TEMPLATES-02 | 5 |
| TEMPLATES-03 | 5 |
| AI-01 | 5 |
| AI-02 | 5 |
| AI-03 | 5 |
| AI-04 | 5 |
| AI-05 | 5 |
| HW-01 | 7 |
| HW-02 | 7 |
| HW-03 | 7 |
| HW-04 | 7 |
| HW-05 | 7 |
| HW-06 | 7 |
| NOISE-01 | 6 |
| NOISE-02 | 6 |
| UX-01 | 3 |
| UX-02 | 3 |
| UX-03 | 2 |
| UX-04 | 1 |
| UX-05 | 1 |
