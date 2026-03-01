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
