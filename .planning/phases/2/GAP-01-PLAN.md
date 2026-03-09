---
phase: 2
plan: gap-01
wave: 4
depends_on: [2.3, 2.4, 2.5]
gap_closure: true
files_modified:
  - src/components/editor/GridCell.tsx
  - src/components/editor/PlacedGate.tsx
  - src/components/editor/CircuitGrid.tsx
autonomous: true
user_setup: []

gap_source: "PITFALLS.md — React Re-Render Explosion on Large Circuits"

must_haves:
  truths:
    - "GridCell is wrapped with React.memo — only re-renders when its own gate slot changes"
    - "PlacedGate is wrapped with React.memo — only re-renders when its gate object reference changes"
    - "CircuitGrid uses Zustand selective subscription for gates, numQubits, numColumns (not full store)"
  artifacts:
    - "GridCell.tsx exports a memoized component"
    - "PlacedGate.tsx exports a memoized component"
---

# Gap 01: Performance — React.memo + Selective Zustand Subscriptions

<objective>
Prevent re-render explosion on large circuits by memoizing GridCell and PlacedGate, and using Zustand selective subscriptions in CircuitGrid. Without this, every gate drop causes a full grid re-render (numQubits × numColumns cells).

Problem identified in: PITFALLS.md — "React Re-Render Explosion on Large Circuits"
Root cause: CircuitGrid subscribes to the full circuit store; any store change re-renders every GridCell.
</objective>

<context>
Load for context:
- src/components/editor/CircuitGrid.tsx
- src/components/editor/GridCell.tsx
- src/components/editor/PlacedGate.tsx
- src/store/circuitStore.ts
</context>

<tasks>

<task type="auto">
  <name>Memoize GridCell and PlacedGate with React.memo</name>
  <files>
    src/components/editor/GridCell.tsx
    src/components/editor/PlacedGate.tsx
  </files>
  <action>
    **GridCell.tsx**: wrap export with `React.memo`:
    ```tsx
    export const GridCell = React.memo(function GridCell({ qubit, column, isOccupied, children }: GridCellProps) {
      // ... existing implementation unchanged
    })
    ```
    Add `import React from 'react'` at top if not already present.

    **PlacedGate.tsx**: wrap export with `React.memo`:
    ```tsx
    export const PlacedGate = React.memo(function PlacedGate({ gate, onDelete }: PlacedGateProps) {
      // ... existing implementation unchanged
    })
    ```

    AVOID: custom comparator functions — default shallow comparison is correct here since gate objects
    are replaced (not mutated) on each store update.
    AVOID: memoizing CircuitGrid itself — it needs to respond to store changes.
  </action>
  <verify>`npm run build` exits 0. No TypeScript errors.</verify>
  <done>GridCell and PlacedGate are wrapped with React.memo. Build clean.</done>
</task>

<task type="auto">
  <name>Use Zustand selective subscriptions in CircuitGrid</name>
  <files>src/components/editor/CircuitGrid.tsx</files>
  <action>
    Replace the single `useCircuitStore()` call with individual selective subscriptions:

    ```tsx
    // Instead of: const { numQubits, numColumns, gates, addGate, removeGate } = useCircuitStore()
    // Use:
    const numQubits = useCircuitStore(s => s.numQubits)
    const numColumns = useCircuitStore(s => s.numColumns)
    const gates = useCircuitStore(s => s.gates)
    const addGate = useCircuitStore(s => s.addGate)
    const removeGate = useCircuitStore(s => s.removeGate)
    ```

    This ensures CircuitGrid only re-renders when one of these specific fields changes, not on any
    unrelated store mutation (e.g., historyStore updates).

    AVOID: using `useShallow` from zustand/react/shallow unless needed — simple primitives and
    stable function references don't need it. The `gates` array however DOES need shallow comparison
    if you want to prevent re-renders when unrelated gates change:
    ```tsx
    import { useShallow } from 'zustand/react/shallow'
    const { gates, addGate, removeGate } = useCircuitStore(
      useShallow(s => ({ gates: s.gates, addGate: s.addGate, removeGate: s.removeGate }))
    )
    ```
    Apply `useShallow` only for the object form. Keep `numQubits` and `numColumns` as individual selectors.
  </action>
  <verify>
    1. `npm run build` exits 0.
    2. Browser: Open React DevTools Profiler. Drop a gate. Confirm only the affected GridCell
       re-renders, not all cells in the grid. (Flamegraph should show a small number of grey
       components, not the entire grid lit up orange.)
  </verify>
  <done>
    CircuitGrid uses selective subscriptions. React.memo propagates correctly. Profiler shows
    targeted re-renders only.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] `npm test -- --run` → 18/18 pass
- [ ] Browser React DevTools Profiler: drop a gate → only 1–2 cells highlight, not full grid
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
