---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/lib/sim/complex.ts
  - src/lib/sim/gates.ts
  - src/lib/sim/statevector.ts
  - src/lib/sim/simulate.ts
  - src/lib/sim/index.ts
  - src/lib/sim/__tests__/simulate.test.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Bell state (H on q0, CNOT q0→q1) produces amplitudes [0.707, 0, 0, 0.707]"
    - "Single qubit H gate applied to |0⟩ produces [0.707, 0.707]"
    - "Simulation refuses to run and returns error for >20 qubit circuits"
    - "All test cases pass with `npm test`"
  artifacts:
    - "src/lib/sim/complex.ts — Complex number type + arithmetic"
    - "src/lib/sim/gates.ts — Unitary matrix per GateType"
    - "src/lib/sim/statevector.ts — applyGate() via tensor product + sparse kronecker"
    - "src/lib/sim/simulate.ts — simulate(circuit): SimResult"
    - "src/lib/sim/__tests__/simulate.test.ts — red → green TDD cycle"
  key_links:
    - "simulate() accepts CircuitState (from src/types/circuit.types.ts) — no new schema"
    - "SimResult type exported from src/lib/sim/index.ts for consumption by sim store"
---

# Plan 3.1: Pure-TypeScript Statevector Engine (TDD)

<objective>
Build a pure-TypeScript statevector simulation engine that takes a CircuitState and returns
amplitudes, probabilities, Bloch vectors, and error state.

Purpose: The core math engine — every visualization in Phase 3 derives from this. Zero cold-start.
Output: src/lib/sim/ module; SimResult type ready for consumption by the sim store.
</objective>

<context>
Load for context:
- src/types/circuit.types.ts (Gate, CircuitState — do NOT redefine)
- .planning/DECISIONS.md Phase 3 section (engine decision)
- src/lib/sim/__tests__/simulate.test.ts (write this first — TDD)
</context>

<tasks>

<task type="auto">
  <name>Write failing tests (Red phase)</name>
  <files>src/lib/sim/__tests__/simulate.test.ts</files>
  <action>
    Write Vitest unit tests for simulate() before implementation exists. Test cases:
    1. H on q0 → statevector [0.707+0i, 0.707+0i], probabilities {0: 0.5, 1: 0.5}
    2. X on q0 → statevector [0+0i, 1+0i], probabilities {1: 1.0}
    3. Bell state (H q0, CNOT q0→q1) → probabilities {00: 0.5, 11: 0.5} within ε=1e-9
    4. RX(π) on q0 → statevector equivalent to X gate (within ε=1e-9)
    5. 21-qubit circuit → throws SimError with code 'QUBIT_LIMIT_EXCEEDED'
    Import simulate from '../simulate' (doesn't exist yet — tests must fail).
    AVOID: importing from @/ alias — use relative paths within src/lib/sim/
  </action>
  <verify>npx vitest run src/lib/sim/__tests__/simulate.test.ts — expect FAIL (RED)</verify>
  <done>Tests exist and fail because simulate() is not implemented.</done>
</task>

<task type="auto">
  <name>Implement engine — complex, gates, statevector, simulate (Green phase)</name>
  <files>
    src/lib/sim/complex.ts
    src/lib/sim/gates.ts
    src/lib/sim/statevector.ts
    src/lib/sim/simulate.ts
    src/lib/sim/index.ts
  </files>
  <action>
    1. complex.ts — export `type Complex = {re: number; im: number}`. Helper fns: add, mul, abs2, scale.

    2. gates.ts — export `gateMatrix(gate: Gate): Complex[][]` returning 2x2 or 4x4 unitary matrices.
    Cover: H, X, Y, Z, S, T, Sdg, Tdg, RX(θ), RY(θ), RZ(θ), P(θ), U3(θ,φ,λ).
    Two-qubit gates (CNOT, CZ, SWAP) return 4x4. Toffoli returns 8x8.
    MEASURE and BARRIER: return null (skip in simulation).

    3. statevector.ts — export `applyGate(sv: Complex[], gate: Gate, numQubits: number): Complex[]`.
    Use the full 2^n × 2^n tensor-expanded unitary via kronecker product.
    AVOID: a dense full-matrix approach for >10 qubits — use sparse gate application iterating over
    2^n state indices directly (bitwise target mask). This keeps memory O(2^n) not O(4^n).

    4. simulate.ts — export SimError type and simulate():
    ```typescript
    export type SimResult = {
      statevector: Complex[];
      probabilities: Record<string, number>;  // basis string e.g. "01" → prob
      blochVectors: Array<{x:number; y:number; z:number} | null>;  // null if entangled
      gateCount: number;
      depth: number;
      error?: { code: string; message: string };
    }
    export function simulate(circuit: CircuitState): SimResult
    ```
    Guard: if numQubits > 20, return error {code: 'QUBIT_LIMIT_EXCEEDED'}.
    Bloch vector for qubit k: reduce density matrix, compute ⟨X⟩, ⟨Y⟩, ⟨Z⟩.
    Entanglement detection: Schmidt rank > 1 → blochVectors[k] = null.
    Circuit depth = max column index of any gate + 1.

    5. index.ts — re-export: `export { simulate } from './simulate'; export type { SimResult } from './simulate'`

    AVOID: Any React imports — this is pure math, no UI dependencies.
  </action>
  <verify>npx vitest run src/lib/sim/__tests__/simulate.test.ts — expect PASS (GREEN)</verify>
  <done>All 5 test cases pass. Bell state probabilities {00: 0.5, 11: 0.5} within ε=1e-9. 21q circuit throws QUBIT_LIMIT_EXCEEDED.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npx vitest run src/lib/sim` passes all tests GREEN
- [ ] No imports from React or any UI lib inside src/lib/sim/
- [ ] SimResult type is exported from src/lib/sim/index.ts
</verification>

<success_criteria>
- [ ] Bell state test passes with correct probability distribution
- [ ] Qubit limit guard returns error for >20 qubits
- [ ] Engine is a self-contained pure-TS module with no UI dependencies
</success_criteria>
