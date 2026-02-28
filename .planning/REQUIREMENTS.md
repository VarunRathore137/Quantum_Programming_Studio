# Requirements — Quantum Programming Studio (v1)

## v1 Requirements

### CIRCUIT — Circuit Editor Core

- [ ] **CIRCUIT-01**: User can add quantum gates to a visual circuit grid by dragging from a gate palette
- [ ] **CIRCUIT-02**: User can remove a gate from the circuit by selecting and deleting it
- [ ] **CIRCUIT-03**: User can undo and redo circuit edits (keyboard shortcut: Ctrl+Z / Ctrl+Y)
- [ ] **CIRCUIT-04**: User can configure the number of qubits in the circuit (1–30)
- [ ] **CIRCUIT-05**: User can configure the number of circuit columns (time steps)
- [ ] **CIRCUIT-06**: User can place multi-qubit gates (CNOT, CZ, Toffoli, SWAP) by specifying control and target qubits
- [ ] **CIRCUIT-07**: User can set rotation angles for parametric gates (RX, RY, RZ, U3) via an inline slider or input field
- [ ] **CIRCUIT-08**: User can switch between a "Beginner" gate palette (10 core gates) and an "Advanced" palette (full library)
- [ ] **CIRCUIT-09**: User can export the current circuit as OpenQASM 3.0 text
- [ ] **CIRCUIT-10**: User can export the current circuit as executable Qiskit Python code
- [ ] **CIRCUIT-11**: User can import a circuit from a QASM file or pasted QASM text

---

### SYNC — Bi-Directional Live Sync

- [ ] **SYNC-01**: User sees the code editor update in real time when a gate is added, moved, or removed in the visual editor
- [ ] **SYNC-02**: User sees the visual circuit update when valid QASM is edited in the code editor (with 500ms debounce)
- [ ] **SYNC-03**: User sees inline error annotations in the code editor when QASM is invalid, without the visual circuit being cleared
- [ ] **SYNC-04**: User can undo/redo from either editor using the same unified undo stack

---

### SIM — Simulation

- [ ] **SIM-01**: User can run the current circuit through a statevector simulator with a single click
- [ ] **SIM-02**: For circuits with ≤20 qubits, simulation runs instantly in the browser via WASM (Pyodide + Qiskit)
- [ ] **SIM-03**: For circuits with >20 qubits, simulation is transparently sent to the cloud backend with a "running on cloud simulator" status indicator
- [ ] **SIM-04**: User sees a probability histogram of measurement outcomes after simulation
- [ ] **SIM-05**: User sees a Bloch sphere visualization for each qubit (updated after each simulation)
- [ ] **SIM-06**: User sees the statevector amplitudes display (top-k states by probability for large circuits)
- [ ] **SIM-07**: User sees circuit metrics: gate count, circuit depth, qubit count

---

### TEMPLATES — Algorithm Templates

- [ ] **TEMPLATES-01**: User can select from a library of pre-built circuit templates (Bell state, GHZ, QFT, Grover's, Bernstein-Vazirani, Deutsch-Jozsa, QAOA skeleton, VQE ansatz)
- [ ] **TEMPLATES-02**: User can configure template parameters (number of qubits, oracle function, iteration count) before loading
- [ ] **TEMPLATES-03**: Templates load as editable circuits — user can modify them freely after loading

---

### AI — AI Copilot

- [ ] **AI-01**: User can enter their own OpenAI or Anthropic API key in a settings panel (BYOK)
- [ ] **AI-02**: User can open a copilot panel and ask for gate suggestions based on the current circuit state
- [ ] **AI-03**: The copilot displays suggested gates/changes as a visual diff before applying (user must confirm)
- [ ] **AI-04**: The copilot can explain why a circuit might not produce the expected output
- [ ] **AI-05** *(stretch)*: User can describe a quantum computation in natural language and receive a circuit sketch labeled "experimental"

---

### HW — Hardware Submission

- [ ] **HW-01**: User can submit the current circuit to IBM Quantum with a single action
- [ ] **HW-02**: User can view the status of submitted IBM Quantum jobs (queued, running, completed, failed)
- [ ] **HW-03**: User can retrieve and visualize results from completed IBM Quantum jobs
- [ ] **HW-04**: User can see estimated queue time before submitting a hardware job
- [ ] **HW-05**: Provider credentials are stored in browser sessionStorage only — never sent to our backend
- [ ] **HW-06** *(stretch)*: User can submit to AWS Braket, Azure Quantum, or IonQ (same one-click UX)

---

### NOISE — Noise Models

- [ ] **NOISE-01**: User can attach a configurable noise model to simulation (depolarizing error, T1/T2 decay, readout error)
- [ ] **NOISE-02**: User can select a real IBM backend (e.g., IBM Brisbane) and overlay its actual error rates onto the simulation

---

### UX — Core UX

- [ ] **UX-01**: App loads and shows a functional circuit editor within 3 seconds (simulator may initialize in background)
- [ ] **UX-02**: User sees a clear status bar showing simulator state (initializing, ready, running, cloud mode)
- [ ] **UX-03**: Dark mode UI with a clean IDE aesthetic — not a toy
- [ ] **UX-04**: User can create, save, and load circuit projects (browser local storage for v1)
- [ ] **UX-05**: User can name and organize circuits in a project sidebar

---

## v2 Requirements (Deferred)

- Real-time multiplayer editing (Y.js + Liveblocks) — team collaboration
- Git-backed project versioning with branching
- Circuit diff visualization (compare two circuit versions)
- Comments on specific gates/lines
- Team access controls
- Job management dashboard (unified across all hardware providers)
- Error mitigation toolbox (ZNE, PEC, readout error mitigation as toggleable layers)
- Classical-quantum hybrid workflow engine (VQE/QAOA orchestration with variational sweep)
- Q-sphere visualization
- Density matrix view
- Custom gate definition (user-defined sub-circuits reused as single gates)

---

## Out of Scope

- Desktop/Electron app — pure web app only; desktop may come later
- Hosting/managing provider credentials server-side — security boundary
- Classical register gates (if/else, reset, mid-circuit measurement) for v1 — adds UX complexity
- Mobile-optimized UI — desktop browser primary
- Building or hosting our own quantum hardware — integration only
- Building a custom quantum programming language — Qiskit + Q# + QASM only
- Monetization/billing infrastructure for v1 — freemium model finalized post-launch

---

## Traceability

*(To be filled by roadmapper)*

| REQ-ID | Phase | Plan |
|--------|-------|------|
| CIRCUIT-01 to CIRCUIT-11 | | |
| SYNC-01 to SYNC-04 | | |
| SIM-01 to SIM-07 | | |
| TEMPLATES-01 to TEMPLATES-03 | | |
| AI-01 to AI-05 | | |
| HW-01 to HW-06 | | |
| NOISE-01 to NOISE-02 | | |
| UX-01 to UX-05 | | |
