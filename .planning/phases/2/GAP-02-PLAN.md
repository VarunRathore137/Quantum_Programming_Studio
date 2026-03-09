---
phase: 2
plan: gap-02
wave: 4
depends_on: [2.3, 2.4]
gap_closure: true
files_modified:
  - src/lib/circuit/circuitLinter.ts
  - src/components/editor/PlacedGate.tsx
  - src/components/editor/CircuitGrid.tsx
autonomous: true
user_setup: []

gap_source: "PITFALLS.md — Opaque Simulator Error Messages (Phase 2 linting aspect)"

must_haves:
  truths:
    - "Gates targeting qubits that exceed numQubits are highlighted with a red error ring on the placed chip"
    - "circuitLinter.ts exports a pure function returning a Set<string> of invalid gate IDs"
    - "PlacedGate renders a red error border when its gate ID is in the lint error set"
    - "Non-parametric gates and in-range gates have no error state"
  artifacts:
    - "src/lib/circuit/circuitLinter.ts exists"
---

# Gap 02: Circuit Linting — Flag Invalid Gates Before Simulation

<objective>
Add a lightweight live linting layer that detects invalid gate placements in the Phase 2 editor.
Without this, users can create circuits with gates targeting non-existent qubits (e.g., drag a gate
to q[5] then reduce qubit count to 3) and only discover the error on simulation.

Problem identified in: PITFALLS.md — "Opaque Simulator Error Messages"
  "Add live circuit linting: highlight gates that violate constraints BEFORE running simulation."
Root cause: Plans 2.3–2.5 build the editor interaction but include no validation layer.
</objective>

<context>
Load for context:
- src/types/circuit.types.ts (Gate interface, qubits: number[])
- src/store/circuitStore.ts (numQubits, gates)
- src/components/editor/PlacedGate.tsx
- src/components/editor/CircuitGrid.tsx
</context>

<tasks>

<task type="auto">
  <name>Create circuitLinter pure function</name>
  <files>src/lib/circuit/circuitLinter.ts</files>
  <action>
    Create `src/lib/circuit/circuitLinter.ts` — a pure, zero-dependency utility:

    ```ts
    // src/lib/circuit/circuitLinter.ts
    import type { Gate } from '@/types/circuit.types'

    export interface LintError {
      gateId: string
      message: string
    }

    /**
     * Validates a circuit and returns a list of lint errors.
     * Pure function — no side effects, no store access.
     */
    export function lintCircuit(
      gates: Gate[],
      numQubits: number,
      numColumns: number
    ): LintError[] {
      const errors: LintError[] = []

      for (const gate of gates) {
        // Check: all qubit targets are within the valid range [0, numQubits)
        for (const qubit of gate.qubits) {
          if (qubit >= numQubits || qubit < 0) {
            errors.push({
              gateId: gate.id,
              message: `Gate "${gate.type}" targets qubit ${qubit}, but circuit only has ${numQubits} qubits (valid: 0–${numQubits - 1})`,
            })
            break // one error per gate is enough
          }
        }

        // Check: gate column is within valid column range [0, numColumns)
        if (gate.column >= numColumns || gate.column < 0) {
          errors.push({
            gateId: gate.id,
            message: `Gate "${gate.type}" is at column ${gate.column}, but circuit only has ${numColumns} columns (valid: 0–${numColumns - 1})`,
          })
        }
      }

      return errors
    }

    /**
     * Convenience: returns a Set<string> of invalid gate IDs for O(1) lookup in render.
     */
    export function getLintErrorIds(
      gates: Gate[],
      numQubits: number,
      numColumns: number
    ): Set<string> {
      return new Set(lintCircuit(gates, numQubits, numColumns).map(e => e.gateId))
    }
    ```

    AVOID: importing from circuitStore — linter is pure, receives data as arguments only.
    AVOID: running linting in the store — keep it in presentation layer (CircuitGrid).
  </action>
  <verify>`npx tsc --noEmit` exits 0 (strict TypeScript, zero errors).</verify>
  <done>circuitLinter.ts exports lintCircuit and getLintErrorIds. Fully typed. No store dependency.</done>
</task>

<task type="auto">
  <name>Wire lint error IDs into CircuitGrid and PlacedGate</name>
  <files>
    src/components/editor/CircuitGrid.tsx
    src/components/editor/PlacedGate.tsx
  </files>
  <action>
    **CircuitGrid.tsx** — compute lint errors once, pass to PlacedGate:
    ```tsx
    import { getLintErrorIds } from '@/lib/circuit/circuitLinter'

    // Inside CircuitGrid, after gates/numQubits/numColumns are read:
    const lintErrorIds = getLintErrorIds(gates, numQubits, numColumns)
    ```

    When rendering PlacedGate, pass `hasError` prop:
    ```tsx
    {gate && (
      <PlacedGate
        gate={gate}
        onDelete={removeGate}
        hasError={lintErrorIds.has(gate.id)}
      />
    )}
    ```

    **PlacedGate.tsx** — accept and render `hasError` prop:
    ```tsx
    interface PlacedGateProps {
      gate: Gate
      onDelete: (id: string) => void
      hasError?: boolean   // new optional prop
    }

    export const PlacedGate = React.memo(function PlacedGate({ gate, onDelete, hasError = false }: PlacedGateProps) {
      // ...
      return (
        <div className={`
          relative group w-14 h-14 flex flex-col items-center justify-center rounded-lg
          ${hasError
            ? 'bg-red-900/60 border-2 border-red-500 ring-2 ring-red-400'
            : 'bg-violet-600 border border-violet-400'
          }
          text-white select-none
        `}>
          <span className="text-sm font-mono font-bold leading-none">{label}</span>
          {hasError && (
            <span className="text-[8px] text-red-300 mt-0.5 leading-none" title="Invalid gate placement">⚠</span>
          )}
          {isParametric && !hasError && (
            <AngleEditor value={gate.params?.theta ?? 0} onChange={rad => updateGateParams(gate.id, { theta: rad })} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(gate.id) }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Delete gate"
          >
            <X size={10} />
          </button>
        </div>
      )
    })
    ```

    AVOID: fetching lint errors inside PlacedGate — compute once in CircuitGrid and pass down.
    AVOID: Showing AngleEditor on error state (confusing UX — angle editing while gate is invalid).
  </action>
  <verify>
    Browser: Place H gate on q[0]. Reduce qubit count to 0 (if possible) or reduce below q[0]
    by reducing qubit count to 0 via CircuitControls. Gate chip turns red with ⚠ indicator.
    Restore qubit count → gate returns to normal violet style.
    `npm run build` exits 0.
    `npm test -- --run` → 18/18 pass.
  </verify>
  <done>
    Invalid gates show red error styling. Lint checks update live when qubit/column count changes.
    Valid gates unaffected. Build clean. Tests pass.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] `npm test -- --run` → 18/18 pass
- [ ] Browser: Place gate → reduce qubit count → gate turns red with ⚠
- [ ] Browser: Restore qubit count → gate returns to normal (no error styling)
- [ ] Browser: H gate with valid qubit shows no error state
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
