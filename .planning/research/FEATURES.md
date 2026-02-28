# Features Research — Quantum Programming Studio

## Category: Circuit Editor

### Table Stakes
- Drag-and-drop gate placement onto a qubit ✕ column grid — [expected by all users] [complexity: Med]
- Standard gate set: H, X, Y, Z, S, T, CNOT, CZ, SWAP, Toffoli, RX/RY/RZ, MEASURE — [quantum computing basics] [complexity: Low]
- Multi-qubit gates with control and target qubit selection — [required for entanglement circuits] [complexity: Med]
- Adjustable number of qubits (1–30) — [circuits vary in size] [complexity: Low]
- Undo/redo for circuit edits — [every editor has this] [complexity: Med]
- Gate deletion and rearrangement — [basic editing] [complexity: Low]
- Circuit export to QASM — [interoperability standard] [complexity: Med]
- Circuit export to Qiskit Python code — [the most popular quantum SDK] [complexity: Med]
- Visual gate labels and color coding by gate type — [readability] [complexity: Low]

### Differentiators
- **Bi-directional live sync** between visual editor and code editor — [IBM Composer doesn't have this; Quirk has no code view] [complexity: Very High]
- **Parametric gate angle controls** (inline sliders for RX/RY/RZ) — [rare in visual editors] [complexity: Med]
- **Custom gate definition** (user-defined subcircuits as reusable gates) — [power user feature] [complexity: High]
- **Gate search and palette filtering** — [essential once gate library grows] [complexity: Low]
- **Keyboard shortcuts for common gates** — [speeds up expert workflow dramatically] [complexity: Low]
- **Circuit snapshot/time-travel history** — [researchers iterate on circuits; this enables experiment tracking] [complexity: High]
- **Circuit diff visualization** — [compare two circuit versions visually] [complexity: High]

### Anti-features
- Classical register gates (if/else, reset) for v1 — too complex, adds UX noise; defer post-v1
- Arbitrary unitary matrix input for v1 — power feature that slows down beginners

---

## Category: Simulation & Execution

### Table Stakes
- Run statevector simulation and see output probabilities — [core feedback loop] [complexity: Med]
- Measurement result histogram — [expected viz for simulation results] [complexity: Low]
- Bloch sphere visualization per qubit — [standard quantum viz] [complexity: High]
- Circuit depth and gate count display — [circuit metrics] [complexity: Low]

### Differentiators
- **Instant WASM simulation (≤20 qubits, zero latency)** — [IBM Composer is cloud-only and slow; Quirk doesn't export] [complexity: Very High]
- **Live statevector updates as gates are dropped** — [real-time feedback changes the prototyping workflow] [complexity: High]
- **Noise model playground** — [simulate realistic hardware before submitting] [complexity: High]
- **Noise profile overlay** (use real IBM Brisbane error rates) — [unique for a visual IDE] [complexity: High]
- **Cloud offload for large circuits** with "running on cloud" indicator — [transparent scalability] [complexity: High]
- **Q-sphere visualization** — [less common, good differentiator for researchers] [complexity: Med]
- **Density matrix view** — [essential for mixed states / noisy sims] [complexity: Med]

### Anti-features
- Full tensor network simulation in browser — too complex for v1
- GPU accelerated simulation — unnecessary at ≤20 qubit target

---

## Category: Algorithm Templates

### Table Stakes
- None (competitors don't have this) — templates are a differentiator

### Differentiators
- **Bell state / GHZ state templates** — immediate "hello world" for new users [complexity: Low]
- **Quantum Fourier Transform (QFT)** parameterized template — [standard algorithm] [complexity: Med]
- **Grover's search** with adjustable oracle — [most taught quantum algorithm] [complexity: High]
- **QAOA for MaxCut** with classical parameter sweep — [popular for researchers] [complexity: Very High]
- **VQE ansatz templates** (UCCSD, hardware-efficient) — [chemistry/optimization researchers] [complexity: Very High]
- **Shor's algorithm skeleton** (educational version) — [famous, complex, but good for demos] [complexity: High]
- **Bernstein-Vazirani / Deutsch-Jozsa** — [good for teaching quantum advantage] [complexity: Med]
- **Template parameter controls** (sliders for n qubits, iterations, angles) — [makes templates truly useful] [complexity: Med]

### Anti-features
- Locked/uneditable templates — must be editable/forkable
- More than ~15 templates at launch — overwhelming, curate carefully

---

## Category: AI Copilot

### Table Stakes
- None (no competitor offers this)

### Differentiators
- **Context-aware gate autocomplete** (circuit state as JSON/QASM context → next gate suggestion) — [copilot model, high value] [complexity: High]
- **Inline circuit explanation** ("why might this circuit not work?") — [accessibility for learners] [complexity: Med]
- **QASM error annotation** (highlight invalid gate in code view) — [reduces debugging time] [complexity: Med]
- **Natural language to circuit sketch** (experimental) — [text-to-circuit pipeline] [complexity: Very High]
- **BYOK settings panel** (OpenAI / Anthropic API key input) — [no key management burden] [complexity: Low]

### Anti-features
- Fully automatic circuit generation without user control — removes agency, reduces trust
- Streaming responses in the visual editor — latency makes this worse than batched suggestions

---

## Category: Hardware Submission

### Table Stakes
- One-click submit to IBM Quantum — [IBM is the most common provider] [complexity: High]
- Job status tracking (queued → running → done) — [hardware jobs take minutes to hours] [complexity: Med]
- Result retrieval and display — [without this, submission is useless] [complexity: Med]

### Differentiators
- **AWS Braket, Azure Quantum, IonQ support** — [cross-provider is a core pitch] [complexity: Very High]
- **Hardware transpiler & optimizer** (topology-aware routing, gate set conversion) — [users shouldn't need to know about native gate sets] [complexity: Very High]
- **Unified job dashboard** across all providers — [experiment tracking] [complexity: High]
- **Queue time estimation** — [critical UX for hardware that takes hours] [complexity: Med]
- **Cost estimation before submit** — [AWS Braket charges per shot; important for students] [complexity: Med]
- **Job history with circuit diffs** — [experiment tracking core feature] [complexity: High]

### Anti-features
- Credentials stored server-side — use OAuth or client-side storage only (security boundary)
- Automatic resubmission on job failure — dangerous for paid providers

---

## Category: Collaboration

### Table Stakes
- None for v1 (solo researcher target)

### Differentiators (v2+)
- Real-time multiplayer editing (Y.js / Liveblocks)
- Git-backed project versioning with branching
- Comments on specific gates/circuit lines
- Team access controls

---

## Feature Dependency Map

```
Circuit Editor (core) ──▶ Bi-directional Sync ──▶ AI Copilot
        │
        ├──▶ WASM Simulation ──▶ Live Viz (Bloch/Statevector)
        │          │
        │          └──▶ Noise Model Playground
        │
        ├──▶ Algorithm Templates
        │
        └──▶ Hardware Submission ──▶ Job Dashboard ──▶ Collaboration
                    │
                    └──▶ Transpiler & Optimizer
```

**Build order implication:**
1. Circuit editor + data model (everything depends on this)
2. WASM simulation (enables instant feedback loop — core value)
3. Visualizations (Bloch sphere, statevector) 
4. Bi-directional sync (code ↔ visual)
5. Algorithm templates (easy wins after core editor works)
6. AI copilot (builds on circuit JSON representation)
7. Hardware submission (IBM first, others later)
8. Noise models, transpiler, job dashboard
9. Collaboration (v2)

---

## Competitor Gap Analysis

| Feature | IBM Composer | Quirk | AWS Braket | **Our Studio** |
|---------|-------------|-------|------------|----------------|
| Visual circuit editor | ✓ | ✓ | ✓ | ✓ |
| Code export | ✓ (Qiskit) | ✗ | ✓ | ✓ (Qiskit + Q#) |
| Bi-directional sync | ✗ | ✗ | ✗ | **✓** |
| Instant in-browser simulation | ✗ (cloud only) | ✓ (limited) | ✗ | **✓ (WASM)** |
| Bloch sphere viz | ✓ | ✓ | ✗ | **✓** |
| Algorithm templates | Limited | ✗ | ✗ | **✓** |
| Noise model playground | ✓ (basic) | ✗ | ✗ | **✓** |
| AI copilot | ✗ | ✗ | ✗ | **✓ (BYOK)** |
| Cross-provider hardware | IBM only | ✗ | AWS only | **✓ (4 providers)** |
| Job dashboard | IBM only | ✗ | AWS only | **✓ (unified)** |
| Real-time collaboration | ✗ | ✗ | ✗ | **✓ (v2)** |
| Circuit templates | ✗ | ✗ | ✗ | **✓** |
| Free tier | ✓ | ✓ (open source) | Paid | **✓ (planned)** |
