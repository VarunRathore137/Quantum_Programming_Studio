# STATE.md — Quantum Programming Studio

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-01)

**Core value:** Instant visual-to-simulation feedback loop for solo quantum researchers and students
**Current focus:** Phase 4 — Code Editor & Bi-Directional Sync

---

## Current Phase

**Phase:** 4 — Code Editor & Bi-Directional Sync
**Status:** ⬜ Not started

---

## Phase Status

| # | Phase | Status |
|---|-------|--------|
| 1 | Foundation & Circuit Core | ✅ Complete |
| 2 | Visual Circuit Editor | ✅ Complete |
| 3 | Simulation & Visualization | ✅ Complete |
| 4 | Code Editor & Bi-Directional Sync | ⬜ Not started |
| 5 | Templates & AI Copilot | ⬜ Not started |
| 6 | Noise Models & Cloud Backend | ⬜ Not started |
| 7 | Hardware Submission | ⬜ Not started |

---

## Phase 1 Plans

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 1.1 | Project Re-Scaffold (Vite + React 19 + Tailwind v4) | 1 | ✅ Complete |
| 1.2 | Circuit Types + QASM Export (TDD) | 1 | ✅ Complete |
| 1.3 | QASM Import + Persistence (fromQASM + Dexie.js) | 2 | ✅ Complete |
| 1.4 | FastAPI Backend Skeleton | 2 | ✅ Complete |
| 1.5 | Project Sidebar + App Shell UI | 3 | ✅ Complete |

Plan files: `.planning/phases/1/01-PLAN.md` through `05-PLAN.md`
Summaries: `.planning/phases/1/01-SUMMARY.md` through `05-SUMMARY.md`

---

## Phase 2 Plans

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 2.1 | dnd-kit install + Undo/Redo + CircuitControls | 1 | ✅ Complete |
| 2.2 | Gate Palette — Beginner/Advanced Toggle | 1 | ✅ Complete |
| 2.3 | Circuit Grid + Drop Zones + PlacedGate | 2 | ✅ Complete |
| 2.4 | Multi-Qubit Gates — CNOT Visual Connector | 3 | ✅ Complete |
| 2.5 | Parametric Gate Angle Editor | 3 | ✅ Complete |

Plan files: `.planning/phases/2/01-PLAN.md` through `05-PLAN.md`

Wave structure:
- **Wave 1** (parallel): Plans 2.1, 2.2 — Foundation (deps, undo/redo, palette data)
- **Wave 2** (depends on Wave 1): Plan 2.3 — Circuit grid + drop zones
- **Wave 3** (depends on Wave 2, parallel): Plans 2.4, 2.5 — Multi-qubit + angle editor
- **Wave 4** (after Wave 3, parallel): GAP-01, GAP-02 — Performance + linting

---

## Phase 2 Gap Closure Plans

| Plan | Name | Priority | Wave | Status |
|------|------|----------|------|--------|
| GAP-01 | Performance — React.memo + Selective Subscriptions | 🟡 Medium | 4 | ⬜ Pending |
| GAP-02 | Circuit Linting — Highlight Invalid Gates | 🟡 Medium | 4 | ⬜ Pending |
| GAP-03 | Record Phase 2 Architecture Decisions | 🟢 Low | 0 (pre-exec) | ⬜ Pending |

Gap sources:
- GAP-01: PITFALLS.md — "React Re-Render Explosion on Large Circuits"
- GAP-02: PITFALLS.md — "Opaque Simulator Error Messages (Phase 2 linting aspect)"
- GAP-03: DECISIONS.md — Phase 2 open questions never formally resolved

---

## Planning Artifacts

| Artifact | Location | Status |
|----------|----------|--------|
| Project context | `.planning/PROJECT.md` | ✓ Complete |
| Workflow config | `.planning/config.json` | ✓ Complete |
| Stack research | `.planning/research/STACK.md` | ✓ Complete |
| Features research | `.planning/research/FEATURES.md` | ✓ Complete |
| Architecture research | `.planning/research/ARCHITECTURE.md` | ✓ Complete |
| Pitfalls research | `.planning/research/PITFALLS.md` | ✓ Complete |
| Research summary | `.planning/research/SUMMARY.md` | ✓ Complete |
| Requirements | `.planning/REQUIREMENTS.md` | ✓ Complete |
| Roadmap | `.planning/ROADMAP.md` | ✓ Complete |
| Phase 1 decisions | `.planning/DECISIONS.md` | ✓ Complete |
| Phase 1 plans | `.planning/phases/1/*.md` | ✓ Complete (5 plans) |
| Phase 2 plans | `.planning/phases/2/*.md` | ✓ Complete (5 plans) |
| Phase 3 plans | `.planning/phases/3/*.md` | ✓ Complete (6 plans) |

---

## Phase 3 Plans

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 3.1 | Pure-TS Statevector Engine (TDD) | 1 | ✅ Complete |
| 3.2 | Simulation Store + Auto-Sim Trigger | 2 | ✅ Complete |
| 3.3 | Probability Histogram + Statevector Display | 2 | ✅ Complete |
| 3.4 | Bloch Sphere Visualization | 3 | ✅ Complete |
| 3.5 | Status Bar + Circuit Metrics | 3 | ✅ Complete |
| 3.6 | React Performance + Circuit Linting (GAP-01+02) | 4 | ✅ Complete |

Wave structure:
- **Wave 1** (independent): Plan 3.1 — Pure-TS engine (TDD)
- **Wave 2** (depends on 3.1): Plans 3.2, 3.3 — Sim store + results visualization
- **Wave 3** (depends on 3.2): Plans 3.4, 3.5 — Bloch sphere + status bar
- **Wave 4** (depends on all): Plan 3.6 — Perf + linting

---

## Next Step

Run `/plan 4` to plan Phase 4.
