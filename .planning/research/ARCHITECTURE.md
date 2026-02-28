# Architecture Research — Quantum Programming Studio

## Component: Circuit Data Model

**Pattern:** Directed Acyclic Graph (DAG) as canonical internal representation
**Rationale:** A DAG (used internally by Qiskit's `QuantumCircuit`) captures gate dependencies correctly. Gate at (qubit=0, col=2) depends on gate at (qubit=0, col=1) — DAG edges represent qubit wire threading. This enables correct transpilation, depth calculation, and dependency tracking. OpenQASM 3.0 is the serialization format for persistence and inter-component communication.
**Data Flow:** DAG (internal state) ↔ JSON (React state / Y.js sync) ↔ QASM (code editor) ↔ visual grid (rendering)
**Build Order Implication:** Must be designed first. Every other component (simulation, sync, AI, hardware) depends on this schema.

**Key schema decision:** Represent circuit as a list of gate operations with qubit targets + sorted by column. This is simpler than a full DAG for small circuits and maps naturally to a 2D grid. Migrate to true DAG if transpilation requires it.

```typescript
interface Gate {
  id: string;           // UUID
  type: GateType;       // 'H' | 'CNOT' | 'RX' | ...
  qubits: number[];     // target qubits [target, ...controls]
  column: number;       // position in circuit (time axis)
  params: number[];     // rotation angles, etc.
}

interface Circuit {
  numQubits: number;
  gates: Gate[];        // ordered by column, then qubit
  metadata: CircuitMeta;
}
```

---

## Component: Bi-Directional Sync Architecture

**Pattern:** Single Source of Truth (SSOT) with change-source tagging
**Rationale:** The circuit DAG/gate-list is the SSOT. Both editors (visual and code) are views of it. When a change originates from the visual editor, it updates the SSOT, which then emits a "code update" event (not a "visual update" — prevents feedback loop). Vice versa for code editor.

**Change flow:**
```
Visual Edit  →  tag: SOURCE=VISUAL  →  update Circuit SSOT  →  IF source≠CODE → emit QASM render
Code Edit    →  tag: SOURCE=CODE    →  parse QASM  →  update Circuit SSOT  →  IF source≠VISUAL → emit visual re-render
```

**Key technical challenges:**
- **Debouncing**: Code edits must be debounced (500ms) before parsing — partial QASM mid-type is not valid
- **Cursor preservation**: After code-driven visual update, preserve cursor position in CodeMirror
- **Undo/redo**: Single unified undo stack in the circuit SSOT — not separate undo stacks per editor
- **Invalid QASM handling**: Show inline error annotations in CodeMirror without clearing the visual circuit
**Build Order Implication:** Phase 2 — depends on circuit editor (Phase 1) and code editor being set up.

---

## Component: WASM Simulation

**Pattern:** Web Worker + Pyodide (Python WASM runtime)
**Rationale:** Pyodide loads a full Python runtime in the browser via WASM. Qiskit and numpy run inside it. Simulation runs in a dedicated Web Worker thread — the main UI thread stays responsive. Communication via `comlink` (typed RPC over `postMessage`).

**Initialization flow:**
```
App start → spawn SimWorker (Web Worker)
          → SimWorker loads Pyodide (~8MB, cached after first load)
          → SimWorker loads qiskit, numpy via pyodide.loadPackage()
          → Ready signal → UI shows "Simulator ready"
```

**Simulation call flow:**
```
User drops gate → circuit state updated → serialize to QASM
               → send to SimWorker via comlink.simulate(qasmString)
               → SimWorker: Qiskit.parse(qasm) → statevector.run()
               → return { statevector, probabilities, blochCoords }
               → UI updates visualizations
```

**Memory management**: Statevectors grow as 2^n complex128 values. At 20 qubits: 2^20 × 16 bytes = 16MB. At 22 qubits: 64MB. Set hard limit at 20 qubits in WASM worker, return cloud-offload signal beyond that.
**Build Order Implication:** Phase 2 — core value. Must be working before visualizations (Phase 3).

---

## Component: Cloud Simulation Offload

**Pattern:** Transparent fallback with status indicator
**Rationale:** When `numQubits > 20`, the circuit is serialized to QASM and sent to the FastAPI backend. The backend runs Qiskit Aer, returns results. User sees "☁ Running on cloud simulator" badge. The API response format is identical to the local simulator response — UI treats them interchangeably.

**API design:**
```
POST /api/simulate
Body: { qasm: string, shots: number, method: "statevector" | "qasm" }
Response: { statevector: number[], probabilities: { [bitString: string]: number }, executionMs: number }
```

**Build Order Implication:** Phase 3 — after local WASM sim is working.

---

## Component: AI Copilot

**Pattern:** Context-aware completion with circuit state as structured context
**Rationale:** The AI copilot receives:
1. Current circuit serialized as QASM + JSON gate list
2. Recent user actions (last 5 gate operations)
3. Cursor position in the code editor (if code-triggered)
4. User's stated goal (free-text input in copilot panel)

This context is sent to the LLM (OpenAI GPT-4o or Anthropic Claude via BYOK). The LLM responds with structured output (OpenAI function calling / Anthropic tool use) producing a `CircuitDiff` — a list of gate additions/modifications.

**Pipeline:**
```
User types in copilot panel → serialize circuit context
                             → call LLM API with structured output schema
                             → receive CircuitDiff JSON
                             → validate diff against circuit schema
                             → apply diff as animated circuit update
```

**Text-to-circuit (experimental):** Same pipeline, triggered from an explicit NL input field labeled "(experimental)".
**Build Order Implication:** Phase 4 — depends on circuit SSOT and QASM serialization being stable.

---

## Component: Hardware Provider Abstraction

**Pattern:** Adapter Pattern with `Backend` interface
**Rationale:** All providers (IBM, AWS, Azure, IonQ) accept OpenQASM (different versions). The abstract `Backend` interface normalizes: submit, status, result, cancel. Each provider has a concrete adapter. The UI talks only to the abstract interface.

```typescript
interface Backend {
  id: string;
  name: string;
  submit(qasm: string, shots: number, options: SubmitOptions): Promise<Job>
  getStatus(jobId: string): Promise<JobStatus>
  getResult(jobId: string): Promise<JobResult>
  cancel(jobId: string): Promise<void>
  getQueueDepth(): Promise<number>
}
```

**Adapters:** `IBMBackendAdapter`, `AWSBraketAdapter`, `AzureQuantumAdapter`, `IonQAdapter`
**Build Order Implication:** Phase 5 — IBM first (largest user base), others in parallel.

---

## Component: Real-Time Collaboration

**Pattern:** Y.js CRDT with Liveblocks WebSocket provider
**Rationale:** The circuit's gate list is stored as a `Y.Array<Y.Map>` — each gate is a Y.Map with typed fields. Gate additions/deletions/modifications are automatically merged via CRDT. Liveblocks provides the managed WebSocket server — no infrastructure to run.

**Circuit as CRDT:**
```typescript
const yCircuit = new Y.Doc()
const yGates = yCircuit.getArray<Y.Map<any>>('gates')
const yMeta = yCircuit.getMap('meta')

// Add gate: yGates.insert(index, [new Y.Map({ id, type, qubits, column, params })])
// This is automatically synced to all connected clients
```

**Cursor presence**: Each user's hovered cell (qubit, column) is shared via Liveblocks presence — shown as colored cursor overlays on the circuit grid.
**Build Order Implication:** Phase 6 (v2) — depends on stable circuit data model.

---

## Suggested Build Order

1. **Circuit Core** (data model, gate schema, React state, QASM serialization) — everything depends on this
2. **Visual Circuit Editor** (dnd-kit grid, gate palette, drag-and-drop, undo/redo) — the UI foundation
3. **WASM Simulation** (Pyodide worker, statevector, probability output) — core value proposition
4. **Visualizations** (Bloch sphere R3F, probability histogram, statevector display) — makes simulation useful
5. **Code Editor + Bi-directional Sync** (CodeMirror 6, QASM↔visual sync) — key differentiator
6. **Algorithm Templates** (pre-built circuits, parameterized) — quick user wins
7. **AI Copilot** (BYOK settings, LLM call, circuit diff application) — second differentiator
8. **Cloud Simulation Offload** (FastAPI backend, transparent handoff) — scalability
9. **Noise Models** (configurable error channels in simulation) — researcher feature
10. **Hardware Submission** (IBM first, adapter pattern, job tracking) — third differentiator
11. **Advanced Providers** (AWS, Azure, IonQ) — market breadth
12. **Collaboration** (Y.js, Liveblocks) — v2

---

## Component Boundaries

```
Browser (React + Vite)
├── Circuit Core Layer
│   ├── CircuitStore (Zustand) ← single source of truth
│   ├── CircuitSerializer (Circuit ↔ QASM ↔ JSON)
│   └── UndoRedoManager
│
├── Editor Layer
│   ├── VisualEditor (dnd-kit grid)
│   └── CodeEditor (CodeMirror 6) ←⟶ [bi-directional sync via CircuitStore]
│
├── Simulation Layer
│   ├── SimWorker (Web Worker + Pyodide)  ← for ≤20 qubits
│   └── CloudSimClient (fetch → FastAPI)  ← for >20 qubits
│
├── Visualization Layer
│   ├── BlochSphere (React Three Fiber)
│   ├── StatevectorHistogram (D3/Recharts)
│   └── CircuitMetrics (depth, gate count)
│
├── AI Layer
│   ├── CopilotPanel (UI)
│   └── LLMClient (OpenAI/Anthropic, BYOK key from settings)
│
└── Hardware Layer
    ├── ProviderSelector (UI)
    ├── BackendAdapter (interface)
    │   ├── IBMAdapter
    │   ├── AWSAdapter
    │   ├── AzureAdapter
    │   └── IonQAdapter
    └── JobDashboard (status, results, history)

FastAPI Backend (Python)
├── /api/simulate  → Qiskit Aer statevector
├── /api/transpile → Qiskit transpiler
└── /api/providers → Provider API proxies (credential forwarding)
```
