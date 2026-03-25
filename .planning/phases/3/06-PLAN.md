---
phase: 3
plan: 6
wave: 4
depends_on: ["02", "03", "04", "05"]
files_modified:
  - src/store/simStore.ts
  - src/components/editor/CircuitGrid.tsx
  - src/components/editor/PlacedGate.tsx
  - src/components/editor/GridCell.tsx
  - src/lib/circuit/validator.ts
  - src/components/editor/CircuitEditor.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Adding/removing gates does not cause re-renders outside the affected cell"
    - "CircuitGrid uses React.memo and only re-renders cells that changed"
    - "Invalid gate placements are visually highlighted (red outline) without blocking simulation"
    - "CircuitGrid performance validated by React DevTools — no waterfall re-renders"
  artifacts:
    - "src/lib/circuit/validator.ts — pure function returning invalid gate IDs"
    - "PlacedGate.tsx wrapped with React.memo"
    - "GridCell.tsx wrapped with React.memo"
    - "CircuitGrid uses selective Zustand subscription (gates only, not full store)"
  key_links:
    - "validator.ts called inside useAutoSim after circuit changes — results stored in simStore"
    - "PlacedGate reads its own gate data via selective subscription (gate ID selector)"
---

# Plan 3.6: React Performance + Circuit Linting (GAP-01 + GAP-02)

<objective>
Apply React.memo, selective Zustand subscriptions, and circuit linting to close GAP-01
(re-render explosion) and GAP-02 (no error highlighting). Both gaps subsumed per DECISIONS.md.

Purpose: Auto-sim fires on every circuit change — performance is now critical.
Output: Memoized grid components + validator module + invalid gate highlighting.
</objective>

<context>
Load for context:
- src/components/editor/CircuitGrid.tsx (current — likely has full store subscription)
- src/components/editor/PlacedGate.tsx (current — candidate for React.memo)
- src/components/editor/GridCell.tsx (current — candidate for React.memo)
- src/store/simStore.ts (to store linting results alongside simResult)
- .planning/phases/2/GAP-01-PLAN.md (original GAP-01 scope)
- .planning/phases/2/GAP-02-PLAN.md (original GAP-02 scope)
</context>

<tasks>

<task type="auto">
  <name>Memoize CircuitGrid, PlacedGate, GridCell with selective Zustand subscriptions</name>
  <files>
    src/components/editor/CircuitGrid.tsx
    src/components/editor/PlacedGate.tsx
    src/components/editor/GridCell.tsx
  </files>
  <action>
    GAP-01 fix — React.memo + selective subscriptions:

    PlacedGate.tsx:
    - Wrap default export with `React.memo`.
    - PlacedGate should receive its gate data as props (gateId: string).
    - Use `useCircuitStore(s => s.gates.find(g => g.id === gateId))` — selector.
    - This ensures PlacedGate only re-renders when ITS gate data changes.
    - AVOID: passing the full gates array as a prop.

    GridCell.tsx:
    - Wrap with React.memo.
    - Props: `{ qubit: number; column: number }` — cell identity only.
    - Cell selects its own gate: `useCircuitStore(s => s.gates.find(g => g.column === column && g.qubits.includes(qubit)))`.
    - AVOID: passing the full gate list to GridCell.

    CircuitGrid.tsx:
    - Use `useCircuitStore(s => ({ numQubits: s.numQubits, numColumns: s.numColumns }), shallow)`.
    - Use `useCircuitStore(s => s.gates.map(g => g.id), shallow)` for gate ID list only.
    - Render a grid of <GridCell qubit={q} column={c} /> components — they self-select.
    - Import `shallow` from zustand/shallow (already in package.json).
    - AVOID: `useCircuitStore()` with no selector — subscribes to full store changes.
  </action>
  <verify>
    1. npx tsc --noEmit — zero errors
    2. Open React DevTools Profiler, add one gate to Bell circuit — only 1-2 cells re-render (not all)
  </verify>
  <done>PlacedGate, GridCell wrapped with React.memo. CircuitGrid uses shallow selectors. No waterfall re-renders on single gate add.</done>
</task>

<task type="auto">
  <name>Circuit validator + invalid gate highlighting (GAP-02)</name>
  <files>
    src/lib/circuit/validator.ts
    src/components/editor/CircuitEditor.tsx
  </files>
  <action>
    validator.ts — pure function (no React deps):
    ```typescript
    export type LintError = {
      gateId: string;
      code: string;
      message: string;
    }
    export function validateCircuit(circuit: CircuitState): LintError[]
    ```
    Check rules:
    1. Gate out of qubit bounds: gate.qubits includes index >= numQubits → code 'QUBIT_OUT_OF_RANGE'
    2. Gate out of column bounds: gate.column >= numColumns → code 'COLUMN_OUT_OF_RANGE'
    3. Column conflict: two gates on same qubit+column → code 'COLUMN_CONFLICT'
    4. Invalid angle: parametric gate with params.theta undefined → code 'MISSING_ANGLE'
    Returns empty array if circuit is valid.

    Integration in useAutoSim.ts (existing hook — minor addition):
    - After circuit mutation (before debounce fires), call validateCircuit(circuit) synchronously.
    - Store result in simStore via a new `lintErrors` field:
      Add `lintErrors: LintError[]` and `setLintErrors: (errors: LintError[]) => void` to simStore.ts.

    PlacedGate.tsx (minor addition):
    - Read `useSimStore(s => s.lintErrors.find(e => e.gateId === gateId))`.
    - If lint error exists: add CSS class `gate--invalid` (red border, subtle red glow).
    - Gate still renders normally — linting never blocks the editor.
    AVOID: throwing errors from validateCircuit — always returns an array (empty = valid).
  </action>
  <verify>
    1. npx tsc --noEmit — zero errors
    2. Reduce numQubits to 1 while gates exist on q1 → those gates show red border
    3. Valid circuit → no red highlights
  </verify>
  <done>Invalid gates highlighted with red border. validateCircuit returns correct LintError[] for all 4 rule types.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] React DevTools shows no waterfall re-renders on single gate add
- [ ] Invalid gates (qubit out of range) show red border highlight
- [ ] Valid circuits show no lint errors
</verification>

<success_criteria>
- [ ] GAP-01 closed: selective subscriptions prevent full-grid re-renders
- [ ] GAP-02 closed: circuit linting highlights invalid gates in real-time
- [ ] Both gaps verified empirically (DevTools + visual test)
</success_criteria>
