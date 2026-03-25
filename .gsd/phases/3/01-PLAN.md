---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/lib/simulator/stateVector.ts
  - src/lib/simulator/applyGate.ts
  - src/lib/simulator/__tests__/stateVector.test.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "A pure-TypeScript statevector simulator exists with no external quantum dependencies"
    - "The simulator correctly evolves the state for H, X, Y, Z, S, T, CNOT, RX, RY, RZ gates"
    - "State vector probabilities sum to 1.0 (up to floating-point tolerance)"
    - "Bloch sphere angles (theta, phi) are derivable from any single-qubit statevector"
  artifacts:
    - "src/lib/simulator/stateVector.ts exists and exports SimulatorResult"
    - "src/lib/simulator/applyGate.ts exists and exports applyGate()"
    - "src/lib/simulator/__tests__/stateVector.test.ts passes all cases"
  key_links:
    - "simulateCircuit() reads from CircuitState (same type used by circuitStore.ts)"
    - "applyGate() handles all GateType values defined in gateDefinitions.ts"
---

# Plan 3.1: Quantum State Vector Simulation Engine

<objective>
Build a pure-TypeScript quantum statevector simulator that can compute the exact quantum
state |ψ⟩ for any circuit built with the existing gate set.

Purpose: This is the core computational engine that makes Simulate button functional.
Without this, the Bloch sphere and probability charts can only show mock/static data.

Output: Two new library files + a comprehensive test suite.
</objective>

<context>
Load for context:
- src/types/circuit.types.ts
- src/lib/gates/gateDefinitions.ts (for GateType enum and gate metadata)
- src/lib/qasm/__tests__/toQASM.test.ts (reference pattern for vitest tests)
</context>

<tasks>

<task type="auto">
  <name>Implement complex-number statevector engine</name>
  <files>
    src/lib/simulator/stateVector.ts
    src/lib/simulator/applyGate.ts
  </files>
  <action>
    Create `src/lib/simulator/stateVector.ts`:
    - Define `Complex = { re: number; im: number }` type
    - Define `StateVector = Complex[]` (length = 2^numQubits)
    - Export `initStateVector(numQubits: number): StateVector` — returns |00…0⟩ (index 0 = 1+0i, rest = 0)
    - Export `computeProbabilities(sv: StateVector): number[]` — returns |amplitude|² for each basis state
    - Export `blochAngles(sv: StateVector, qubit: number): { theta: number; phi: number }` — 
      reduces statevector to single-qubit density matrix via partial trace, computes Bloch angles.
      Use: theta = 2*acos(|alpha|), phi = atan2(im(beta*), re(beta*)) where alpha=<0|psi_q>, beta=<1|psi_q>
    - Export `SimulatorResult = { stateVector: StateVector; probabilities: number[]; blochAngles: { theta: number; phi: number }[] }`
    - Export `simulateCircuit(circuit: CircuitState): SimulatorResult`

    Create `src/lib/simulator/applyGate.ts`:
    - Export `applyGate(sv: StateVector, gate: Gate, numQubits: number): StateVector`
    - Implement unitary matrix application for ALL GateType values:
      * Single-qubit unitaries (2×2 matrices): H, X, Y, Z, S, T, Sdg, Tdg, RX, RY, RZ, P, U3
      * Two-qubit: CNOT (target/control from gate.qubits[0]/[1]), CZ, SWAP
      * Three-qubit: Toffoli (CCX) using direct 8×8 matrix or decomposition
      * MEASURE: force basis collapse = treat as identity (probabilistic collapse not needed for display)
      * BARRIER: no-op (identity operator)
    - Process gates in ascending column order (sort by gate.column before applying)
    - Use direct tensor product expansion: for single-qubit gate on qubit k, build 2^n × 2^n matrix via Kronecker product

    AVOID: Importing any quantum runtime or external math library not in package.json.
    AVOID: Using Float64Array for the state vector — plain Complex[] arrays are more maintainable and type-safe.
    AVOID: Iterating over all 2^n indices naively for large n without comment — n≤10 is our practical limit (1024 states max).
  </action>
  <verify>
    npx vitest run src/lib/simulator/__tests__/stateVector.test.ts
  </verify>
  <done>
    All simulator tests pass (npx vitest run exits 0).
    simulateCircuit on [H q[0], CNOT q[0]→q[1]] returns probabilities ≈ [0.5, 0, 0, 0.5] (Bell state).
  </done>
</task>

<task type="auto">
  <name>Write simulator unit tests (TDD: write tests first)</name>
  <files>
    src/lib/simulator/__tests__/stateVector.test.ts
  </files>
  <action>
    Create comprehensive tests covering:
    1. initStateVector(2) → sv[0].re === 1, all others === 0
    2. H on q[0] of |00⟩ → probabilities ≈ [0.5, 0.5, 0, 0]
    3. X on q[0] of |00⟩ → probabilities ≈ [0, 1, 0, 0]
    4. CNOT control=q[0], target=q[1] after H on q[0] → Bell state probabilities ≈ [0.5, 0, 0, 0.5]
    5. SWAP q[0]↔q[1] on |01⟩ → probabilities ≈ [0, 0, 1, 0]
    6. computeProbabilities: probabilities always sum to 1.0 (±1e-10 tolerance)
    7. blochAngles: |0⟩ state → theta≈0; after H → theta≈π/2; after X → theta≈π
    8. simulateCircuit on empty gate list → probabilities[0] === 1
    9. RX(π) on q[0] of |0⟩ → probabilities ≈ [0, 1] (same as X gate)
    10. CZ gate: applied to |11⟩ → adds phase flip, probabilities unchanged but state phase differs

    Use vitest `describe/it/expect`. Use `toBeCloseTo` (not `toBe`) for all floating-point assertions.
    Import from '@/lib/simulator/stateVector' and '@/lib/simulator/applyGate'.
    Use the same `makeCircuit` helper pattern from src/lib/qasm/__tests__/toQASM.test.ts.

    AVOID: Writing tests that rely on exact complex amplitude values (only test probabilities and bloch angles).
    AVOID: Testing MEASURE gate behaviour — it's treated as identity.
  </action>
  <verify>
    npx vitest run src/lib/simulator/__tests__/stateVector.test.ts
  </verify>
  <done>
    Tests file exists, all 10 test cases written. Re-run after implementing stateVector.ts — all must pass (green).
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npx vitest run src/lib/simulator/__tests__/stateVector.test.ts` exits 0
- [ ] Bell state (H+CNOT) gives probabilities ≈ [0.5, 0, 0, 0.5]
- [ ] Single-qubit Bloch angles are correct for |0⟩, |+⟩, |1⟩
- [ ] `npm run build` exits 0 (no TypeScript errors introduced)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] No new TypeScript errors in tsc build
</success_criteria>
