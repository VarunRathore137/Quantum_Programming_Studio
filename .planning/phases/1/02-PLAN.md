---
phase: 1
plan: 2
wave: 2
type: tdd
depends_on: ["1.1"]
files_modified:
  - src/types/circuit.types.ts
  - src/lib/qasm/toQASM2.ts
  - src/lib/qasm/toQASM3.ts
  - src/lib/qasm/toQiskit.ts
  - src/lib/qasm/__tests__/toQASM.test.ts
  - src/lib/qasm/__tests__/toQiskit.test.ts
  - src/store/circuitStore.ts
autonomous: true

must_haves:
  truths:
    - "CircuitStore Zustand schema supports parametric gates, multi-qubit gates, and metadata"
    - "toQASM2() produces valid OpenQASM 2.0 for: single-qubit, CNOT, parametric (RX), and measurement gates"
    - "toQASM3() produces valid OpenQASM 3.0 header and gate syntax for the same gate set"
    - "toQiskit() produces executable Qiskit Python code for: single-qubit, CNOT, parametric (RX), and measurement gates"
    - "All transpiler tests pass (npm test -- --run)"
  artifacts:
    - "src/types/circuit.types.ts exists with GateDefinition, CircuitState, CircuitProject interfaces"
    - "src/store/circuitStore.ts exists with Zustand store (no persist middleware)"
    - "src/lib/qasm/toQASM2.ts and toQASM3.ts exist"
    - "src/lib/qasm/toQiskit.ts exists and passes ≥4 test cases"
    - "src/lib/qasm/__tests__/toQASM.test.ts exists with ≥6 test cases"
    - "src/lib/qasm/__tests__/toQiskit.test.ts exists with ≥4 test cases"
  key_links:
    - "CircuitStore is the single source of truth consumed by all Phase 2 visual editor components"
    - "toQASM2 / toQASM3 are the serialization layer used by Phase 4 bi-directional sync"
    - "toQiskit satisfies CIRCUIT-10 (Qiskit Python export) — no other phase covers this"

user_setup: []
---

# Plan 1.2: Circuit Types + QASM Export (TDD)

<objective>
Define the full circuit data model as TypeScript types, create the Zustand CircuitStore, and implement both OpenQASM 2.0 and OpenQASM 3.0 export transpilers using Test-Driven Development.

Purpose: The DECISIONS.md mandates a full schema upfront to avoid cascading Phase 2 refactors. TDD is appropriate here because the QASM serialization has well-defined edge cases (parametric gate angles, multi-qubit control/target ordering, measurement syntax) that are easy to test and hard to debug visually.
Output: Circuit type definitions, Zustand store, two QASM transpiler functions, and a test suite proving correctness.
</objective>

<context>
Load for context:
- .planning/DECISIONS.md (Decision 2: Full Schema Upfront, Decision 3: Dual QASM export)
- .planning/REQUIREMENTS.md (CIRCUIT-09, CIRCUIT-10)
- src/types/circuit.types.ts (will be created by this plan)
</context>

<tasks>

## Red Phase

<task type="auto">
  <name>Define circuit types + write failing QASM export tests</name>
  <files>
    src/types/circuit.types.ts
    src/lib/qasm/__tests__/toQASM.test.ts
  </files>
  <action>
    1. Create `src/types/circuit.types.ts` with these interfaces:
    ```ts
    export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Sdg' | 'Tdg'
      | 'CNOT' | 'CZ' | 'SWAP' | 'Toffoli'
      | 'RX' | 'RY' | 'RZ' | 'U3' | 'P'
      | 'MEASURE' | 'BARRIER';

    export interface Gate {
      id: string;            // UUID
      type: GateType;
      qubits: number[];      // [targetQubit] for single, [control, target] for two-qubit
      column: number;        // Time step (0-indexed)
      params?: {             // For parametric gates (RX, RY, RZ, U3, P)
        theta?: number;      // Angle in radians
        phi?: number;
        lambda?: number;
      };
      label?: string;        // Custom display label (optional, UI only)
    }

    export interface CircuitMetadata {
      name: string;
      description?: string;
      createdAt: string;     // ISO date string
      updatedAt: string;
    }

    export interface CircuitState {
      id: string;            // UUID
      metadata: CircuitMetadata;
      numQubits: number;     // 1–30
      numColumns: number;    // 1–100
      gates: Gate[];
    }

    export interface CircuitProject {
      id: string;
      metadata: CircuitMetadata;
      circuits: CircuitState[];
      activeCircuitId: string;
    }
    ```

    2. Create `src/lib/qasm/__tests__/toQASM.test.ts` with Vitest:
    ```ts
    import { describe, it, expect } from 'vitest'
    import { toQASM2 } from '../toQASM2'
    import { toQASM3 } from '../toQASM3'
    import type { CircuitState } from '@/types/circuit.types'

    // Helper to build a minimal circuit
    const makeCircuit = (g: CircuitState['gates'], nq = 2): CircuitState => ({
      id: 'test', numQubits: nq, numColumns: 4,
      metadata: { name: 'Test', createdAt: '', updatedAt: '' },
      gates: g
    })

    describe('toQASM2', () => {
      it('produces valid QASM 2.0 header for empty circuit', () => {
        const out = toQASM2(makeCircuit([]))
        expect(out).toContain('OPENQASM 2.0')
        expect(out).toContain('include "qelib1.inc"')
        expect(out).toContain('qreg q[2]')
        expect(out).toContain('creg c[2]')
      })
      it('serializes single-qubit H gate: h q[0];', () => {
        const out = toQASM2(makeCircuit([{ id:'1', type:'H', qubits:[0], column:0 }]))
        expect(out).toContain('h q[0];')
      })
      it('serializes CNOT gate: cx q[0],q[1];', () => {
        const out = toQASM2(makeCircuit([{ id:'1', type:'CNOT', qubits:[0,1], column:0 }]))
        expect(out).toContain('cx q[0],q[1];')
      })
      it('serializes RX gate with angle: rx(1.5707963267948966) q[0];', () => {
        const out = toQASM2(makeCircuit([{ id:'1', type:'RX', qubits:[0], column:0, params:{ theta: Math.PI/2 } }]))
        expect(out).toContain('rx(1.5707963267948966) q[0];')
      })
      it('serializes MEASURE: measure q[0] -> c[0];', () => {
        const out = toQASM2(makeCircuit([{ id:'1', type:'MEASURE', qubits:[0], column:1 }]))
        expect(out).toContain('measure q[0] -> c[0];')
      })
    })

    describe('toQASM3', () => {
      it('produces valid QASM 3.0 header', () => {
        const out = toQASM3(makeCircuit([]))
        expect(out).toContain('OPENQASM 3;')
        expect(out).toContain('qubit[2] q;')
      })
      it('serializes H gate in QASM 3.0 syntax: h q[0];', () => {
        const out = toQASM3(makeCircuit([{ id:'1', type:'H', qubits:[0], column:0 }]))
        expect(out).toContain('h q[0];')
      })
    })
    ```
    AVOID: Do NOT use `jest` — this project uses Vitest. Import from `vitest`, not `@jest/globals`.
  </action>
  <verify>Run `npm test -- --run` — tests should FAIL with "Cannot find module '../toQASM2'" (confirming Red phase).</verify>
  <done>Tests are red. Type definitions exist. Test file imports from modules that do not yet exist.</done>
</task>

## Green Phase

<task type="auto">
  <name>Implement toQASM2 + toQASM3 + CircuitStore to make tests pass</name>
  <files>
    src/lib/qasm/toQASM2.ts
    src/lib/qasm/toQASM3.ts
    src/store/circuitStore.ts
  </files>
  <action>
    1. Create `src/lib/qasm/toQASM2.ts`:
    - Header: `OPENQASM 2.0;\ninclude "qelib1.inc";\n`
    - Declarations: `qreg q[N];\ncreg c[N];`
    - Gate map (QASM 2.0 gate names): H→h, X→x, Y→y, Z→z, S→s, T→t, Sdg→sdg, Tdg→tdg, CNOT→cx, CZ→cz, SWAP→swap, Toffoli→ccx, RX→rx, RY→ry, RZ→rz, U3→u3, P→p
    - Single-qubit: `{name} q[{qubits[0]}];`
    - Two-qubit: `{name} q[{qubits[0]}],q[{qubits[1]}];`
    - Parametric: `{name}({params.theta ?? 0}) q[{qubits[0]}];` (U3: uses theta, phi, lambda)
    - MEASURE: `measure q[{qubits[0]}] -> c[{qubits[0]}];`
    - Sort gates by column before serializing (ascending column order).

    2. Create `src/lib/qasm/toQASM3.ts`:
    - Header: `OPENQASM 3;\n`
    - Declarations: `qubit[N] q;\nbit[N] c;`
    - Same gate map but QASM 3.0 uses `bit` instead of `creg`, `qubit` instead of `qreg`.
    - MEASURE: `c[{q}] = measure q[{q}];`
    - All other gate serialization is identical to 2.0.

    3. Create `src/store/circuitStore.ts` with Zustand:
    ```ts
    import { create } from 'zustand'
    import type { CircuitState, Gate } from '@/types/circuit.types'
    import { toQASM2 } from '@/lib/qasm/toQASM2'
    import { toQASM3 } from '@/lib/qasm/toQASM3'
    import { nanoid } from 'nanoid'

    interface CircuitStore extends CircuitState {
      // Actions
      addGate: (gate: Omit<Gate, 'id'>) => void
      removeGate: (id: string) => void
      setNumQubits: (n: number) => void
      setNumColumns: (n: number) => void
      setGates: (gates: Gate[]) => void  // used by QASM import
      // Export
      exportQASM2: () => string
      exportQASM3: () => string
      // Project
      loadProject: (state: CircuitState) => void
      resetCircuit: () => void
    }

    const defaultCircuit: CircuitState = {
      id: nanoid(), numQubits: 3, numColumns: 8,
      metadata: { name: 'Untitled Circuit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      gates: []
    }

    export const useCircuitStore = create<CircuitStore>((set, get) => ({
      ...defaultCircuit,
      addGate: (gate) => set(s => ({ gates: [...s.gates, { ...gate, id: nanoid() }] })),
      removeGate: (id) => set(s => ({ gates: s.gates.filter(g => g.id !== id) })),
      setNumQubits: (n) => set({ numQubits: n }),
      setNumColumns: (n) => set({ numColumns: n }),
      setGates: (gates) => set({ gates }),
      exportQASM2: () => toQASM2(get()),
      exportQASM3: () => toQASM3(get()),
      loadProject: (state) => set(state),
      resetCircuit: () => set(defaultCircuit),
    }))
    ```
    AVOID: Do NOT use Zustand `persist` middleware — DECISIONS.md explicitly forbids this for async storage engines due to hydration timing problems. Persistence is handled by the StorageAdapter in Plan 1.3.
    AVOID: Do NOT mutate gate arrays directly — always spread (`[...s.gates, newGate]`) to preserve reactivity.

    4. Install `nanoid` and `zustand`: add to package.json dependencies.
  </action>
  <verify>Run `npm test -- --run` — all 7 QASM test cases must pass (GREEN).</verify>
  <done>All toQASM2 and toQASM3 tests pass. `npm test -- --run` exits 0 with "7 passed".</done>
</task>

## Qiskit Export (CIRCUIT-10)

<task type="auto">
  <name>Write failing Qiskit export tests (Red phase)</name>
  <files>
    src/lib/qasm/__tests__/toQiskit.test.ts
  </files>
  <action>
    Create `src/lib/qasm/__tests__/toQiskit.test.ts`:
    ```ts
    import { describe, it, expect } from 'vitest'
    import { toQiskit } from '../toQiskit'
    import type { CircuitState } from '@/types/circuit.types'

    const makeCircuit = (g: CircuitState['gates'], nq = 2): CircuitState => ({
      id: 'test', numQubits: nq, numColumns: 4,
      metadata: { name: 'Test', createdAt: '', updatedAt: '' },
      gates: g
    })

    describe('toQiskit', () => {
      it('produces valid Qiskit Python boilerplate for empty circuit', () => {
        const out = toQiskit(makeCircuit([]))
        expect(out).toContain('from qiskit import QuantumCircuit')
        expect(out).toContain('qc = QuantumCircuit(2, 2)')
        expect(out).toContain('print(qc.draw())')
      })
      it('serializes H gate: qc.h(0)', () => {
        const out = toQiskit(makeCircuit([{ id:'1', type:'H', qubits:[0], column:0 }]))
        expect(out).toContain('qc.h(0)')
      })
      it('serializes CNOT gate: qc.cx(0, 1)', () => {
        const out = toQiskit(makeCircuit([{ id:'1', type:'CNOT', qubits:[0,1], column:0 }]))
        expect(out).toContain('qc.cx(0, 1)')
      })
      it('serializes RX gate with angle: qc.rx(1.5707963267948966, 0)', () => {
        const out = toQiskit(makeCircuit([{ id:'1', type:'RX', qubits:[0], column:0, params:{ theta: Math.PI/2 } }]))
        expect(out).toContain('qc.rx(1.5707963267948966, 0)')
      })
      it('serializes MEASURE: qc.measure(0, 0)', () => {
        const out = toQiskit(makeCircuit([{ id:'1', type:'MEASURE', qubits:[0], column:1 }]))
        expect(out).toContain('qc.measure(0, 0)')
      })
    })
    ```
    AVOID: Do NOT import from `toQiskit` yet — let these fail (Red phase confirms the file is missing).
  </action>
  <verify>Run `npm test -- --run` — toQiskit tests FAIL with "Cannot find module '../toQiskit'" (Red phase confirmed).</verify>
  <done>toQiskit tests are red. Test file exists. Module does not yet exist.</done>
</task>

<task type="auto">
  <name>Implement toQiskit to make tests pass (Green phase)</name>
  <files>
    src/lib/qasm/toQiskit.ts
    src/store/circuitStore.ts
  </files>
  <action>
    1. Create `src/lib/qasm/toQiskit.ts`:
    - Import `CircuitState` from `@/types/circuit.types`
    - Header lines:
      ```python
      from qiskit import QuantumCircuit
      from qiskit.circuit.library import *

      qc = QuantumCircuit({numQubits}, {numQubits})
      ```
    - Gate map (GateType → Qiskit method name, all lowercase):
      H→h, X→x, Y→y, Z→z, S→s, T→t, Sdg→sdg, Tdg→tdg,
      CNOT→cx, CZ→cz, SWAP→swap, Toffoli→ccx,
      RX→rx, RY→ry, RZ→rz, U3→u3, P→p
    - Single-qubit: `qc.{method}({qubits[0]})`
    - Two-qubit: `qc.{method}({qubits[0]}, {qubits[1]})`
    - Three-qubit (Toffoli): `qc.ccx({qubits[0]}, {qubits[1]}, {qubits[2]})`
    - Parametric: `qc.{method}({params.theta ?? 0}, {qubits[0]})` (U3: `qc.u({theta},{phi},{lambda}, {q})`)
    - MEASURE: `qc.measure({qubits[0]}, {qubits[0]})`
    - BARRIER: `qc.barrier()`
    - Footer: `\nprint(qc.draw())`
    - Sort gates by column (ascending) before serializing.
    - Export function signature: `export function toQiskit(circuit: CircuitState): string`

    2. Update `src/store/circuitStore.ts`:
    - Add import: `import { toQiskit } from '@/lib/qasm/toQiskit'`
    - Add to `CircuitStore` interface: `exportQiskit: () => string`
    - Add to store implementation: `exportQiskit: () => toQiskit(get()),`
    AVOID: Do NOT use template literals with backticks for the Python output — use regular string concatenation or array join to avoid confusion with JS template syntax.
  </action>
  <verify>Run `npm test -- --run` — all toQiskit tests pass. Total test count increases by 5. `npm test -- --run` exits 0.</verify>
  <done>All QASM + Qiskit export tests pass. `npm test -- --run` exits 0. CIRCUIT-10 is satisfied.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm test -- --run` exits 0 — all QASM + Qiskit export tests pass (≥12 total)
- [ ] `src/types/circuit.types.ts` has Gate, CircuitState, CircuitProject interfaces
- [ ] `src/store/circuitStore.ts` does NOT import Zustand persist middleware
- [ ] toQASM2 output includes `OPENQASM 2.0` and `include "qelib1.inc"`
- [ ] toQASM3 output includes `OPENQASM 3;` and `qubit[N] q;`
- [ ] toQiskit output includes `from qiskit import QuantumCircuit` and `qc = QuantumCircuit(N, N)`
- [ ] `useCircuitStore` exposes `exportQiskit()` action
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Types are future-proof for Phase 2 (multi-qubit, parametric gates supported in schema)
- [ ] CIRCUIT-09 ✓ (toQASM3), CIRCUIT-10 ✓ (toQiskit) both satisfied by this plan
</success_criteria>
