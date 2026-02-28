# Pitfalls Research — Quantum Programming Studio

## WASM Simulation Pitfalls

### Pitfall: The 4GB Memory Wall (Exponential Statevector Growth)
**Risk Level:** High
**Warning Signs:** Tab crashes or becomes unresponsive when simulating circuits with >22 qubits. Memory usage spikes visible in browser DevTools.
**Prevention:**
- Hard-cap WASM simulation at 20 qubits. At 20 qubits: 2^20 × 16 bytes = 16MB — safe. At 22 qubits: 64MB — risky on low-memory devices.
- Detect the qubit count threshold BEFORE starting simulation and transparently reroute to cloud backend.
- Display a "circuit too large for browser sim — sending to cloud" indicator proactively, not after a crash.
**Affects Phase:** Phase 3 (WASM simulation)

---

### Pitfall: Pyodide Cold Start Latency (3–8 seconds)
**Risk Level:** Medium
**Warning Signs:** Users see a blank/frozen state when first loading the app.
**Prevention:**
- Load Pyodide and packages in a Web Worker eagerly at app startup (not on first simulation).
- Show a persistent "Simulator initializing..." progress indicator in the status bar.
- Cache the Pyodide runtime in the browser's Cache API after first load — subsequent visits initialize in <1 second.
- Provide a "try with example circuit" that works immediately while the simulator loads.
**Affects Phase:** Phase 3 (WASM simulation)

---

### Pitfall: Floating Point Precision Drift in Deep Circuits
**Risk Level:** Low
**Warning Signs:** Statevector probabilities don't sum to exactly 1.0 for long circuits. Bloch sphere vectors exceed unit length.
**Prevention:**
- After simulation, normalize the statevector before rendering. Assert `sum(|ψi|²) ≈ 1.0 ± ε`.
- Log precision drift for debugging; don't surface raw floating point imprecision to users.
- Use Qiskit's built-in statevector class — it handles normalization internally.
**Affects Phase:** Phase 3 & 4 (simulation + visualization)

---

## Bi-Directional Sync Pitfalls

### Pitfall: Infinite Update Loop (Feedback Cascade)
**Risk Level:** High
**Warning Signs:** Browser freezes or maxes CPU when editing either editor. React DevTools shows cascading re-renders.
**Prevention:**
- Tag every state update with its source: `{ source: 'VISUAL' | 'CODE' | 'TEMPLATE' | 'AI' }`.
- In the sync middleware: `if (updateSource === currentEditorSource) { skip callback }`.
- Use a single `isUpdating` mutex flag — while processing a sync, ignore further sync triggers.
- Write integration tests specifically for: drop gate → verify code updates → verify NO visual loop.
**Affects Phase:** Phase 5 (bi-directional sync)

---

### Pitfall: Partial/Invalid QASM Mid-Type
**Risk Level:** Medium
**Warning Signs:** User types in code editor and visual circuit clears or shows errors while they're mid-sentence.
**Prevention:**
- Debounce code editor → circuit sync by 500ms. Only parse when user pauses.
- Use QASM parsing in "tolerant mode" — show inline error annotations without clearing the circuit.
- Never update the visual circuit from an invalid QASM parse. Keep the last valid state.
- Show a "⚠ Invalid QASM" indicator without disrupting the visual editor.
**Affects Phase:** Phase 5 (bi-directional sync)

---

### Pitfall: Undo/Redo History Divergence
**Risk Level:** Medium
**Warning Signs:** After using undo in the code editor, the visual editor shows a different state.
**Prevention:**
- Maintain a SINGLE undo/redo stack in the CircuitStore (not separate stacks per editor).
- Every operation — whether from visual or code — pushes to the same undo stack.
- Both Ctrl+Z in CodeMirror and Ctrl+Z in the visual editor call `CircuitStore.undo()`.
- Disable CodeMirror's native undo and wire it to CircuitStore instead.
**Affects Phase:** Phase 5 (bi-directional sync)

---

## Circuit Editor Performance Pitfalls

### Pitfall: React Re-Render Explosion on Large Circuits
**Risk Level:** Medium
**Warning Signs:** Noticeable lag when dropping gates on circuits with 50+ gates. React DevTools shows full grid re-rendering on each gate change.
**Prevention:**
- Memoize each `CircuitCell` with `React.memo` — re-render only when that cell's gate changes.
- Use Zustand's selective subscriptions: each cell subscribes only to its own gate slot, not the full circuit.
- Virtualize the circuit grid (only render visible cells) once circuits exceed ~30 qubits × 50 columns.
- Profile with React DevTools Profiler before optimization — don't prematurely over-engineer.
**Affects Phase:** Phase 2 (visual editor)

---

### Pitfall: Canvas/SVG Rendering at Scale
**Risk Level:** Low
**Warning Signs:** Bloch sphere or statevector histogram becomes sluggish with many qubits.
**Prevention:**
- Use React Three Fiber for Bloch sphere — GPU-accelerated via WebGL.
- For statevector histograms with 2^n bars (n > 16), only render the top-k highest-probability states.
- Add an "advanced view" toggle for high-qubit visualizations rather than trying to display all 2^20 amplitudes.
**Affects Phase:** Phase 4 (visualizations)

---

## Hardware Provider API Pitfalls

### Pitfall: IBM Quantum Rate Limiting (HTTP 429)
**Risk Level:** High
**Warning Signs:** Job status polling returns 429 errors. Users see stuck "queued" status.
**Prevention:**
- Use exponential backoff for job status polling: 5s → 10s → 30s → 60s.
- Never poll more than once per 10 seconds by default. Let users configure poll frequency.
- Cache the last job state — show "last checked: 2m ago" rather than live polling.
- Handle 429 gracefully: show "IBM API rate limit reached — retrying in Xs" rather than an error.
**Affects Phase:** Phase 7 (hardware submission)

---

### Pitfall: Provider API Versioning Instability
**Risk Level:** Medium
**Warning Signs:** Jobs fail after a provider API update. IBM Quantum has changed their REST API multiple times.
**Prevention:**
- Isolate each provider behind an adapter class. API changes only require updating the adapter, not the UI.
- Pin provider SDK versions in the FastAPI backend's `requirements.txt`.
- Add integration tests that mock provider responses — so version bumps are detected before deployment.
**Affects Phase:** Phase 7–8 (hardware providers)

---

### Pitfall: Credential Storage Security
**Risk Level:** High
**Warning Signs:** User credentials or provider tokens stored in localStorage or transmitted without encryption.
**Prevention:**
- Never store IBM/AWS/IonQ credentials server-side.
- Store provider tokens in `sessionStorage` (cleared on tab close), never `localStorage`.
- For BYOK AI keys: same rule — `sessionStorage` only, with a visible "your key is stored locally" notice.
- All API calls to providers go through the FastAPI backend proxy — never expose provider API endpoints to the browser.
**Affects Phase:** Phase 7 (hardware submission) + Phase 4 (AI copilot)

---

## AI Copilot Pitfalls

### Pitfall: QASM Version Hallucination (OpenQASM 2.0 vs 3.0)
**Risk Level:** High
**Warning Signs:** AI-suggested code looks correct but uses syntax from the wrong QASM version. Silent failures or cryptic errors when applying suggestions.
**Prevention:**
- Always specify in the LLM system prompt: "Output ONLY valid OpenQASM 3.0. Do not use any OpenQASM 2.0 syntax."
- Include QASM 3.0 schema examples in the system prompt context.
- Validate all LLM output through a QASM 3.0 parser before applying. Reject and retry (once) on parse failure.
- Show the user: "AI output was invalid QASM — suggestion rejected" with the raw output visible.
**Affects Phase:** Phase 6 (AI copilot)

---

### Pitfall: Large Circuit Context Exceeds LLM Token Limit
**Risk Level:** Medium
**Warning Signs:** API returns token limit errors for circuits with many gates.
**Prevention:**
- Truncate circuit context intelligently: send the last N gates (sliding window) around the cursor position.
- Include circuit metadata (num qubits, depth, goal) as a compact summary instead of full QASM.
- Warn user: "Circuit is too large for AI context — showing partial circuit" with a qubit/gate count indicator.
**Affects Phase:** Phase 6 (AI copilot)

---

## Quantum-Specific UX Pitfalls

### Pitfall: Opaque Simulator Error Messages
**Risk Level:** High
**Warning Signs:** User sees "simulation failed" or a raw Python stack trace with no guidance.
**Prevention:**
- Catch all Qiskit exceptions and translate to user-friendly messages:
  - `QiskitError: Qubit index out of range` → "Gate [H] targets qubit 5, but circuit only has 4 qubits."
  - `TranspilerError: No path found` → "This circuit can't run on [IBM Brisbane] — the qubit connectivity doesn't support this layout."
- Add live circuit linting: highlight gates that violate constraints BEFORE running simulation.
**Affects Phase:** Phase 3 (simulation) + Phase 2 (visual editor linting)

---

### Pitfall: Beginners Overwhelmed by Gate Palette Size
**Risk Level:** Medium
**Warning Signs:** Onboarding drop-off. Users report "I don't know where to start."
**Prevention:**
- Default view shows a "Beginner" palette with ~10 core gates (H, X, Y, Z, CNOT, MEASURE).
- "Advanced" toggle reveals the full gate library (S, T, Rx/Ry/Rz, Toffoli, SWAP, U3, etc.).
- Algorithm templates provide pre-filled circuits so users start with something that works.
- Add a "Quick Start" mode that walks through creating a Bell state in 3 steps.
**Affects Phase:** Phase 2 (visual editor UX)

---

## Full Rewrite Pitfalls

### Pitfall: No Usable Product Until Late in Development
**Risk Level:** High
**Warning Signs:** Extensive infrastructure and "foundation" work for 3+ months with nothing demonstrable.
**Prevention:**
- Ship a usable circuit editor with basic simulation by end of Phase 2–3 (visual editor + WASM sim).
- Use "walking skeleton" approach: get one end-to-end path working first (drag gate → simulate → see result).
- Resist adding features before the walking skeleton works.
- Deploy to Vercel after Phase 2 — even if rough, get real user feedback early.
**Affects Phase:** All phases

---

### Pitfall: Underestimating QASM Parser Complexity
**Risk Level:** Medium
**Warning Signs:** Code-to-visual sync fails silently for edge cases (multi-controlled gates, parametric angles, barriers).
**Prevention:**
- Don't write a custom QASM parser. Use an existing library: `openqasm3` (Python), `qasm-ts` (TypeScript), or compile Qiskit's QASM parser to WASM.
- Validate the parser against the OpenQASM 3.0 test suite before depending on it.
- Document all unsupported QASM constructs explicitly (classical registers, if/else, complex custom gates).
**Affects Phase:** Phase 1 (circuit core) + Phase 5 (sync)
