---
phase: 1
plan: 3
wave: 3
depends_on: ["1.2"]
files_modified:
  - src/lib/qasm/fromQASM.ts
  - src/lib/qasm/__tests__/fromQASM.test.ts
  - src/lib/storage/StorageAdapter.ts
  - src/lib/storage/IndexedDBAdapter.ts
  - src/store/circuitStore.ts
autonomous: true

must_haves:
  truths:
    - "fromQASM() parses a valid QASM 2.0 string into a CircuitState gates array"
    - "fromQASM() returns a structured error object (not throws) for invalid QASM"
    - "IndexedDBAdapter.save() stores a circuit and IndexedDBAdapter.load() retrieves it"
    - "CircuitStore.loadProject() and saveProject() delegate to StorageAdapter — never call Dexie directly"
  artifacts:
    - "src/lib/storage/StorageAdapter.ts defines the StorageAdapter interface"
    - "src/lib/storage/IndexedDBAdapter.ts implements StorageAdapter using Dexie.js"
    - "src/lib/qasm/fromQASM.ts exists and parses H, X, CNOT, RX, MEASURE gates"
    - "src/lib/qasm/__tests__/fromQASM.test.ts has ≥4 test cases that all pass"
  key_links:
    - "StorageAdapter interface is the seam for future RemoteStorageAdapter swap — no other code changes needed"
    - "fromQASM is consumed by Phase 4 bi-directional sync (code editor → visual circuit)"

user_setup: []
---

# Plan 1.3: QASM Import + Persistence (fromQASM + Dexie.js StorageAdapter)

<objective>
Implement the QASM import parser (CIRCUIT-11) and the storage layer (UX-04). The storage layer uses a `StorageAdapter` interface backed by IndexedDB via Dexie.js so the persistence engine can be swapped for a remote backend in a future phase without touching any other code.

Purpose: Import and persistence are the two missing data flows from Plan 1.2. Together, Plans 1.2 + 1.3 complete the full data lifecycle: create circuit → edit → export QASM → import QASM → save to IndexedDB → load from IndexedDB.
Output: fromQASM parser, StorageAdapter interface, IndexedDBAdapter, updated CircuitStore with save/load actions.
</objective>

<context>
Load for context:
- .planning/DECISIONS.md (Decision 4: IndexedDB via Dexie.js + StorageAdapter interface)
- .planning/REQUIREMENTS.md (CIRCUIT-11, UX-04)
- src/types/circuit.types.ts (Gate, CircuitState types from Plan 1.2)
- src/store/circuitStore.ts (existing store from Plan 1.2)
</context>

<tasks>

<task type="auto">
  <name>Implement fromQASM QASM 2.0 parser with tests</name>
  <files>
    src/lib/qasm/fromQASM.ts
    src/lib/qasm/__tests__/fromQASM.test.ts
  </files>
  <action>
    1. Create `src/lib/qasm/fromQASM.ts`:
    - Accept a QASM 2.0 string, return `{ ok: true, circuit: Partial<CircuitState> } | { ok: false, error: string }`.
    - Parse: skip comments (`//`, `/* */`), header line, `include`, `qreg`/`creg` declarations.
    - Extract `numQubits` from `qreg q[N];`.
    - Parse gate lines:
      - `h q[0];` → { type:'H', qubits:[0], column: lineIndex }
      - `cx q[0],q[1];` → { type:'CNOT', qubits:[0,1], column: lineIndex }
      - `rx(1.5707963) q[0];` → { type:'RX', qubits:[0], params:{ theta: 1.5707963 }, column: lineIndex }
      - `measure q[0] -> c[0];` → { type:'MEASURE', qubits:[0], column: lineIndex }
    - Gate name map (QASM 2.0 → GateType): h→H, x→X, y→Y, z→Z, s→S, t→T, sdg→Sdg, tdg→Tdg, cx→CNOT, cz→CZ, swap→SWAP, ccx→Toffoli, rx→RX, ry→RY, rz→RZ, u3→U3, p→P.
    - Assign `column` as the sequential index of gate lines (not QASM 2.0 line numbers).
    - Return `{ ok: false, error: 'Unrecognized gate: XYZ' }` for unknown gates instead of throwing.
    AVOID: Do NOT throw exceptions on invalid QASM — return a typed error union. Throwing causes unhandled rejections in the React event loop.
    AVOID: Do NOT try to parse OpenQASM 3.0 syntax (qubit[], bit[]) — Phase 1 import is QASM 2.0 only. QASM 3.0 import is Phase 4.

    2. Create `src/lib/qasm/__tests__/fromQASM.test.ts`:
    ```ts
    import { describe, it, expect } from 'vitest'
    import { fromQASM } from '../fromQASM'

    const header = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\n'

    it('parses numQubits from qreg declaration', () => {
      const r = fromQASM(header)
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.circuit.numQubits).toBe(2)
    })
    it('parses H gate', () => {
      const r = fromQASM(header + 'h q[0];')
      expect(r.ok && r.circuit.gates?.[0].type).toBe('H')
    })
    it('parses CNOT gate with control and target', () => {
      const r = fromQASM(header + 'cx q[0],q[1];')
      expect(r.ok && r.circuit.gates?.[0]).toMatchObject({ type:'CNOT', qubits:[0,1] })
    })
    it('parses RX gate with angle param', () => {
      const r = fromQASM(header + 'rx(1.5707963267948966) q[0];')
      expect(r.ok && r.circuit.gates?.[0].params?.theta).toBeCloseTo(Math.PI/2)
    })
    it('returns ok:false for unknown gate', () => {
      const r = fromQASM(header + 'foo q[0];')
      expect(r.ok).toBe(false)
    })
    ```
  </action>
  <verify>Run `npm test -- --run` — all fromQASM tests pass in addition to the toQASM tests from Plan 1.2.</verify>
  <done>All QASM round-trip tests pass. `npm test -- --run` exits 0.</done>
</task>

<task type="auto">
  <name>Implement StorageAdapter interface + IndexedDBAdapter + update CircuitStore</name>
  <files>
    src/lib/storage/StorageAdapter.ts
    src/lib/storage/IndexedDBAdapter.ts
    src/store/circuitStore.ts
  </files>
  <action>
    1. Install `dexie` (npm package) and `nanoid` if not already installed.

    2. Create `src/lib/storage/StorageAdapter.ts`:
    ```ts
    export interface StorageAdapter {
      save(key: string, data: unknown): Promise<void>
      load(key: string): Promise<unknown | null>
      delete(key: string): Promise<void>
      list(): Promise<string[]>
    }
    ```

    3. Create `src/lib/storage/IndexedDBAdapter.ts`:
    ```ts
    import Dexie, { type EntityTable } from 'dexie'
    import type { StorageAdapter } from './StorageAdapter'

    interface StoredItem { key: string; data: unknown }

    class AppDB extends Dexie {
      items!: EntityTable<StoredItem, 'key'>
      constructor() {
        super('QuantumStudioDB')
        this.version(1).stores({ items: 'key' })
      }
    }

    const db = new AppDB()

    export const IndexedDBAdapter: StorageAdapter = {
      save: async (key, data) => { await db.items.put({ key, data }) },
      load: async (key) => { const r = await db.items.get(key); return r?.data ?? null },
      delete: async (key) => { await db.items.delete(key) },
      list: async () => { const all = await db.items.toArray(); return all.map(r => r.key) }
    }
    ```

    4. Update `src/store/circuitStore.ts` — add `saveProject` and `loadProject` async actions:
    ```ts
    // Add to the store interface:
    saveProject: (adapter: StorageAdapter) => Promise<void>
    loadProject: (id: string, adapter: StorageAdapter) => Promise<boolean>
    listProjects: (adapter: StorageAdapter) => Promise<string[]>

    // Implementation:
    saveProject: async (adapter) => {
      const state = get()
      await adapter.save(state.id, { id: state.id, metadata: state.metadata, numQubits: state.numQubits, numColumns: state.numColumns, gates: state.gates })
    },
    loadProject: async (id, adapter) => {
      const data = await adapter.load(id)
      if (!data) return false
      set(data as CircuitState)
      return true
    },
    listProjects: async (adapter) => adapter.list(),
    ```
    AVOID: Do NOT import `IndexedDBAdapter` directly inside `circuitStore.ts` — inject the adapter via function parameter. This keeps the store testable with a mock adapter and decoupled from Dexie.
    AVOID: Do NOT use `localStorage.setItem` for circuits — reserved for UI prefs (dark mode, sidebar state) only per DECISIONS.md.
  </action>
  <verify>
    Manual test in browser console (via React DevTools or a temp button in App.tsx):
    1. Add a gate to the circuit via `useCircuitStore.getState().addGate({ type:'H', qubits:[0], column:0 })`
    2. Call `useCircuitStore.getState().saveProject(IndexedDBAdapter)` — no error thrown
    3. Refresh the page
    4. Call `useCircuitStore.getState().loadProject(circuitId, IndexedDBAdapter)` — H gate is in the store
  </verify>
  <done>Circuit survives a page refresh via IndexedDB save/load cycle. No console errors.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm test -- --run` exits 0 (fromQASM tests + all previous tests pass)
- [ ] `src/lib/storage/StorageAdapter.ts` defines the interface (not a class, not Dexie directly)
- [ ] `IndexedDBAdapter` wraps Dexie, implementing the StorageAdapter interface
- [ ] CircuitStore's `saveProject`/`loadProject` accept an adapter parameter — no hardcoded Dexie import
- [ ] fromQASM returns `{ ok: false, error }` for unknown gates — does NOT throw
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Full data lifecycle is working: create → export QASM → import QASM → save → load
</success_criteria>
