# Quantum Programming Studio

## What This Is

A browser-based, full-stack quantum computing IDE that lets solo quantum researchers and students visually compose quantum circuits, simulate them instantly, and submit jobs to real hardware — all in one cohesive UX. It combines a visual drag-and-drop circuit editor with a live-synced code editor, embedded simulation, AI-assisted development, and cross-provider hardware access. The existing codebase is being **rewritten from scratch** as a pure web application.

## Core Value

**Instant visual-to-simulation feedback loop** — a researcher drags gates, sees the circuit update in real time, and gets simulation results without leaving the browser. If this feels slow or broken, nothing else matters.

## Requirements

### Validated

(None yet — full rewrite, ship to validate)

### Active

**Rapid Prototyping Features:**

- [ ] Live-sync code editor: bi-directional split-view where drag-and-drop circuit ↔ Qiskit/Q# code stay in sync
- [ ] Instant simulation: WASM statevector simulator for ≤18–20 qubits with zero-latency feedback; cloud offload for larger circuits
- [ ] Bloch sphere rendering and statevector visualization updating live
- [ ] Quantum algorithm templates: pre-built parameterized circuits (Grover's, VQE, QAOA, QFT, Shor's, Bell states, etc.)
- [ ] Noise model playground: configurable noise models (depolarizing, T1/T2 decay, readout error)
- [ ] AI-assisted gate suggestion: BYOK copilot-style autocomplete using circuit state as context
- [ ] One-click hardware submit: IBM Quantum, AWS Braket, Azure Quantum, IonQ integration

**Market Readiness Features:**

- [ ] Noise profile simulation: overlay real backend error rates (e.g., IBM Brisbane) onto simulation
- [ ] Hardware transpiler & optimizer: automatic transpilation to native gate sets with optimization passes
- [ ] Job management dashboard: unified view across providers with status, queue, results, cost, and history
- [ ] Team collaboration & version control: git-backed versioning, circuit diffs, real-time multiplayer, comments, access controls
- [ ] Error mitigation toolbox: ZNE, PEC, readout error mitigation as toggleable layers
- [ ] Classical-quantum hybrid workflow engine: pipeline builder for VQE/QAOA with classical optimizer orchestration

### Out of Scope

- Desktop/Electron app — pure web app only; desktop may come later
- Hosting/managing user API keys server-side — BYOK model, keys stored client-side
- Building a custom quantum language — leverage Qiskit and Q# as target languages
- Monetization infrastructure for v1 — freemium model TBD after product is built
- Mobile-optimized UI — desktop browser is the primary target

## Context

**Market Landscape:**
- IBM Composer, AWS Braket notebooks, and Quirk are the current players
- None offer the full stack in one cohesive UX
- Biggest gaps: AI assistant layer, cross-provider job orchestration, experiment tracking
- If the studio nails those three alongside a clean visual composer, it stands out meaningfully

**Existing Codebase (reference only — not being reused):**
- React 18 + TypeScript + CRA + react-dnd + vanilla CSS
- Drag-and-drop circuit editor with gate palette, circuit canvas, QuantumGate/QuantumCircuit classes
- Multiple corrupted/mismatched source files (QuantumCircuitEditor.tsx, QuantumCircuit.ts, GatePalette.tsx)
- Decision: **full rewrite from scratch**, existing code serves as domain knowledge only

**Simulation Architecture:**
- Hybrid approach: lightweight WASM simulator client-side (≤18–20 qubits)
- Cloud backend (Node/Python with Qiskit Aer) for circuits beyond 20 qubits
- Transparent handoff with "running on cloud simulator" status indicator
- Casual users never notice a server exists; power users get headroom

**AI Architecture:**
- BYOK (Bring Your Own Key) — users provide OpenAI or Anthropic API keys
- Copilot-style first: context-aware autocomplete from circuit state (JSON/QASM) + recent actions → diffs/continuations
- Text-to-circuit later: NL prompt → LLM structured output → validated circuit JSON → visual render (labeled "experimental")

## Constraints

- **Deployment**: Pure web app — must work entirely in the browser for core functionality
- **Simulation**: Client-side WASM capped at ~18–20 qubits; cloud backend needed beyond that
- **AI Keys**: No key management server-side — BYOK model means users provide their own LLM API keys
- **Target User**: v1 UX optimized for solo quantum researchers/students, not enterprise teams
- **Tech Stack**: Open to any modern stack — CRA is deprecated, Vite or similar preferred

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full rewrite from scratch | Existing code has corrupted files and architectural debt; clean start is faster | — Pending |
| Pure web app (no Electron) | Lowers distribution friction; researcher just opens a URL | — Pending |
| WASM + cloud hybrid simulation | Instant feedback for small circuits; cloud scales for larger ones without upfront cost | — Pending |
| BYOK for AI keys | Avoids API cost liability; users control their own spending | — Pending |
| Copilot-style AI first | More reliable, higher immediate value; text-to-circuit layered on top later | — Pending |
| Visual composer → experiment tracking → job orchestration | Build the foundation first; tracking proves value; orchestration last due to complexity | — Pending |
| v1 targets solo researchers/students | Focused UX for rapid prototyping; team features defer to later milestones | — Pending |
| Freemium model (TBD) | Not decided yet — finalize after building the product | — Pending |

---
*Last updated: 2026-03-01 after initialization*
