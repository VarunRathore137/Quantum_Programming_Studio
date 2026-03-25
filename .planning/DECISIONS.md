# DECISIONS.md — Quantum Programming Studio

---

## Phase 1 Decisions

**Date:** 2026-03-01

---

### 1. Architecture — Full-Stack from Day One

**Chose:** Option B — Full-stack from day one.

- **Frontend:** Vite + React 19 + TypeScript + Zustand
- **Backend:** FastAPI (Python) — scaffolded in Phase 1
- **Deployment:** Railway (backend `/health` endpoint live in Phase 1), Vercel (frontend)
- **Reason:** Establishes the React ↔ FastAPI/Qiskit connection early, avoids a painful integration later when simulation logic depends on this pipe.

---

### 2. Circuit Data Model — Full Schema Upfront

**Chose:** Option B — Full schema upfront.

The `CircuitStore` Zustand schema must support from Phase 1:

- **Parametric Gates:** Gate objects include an optional `params` field for angles (`θ`, `φ`, `λ`).
- **Multi-Qubit Support:** Gates support arrays of `targets` and `controls` (CNOT, Toffoli, etc.).
- **Metadata:** UI positioning and custom label fields so the circuit grid and any future 3D scene stay synced.
- **Backend-friendly Serialization:** JSON shape that a Python/Qiskit backend can ingest without heavy pre-processing.
- **Reason:** Avoids a cascading refactor in Phase 2 when parametric and multi-qubit gates are introduced.

---

### 3. QASM Export — Dual 2.0 + 3.0

**Chose:** Option B — Export both OpenQASM 2.0 and 3.0.

- **QASM 2.0 ("Compatibility Mode"):** Default; compatible with current Qiskit and IBM backends.
- **QASM 3.0 ("Advanced Mode"):** Fulfils the project spec; supports future hybrid workflows.
- **Implementation:** Two separate frontend transpiler functions (`toQASM2`, `toQASM3`); the Zustand store is the single source of truth for both.
- **Reason:** Satisfies the spec *and* ensures the tool is usable with today's IBM/Qiskit toolchain.

---

### 4. State Persistence — IndexedDB via Dexie.js behind a StorageAdapter

**Chose:** IndexedDB (Dexie.js) as primary store, behind a `StorageAdapter` interface.

**Architecture:**

| Layer | Technology | Data |
|-------|-----------|------|
| Primary (async) | IndexedDB via Dexie.js | Circuit JSON, project metadata |
| Secondary (sync) | localStorage | UI prefs: dark mode, sidebar state, BYOK API key |

**StorageAdapter interface (TypeScript):**
```typescript
interface StorageAdapter {
  save(key: string, data: unknown): Promise<void>
  load(key: string): Promise<unknown | null>
  delete(key: string): Promise<void>
  list(): Promise<string[]>
}
```

**Rules:**
- The Zustand store **never** calls Dexie or localStorage directly.
- The store exposes explicit async actions (`loadProject`, `saveProject`) that delegate to the adapter.
- Do **not** use Zustand `persist` middleware with an async engine (hydration timing problem).

**Phase 1 ships:** `IndexedDBAdapter` (Dexie.js).  
**Future swap:** `RemoteStorageAdapter` (FastAPI `/projects` + PostgreSQL on Railway) — IndexedDB becomes a local cache / offline fallback, no other code changes required.

**Reason:** No 5 MB limit, non-blocking, structurally ready for backend persistence swap without touching the rest of the codebase.

---

### 5. Deployment — Platform-Native CI/CD

**Chose:** Option B — Manual deploy / platform-native integration. No custom GitHub Actions YAML in Phase 1.

- **Backend (Railway):** "Deploy on Push" — Railway auto-deploys from the connected GitHub repo on every push to `main`.
- **Frontend (Vercel):** GitHub repo linked to Vercel project — auto-deploys on push to `main`.
- **Reason:** Keeps Phase 1 focused on scaffolding the core architecture, not DevOps overhead. Custom CI/CD pipeline deferred to a later phase if needed.

---

## Phase 2 Decisions

**Date:** 2026-03-09 (in discussion — to be finalized)

### Open Questions

1. **Drag-and-drop library** — Use `@dnd-kit/core` vs raw HTML5 Drag API vs React-DnD?
2. **Multi-qubit gate UX** — Click-to-place (click control, then click target) vs drag-with-range-indicator?
3. **Canvas rendering** — Pure CSS grid vs SVG overlay vs HTML5 Canvas for gate rendering and connection lines?
4. **Undo/redo scope** — Apply to individual gate placements (granular) or to "commit" actions (batched)?
5. **Gate palette organization** — Separate panel vs floating toolbar? Draggable palette?

### Decisions TBD after discussion

---

## Phase 3 Decisions

**Date:** 2026-03-25

---

### 1. Simulation Engine — Hybrid Pure-TS + Cloud Stub

**Chose:** Option C — Pure-TypeScript statevector engine for ≤20 qubits, cloud stub for >20 qubits.

- **Local engine:** Pure-TS matrix math (~300 lines). Zero cold-start, zero WASM loading, full browser debuggability.
- **Cloud stub (SIM-03):** Circuits with >20 qubits display a "☁ Running on cloud simulator" badge and return no results. Cloud wired fully in Phase 6.
- **Hard cap:** Detect qubit count BEFORE simulation starts. Never attempt WASM at >20q.
- **Reason:** Covers 99% of real usage (Bell, Grover, VQE ansätze), zero cold-start friction, and provides the natural upgrade path to Phase 6 cloud backend.

---

### 2. Simulation Trigger — Debounced Auto-Sim (400ms)

**Chose:** Automatic simulation on every circuit change with a 400ms debounce. No manual "Run" button required.

- **Debounce:** 400ms idle after last circuit mutation fires the simulation.
- **Cancellation:** In-flight simulation is cancelled on each new change (AbortController pattern).
- **Reason:** "Instant feedback loop" is the core value prop. A Run button breaks that UX flow. Debounce prevents mid-drag simulation noise.

---

### 3. Entangled Qubit Bloch Sphere — Opacity Fade + Badge

**Chose:** Semi-transparent Bloch sphere + `⟨ψ⟩ entangled` badge for qubits in entangled states.

- **Visual:** Sphere rendered at ~35% opacity to signal "degraded information".
- **Badge:** Small label overlay — `⟨ψ⟩ entangled` — communicates the state honestly without exposing density matrix math.
- **Reason:** Greying out feels broken; density matrix display is correct but too advanced for students. Fade + badge communicates "the qubit exists but has no independent state" intuitively.

---

### 4. GAP-01 & GAP-02 — Subsumed into Phase 3 Plans

**Chose:** Fold GAP-01 (React.memo perf) and GAP-02 (circuit linting) into Phase 3 rather than executing as standalone plans.

- **GAP-01 rationale:** Auto-sim fires on every circuit change — React re-render performance is now critical, not optional.
- **GAP-02 rationale:** Circuit linting pairs naturally with the simulation error state and status bar introduced in Phase 3.
- **Result:** Phase 3 plans will absorb and close both gaps.

---

### 5. Probability Histogram — Top-32 with Virtual Scrolling

**Chose:** Display the top-32 highest-probability basis states; virtual scroll for the remainder.

- **Cap:** Top-32 covers 5-qubit circuits fully (2^5 = 32 states) and partial results for larger circuits.
- **Rendering:** For n > 5 qubits, render top-32 bars and expose virtual-scrolling list for all 2^n states.
- **Reason:** Top-16 is too restrictive (cuts off 5q circuits). Top-32 is the professional balance. Virtual scrolling keeps performance safe at 2^20 states.

