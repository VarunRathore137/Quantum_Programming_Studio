# Research Summary — Quantum Programming Studio

## TL;DR

A full-stack browser quantum IDE is technically feasible in 2025, with a clear modern stack. The three biggest competitive gaps — AI copilot, cross-provider job orchestration, and real-time experiment tracking — are real and buildable. The highest-risk areas are bi-directional sync (infinite loops) and WASM simulation memory limits.

---

## Stack

**Recommended stack:**

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite 6 + TypeScript 5 |
| Drag-and-Drop | dnd-kit v6 |
| Code Editor | CodeMirror 6 |
| WASM Simulator | Pyodide + Qiskit (Web Worker) |
| Cloud Sim Backend | FastAPI + Qiskit Aer (Railway) |
| 3D Visualization | React Three Fiber (Three.js) |
| 2D Charts | Recharts / D3.js |
| State Management | Zustand + TanStack Query |
| Collaboration | Y.js + Liveblocks |
| Styling | Tailwind v4 + shadcn/ui |
| Testing | Vitest + Playwright |
| Deploy | Vercel (frontend) + Railway (backend) |

**Key stack decisions:**
- Vite over CRA (deprecated) — mandatory
- CodeMirror 6 over Monaco — better for collaboration and lighter bundle
- Pyodide for WASM sim — avoids custom C++ WASM compilation
- Zustand over Redux — far less boilerplate for IDE state

---

## Table Stakes Features (must ship in v1)

- Drag-and-drop gate placement on qubit × column grid
- Standard gate set (H, X, Y, Z, CNOT, SWAP, RX/RY/RZ, MEASURE)
- Undo/redo, gate deletion, qubit count control
- QASM and Qiskit Python export
- Instant WASM statevector simulation (≤20 qubits)
- Probability histogram + Bloch sphere visualization
- Algorithm templates (Bell state, GHZ, QFT at minimum)

---

## Top Differentiators (why users choose us)

1. **Bi-directional live sync** — visual ↔ Qiskit code in real time (no competitor has this)
2. **Instant WASM simulation with zero cloud config** — Quirk does client-side sim but can't export; IBM requires cloud
3. **AI copilot (BYOK)** — no competitor offers in-IDE gate suggestions
4. **Cross-provider hardware submit** — IBM + AWS + Azure + IonQ in one UI
5. **Unified experiment tracking / job dashboard** — biggest researcher pain point

---

## Architecture: Critical Decisions

1. **Circuit data model = gate list with column indices** (serializable to QASM 3.0). Every component reads from this SSOT.
2. **Bi-directional sync uses change-source tagging** to prevent feedback loops. Single undo/redo stack across both editors.
3. **WASM simulation runs in a Web Worker** (Pyodide + Qiskit). Hard cap at 20 qubits — transparent cloud offload beyond that.
4. **Hardware providers use Adapter Pattern** — all speak OpenQASM 3.0 inward, provider-specific REST outward.
5. **AI copilot uses structured LLM output** (OpenAI function calling / Anthropic tool use) → `CircuitDiff` JSON → validated before apply.

---

## Recommended Build Order

1. Circuit core (data model + QASM serialization)
2. Visual circuit editor (dnd-kit grid, gate palette, undo/redo)
3. WASM simulation (Pyodide worker, statevector)
4. Visualizations (Bloch sphere, histogram)
5. Code editor + bi-directional sync (CodeMirror 6)
6. Algorithm templates
7. AI copilot (BYOK)
8. Cloud sim backend (FastAPI + Qiskit Aer)
9. Noise models
10. Hardware submission (IBM → others)
11. Job dashboard
12. Collaboration (v2)

---

## Top 5 Risks to Watch

| Risk | Severity | Mitigation |
|------|----------|------------|
| 4GB WASM memory wall at >20 qubits | 🔴 High | Hard-cap at 20q, transparent cloud offload |
| Infinite update loops in bi-directional sync | 🔴 High | Change-source tagging + `isUpdating` mutex |
| QASM version hallucination (AI copilot) | 🔴 High | Validate all LLM output via QASM parser before applying |
| No usable product until late | 🔴 High | Walking skeleton: editor + sim working by Phase 2–3 |
| Pyodide cold start latency (3–8s) | 🟡 Medium | Eager load on app start + Cache API persistence |
