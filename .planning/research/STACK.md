# Stack Research — Quantum Programming Studio

## Recommendations

### Frontend Framework
**Recommendation:** React 19 with concurrent features
**Rationale:** Largest ecosystem, best tooling for complex IDEs, Concurrent Mode handles simulation results streaming. Strong react-dnd/dnd-kit ecosystem. Alternatives (Vue, Svelte, SolidJS) have narrower ecosystems for IDE-class applications.
**Reject:** Angular — too opinionated/heavy for a DOM-intensive IDE. Svelte — ecosystem too thin for real-time collab + WASM integration complexity.
**Confidence:** High

---

### Build Tool
**Recommendation:** Vite 6
**Rationale:** CRA is officially deprecated. Vite is the standard — fast HMR, native ESM, first-class TypeScript, WASM support built-in (`vite-plugin-wasm`). Used by most serious React projects started post-2023.
**Reject:** CRA — deprecated, slow, legacy webpack. Webpack directly — too much manual config.
**Confidence:** High

---

### Language
**Recommendation:** TypeScript 5.x (strict mode)
**Rationale:** Already decided. Critical for a complex codebase with circuit models, gate types, provider APIs. Generic types for circuit nodes, strict null checks prevent quantum-state null bugs.
**Confidence:** High

---

### Drag-and-Drop
**Recommendation:** `dnd-kit` v6
**Rationale:** More flexible than react-dnd for custom 2D grid drop targets. Better accessibility, smaller bundle, no HTML5 backend limitations. Active maintenance. react-dnd has quirks with complex custom drop logic and is less actively maintained.
**Reject:** react-dnd — older API, less flexible for complex circuit grid. Native HTML5 drag — too limited for fine-grained DnD UX.
**Confidence:** High

---

### Code Editor
**Recommendation:** CodeMirror 6
**Rationale:** Purpose-built for collaborative editing and language extensions. Has built-in QASM language mode potential, supports Y.js bindings natively via `@codemirror/collab`. Monaco is heavier (5MB+) and designed for VS Code-style single-user editing — Y.js integration is a hack.
**Reject:** Monaco Editor — too heavy for real-time collab, Y.js integration is complex. `<textarea>` — obviously insufficient.
**Confidence:** High

---

### WASM Quantum Simulation (≤20 qubits)
**Recommendation:** Pyodide + Qiskit (Python WASM runtime)
**Rationale:** Pyodide runs Python in the browser via WebAssembly. Load `qiskit` and `numpy` directly — statevector simulation works up to ~18–20 qubits before memory limits. Zero custom C++ compilation needed. Alternative: compile Qiskit Aer directly to WASM32 via Emscripten (complex, high maintenance).
**Reject:** Custom C++ WASM — development cost too high for v1. QuTiP in browser — no stable WASM build.
**Note:** Pyodide initialization takes 3–5 seconds on first load — use a loading screen, cache the runtime. Run in a Web Worker to avoid blocking the main thread.
**Confidence:** Medium (Pyodide stability at this scale needs validation)

---

### Cloud Simulation Backend (>20 qubits)
**Recommendation:** FastAPI (Python) + Qiskit Aer
**Rationale:** Python-native, so Qiskit Aer integration is trivial. FastAPI is async, fast, and well-documented. Qiskit Aer is the gold-standard statevector simulator. Deploy on Railway or Fly.io for cost-effective auto-scaling.
**Reject:** Node.js backend for simulation — no native Qiskit bindings. Django — too heavy for an API-only backend.
**Confidence:** High

---

### 3D/2D Visualization
**Recommendation:** React Three Fiber (Three.js) for Bloch spheres + D3.js / custom SVG for statevector histograms
**Rationale:** React Three Fiber is the React-native way to use Three.js. Bloch sphere is a standard 3D sphere with qubit state vector rendering — well-suited for R3F. D3 for bar charts/histograms of probability amplitudes. Recharts as a simpler alternative for 2D-only charts.
**Reject:** Pure Three.js without R3F — too imperative, hard to integrate with React state. Plotly — heavy bundle for simple histograms.
**Confidence:** High

---

### State Management
**Recommendation:** Zustand (local) + Y.js (collaborative shared state)
**Rationale:** Zustand is minimal, performant, and TypeScript-friendly — perfect for circuit editor state (gates, selection, undo history). Y.js handles the CRDT-based shared state for real-time collab. TanStack Query for async server state (job status polling, API calls). Redux Toolkit is overkill for this architecture.
**Reject:** Redux — too much boilerplate. MobX — less composable with functional React. Recoil — deprecated.
**Confidence:** High

---

### Real-Time Collaboration
**Recommendation:** Y.js + Liveblocks (hosted Y.js infra)
**Rationale:** Y.js is the industry standard for CRDTs in web IDEs (used by Notion, CodeSandbox). Liveblocks provides managed WebSocket infra — no need to run your own y-websocket server. Circuit state maps naturally to Y.Map (gate ID → gate data). Cursor positions via Liveblocks presence.
**Reject:** Partykit — newer, less mature. Firebase Realtime DB — not CRDT, conflict resolution is manual. Socket.io — requires full custom implementation.
**Confidence:** High

---

### Styling
**Recommendation:** Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
**Rationale:** shadcn/ui provides accessible, unstyled components (dialogs, dropdowns, tooltips) built on Radix UI — critical for an IDE with many interactive elements. Tailwind handles layout and utilities. IDE-class UI (dark mode, dense information) is well-served by Tailwind's flexibility. Vanilla CSS won't scale at this complexity.
**Reject:** MUI — too opinionated, hard to customize for an IDE aesthetic. Bootstrap — dated. Pure vanilla CSS — not scalable for a complex component tree.
**Confidence:** High

---

### Testing
**Recommendation:** Vitest + Playwright
**Rationale:** Vitest is Vite-native (uses same config, faster than Jest). Playwright for E2E — handles canvas interactions, drag-and-drop, and WebSocket testing better than Cypress.
**Reject:** Jest — compatible but slower with Vite. Cypress — struggles with canvas-based UI and drag events.
**Confidence:** High

---

### Deployment
**Recommendation:** Vercel (frontend) + Railway (FastAPI backend)
**Rationale:** Vercel is optimal for Vite React apps — automatic preview deployments, edge CDN, no config. Railway handles Python FastAPI with automatic Docker builds, reasonable free tier, easy scaling.
**Reject:** AWS/GCP for v1 — operational overhead too high. Netlify — fewer features than Vercel for React apps.
**Confidence:** High

---

## Summary Table

| Layer | Choice | Version | Confidence |
|-------|--------|---------|------------|
| Frontend Framework | React | v19 | High |
| Build Tool | Vite | v6 | High |
| Language | TypeScript | v5.x | High |
| Drag-and-Drop | dnd-kit | v6 | High |
| Code Editor | CodeMirror 6 | v6 | High |
| WASM Simulator | Pyodide + Qiskit | latest | Medium |
| Cloud Sim Backend | FastAPI + Qiskit Aer | latest | High |
| 3D Visualization | React Three Fiber | v8 | High |
| 2D Charts | D3.js / Recharts | v7 / v2 | High |
| State Management | Zustand + Y.js + TanStack Query | latest | High |
| Collaboration | Y.js + Liveblocks | latest | High |
| Styling | Tailwind v4 + shadcn/ui | v4 | High |
| Testing | Vitest + Playwright | latest | High |
| Frontend Deploy | Vercel | — | High |
| Backend Deploy | Railway | — | High |
