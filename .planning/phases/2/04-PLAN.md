---
phase: 2
plan: 4
wave: 3
depends_on: [2.3]
files_modified:
  - src/components/editor/GridCell.tsx
  - src/components/editor/CircuitGrid.tsx
  - src/components/editor/MultiQubitGateOverlay.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "CNOT gate can be placed by dropping onto the control qubit; user picks target qubit via a secondary click"
    - "CNOT renders a visual vertical line connecting control dot and target ⊕ symbol"
    - "SWAP and CZ gates also render with a vertical line connector"
    - "Multi-qubit gate cells (both qubits) are marked occupied — no other gate can overlap"
  artifacts:
    - "src/components/editor/MultiQubitGateOverlay.tsx exists"
    - "CircuitGrid renders CNOT connector lines between qubit rows"
---

# Plan 2.4: Multi-Qubit Gates — CNOT Visual Connector

<objective>
Add support for placing CNOT (and other 2-qubit gates) onto the grid. A CNOT drop lands on the control qubit cell; a small "pick target" popover lets the user select the target qubit. The gate then renders spanning two qubit rows with a vertical connector line.

Purpose: CNOT is the most fundamental 2-qubit gate — Phase 2 success criterion 3 requires it explicitly.
Output: MultiQubitGateOverlay, updated CircuitGrid drop handler, updated PlacedGate multi-qubit rendering.
</objective>

<context>
Load for context:
- src/components/editor/CircuitGrid.tsx (DndContext onDragEnd — to extend for 2-qubit flow)
- src/components/editor/GridCell.tsx (to mark multi-qubit cells occupied)
- src/lib/gates/gateDefinitions.ts (numQubits field distinguishes 1q vs 2q)
- src/types/circuit.types.ts (Gate.qubits: number[] — [control, target])
- src/store/circuitStore.ts (addGate with qubits array)
</context>

<tasks>

<task type="auto">
  <name>Implement 2-qubit gate placement flow (drop + target picker)</name>
  <files>
    src/components/editor/CircuitGrid.tsx
  </files>
  <action>
    Modify `CircuitGrid.tsx` to handle 2-qubit gate drops:

    Add state: `const [pendingTwoQubit, setPendingTwoQubit] = useState<{ gateType: GateType; column: number; controlQubit: number } | null>(null)`

    In `handleDragEnd`:
    - After resolving `dragData` and `def`, check `def.numQubits === 2`
    - If 2-qubit: call `setPendingTwoQubit({ gateType, column, controlQubit: qubit })` — do NOT call addGate yet
    - If 1-qubit: existing logic (addGate immediately)

    Render a target-qubit picker when `pendingTwoQubit !== null`:
    ```tsx
    {pendingTwoQubit && (
      <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-violet-500 rounded-lg p-4 shadow-xl shadow-black/50">
        <p className="text-xs text-zinc-400 mb-2">Select target qubit for <strong className="text-violet-400">{pendingTwoQubit.gateType}</strong> at col {pendingTwoQubit.column}:</p>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: numQubits }, (_, qi) => qi)
            .filter(qi => qi !== pendingTwoQubit.controlQubit)
            .map(qi => (
              <button key={qi} onClick={() => {
                const key1 = `q${pendingTwoQubit.controlQubit}_c${pendingTwoQubit.column}`
                const key2 = `q${qi}_c${pendingTwoQubit.column}`
                if (occupied.has(key1) || occupied.has(key2)) return
                addGate({
                  type: pendingTwoQubit.gateType,
                  qubits: [pendingTwoQubit.controlQubit, qi],
                  column: pendingTwoQubit.column,
                })
                setPendingTwoQubit(null)
              }}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-violet-700 text-zinc-100 text-xs border border-zinc-700 hover:border-violet-400 transition-colors">
                q[{qi}]
              </button>
            ))}
          <button onClick={() => setPendingTwoQubit(null)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-red-900 text-zinc-400 text-xs border border-zinc-700">
            Cancel
          </button>
        </div>
      </div>
    )}
    ```
    Place this JSX inside a `relative` wrapper around the grid area.

    AVOID: Using a global modal — keep the picker local to CircuitGrid so it's easy to dismiss.
    AVOID: Automatically inferring the target qubit — always ask the user which qubit is target.
  </action>
  <verify>
    Browser: Drag CNOT from palette → drop on q[0] col 0 → target picker appears → click q[1] → CNOT is added with qubits: [0, 1].
    `npm run build` exits 0.
  </verify>
  <done>CNOT drops trigger target picker. Selecting target calls addGate with correct qubits array. Cancel dismisses picker.</done>
</task>

<task type="auto">
  <name>Render multi-qubit gate visual connector (vertical line)</name>
  <files>
    src/components/editor/MultiQubitGateOverlay.tsx
    src/components/editor/CircuitGrid.tsx
  </files>
  <action>
    Create `MultiQubitGateOverlay.tsx` — SVG overlay that draws connector lines:

    The connector connects control qubit row and target qubit row at the same column.
    This must be rendered as an absolutely-positioned SVG overlay on top of the grid.

    Strategy: After the qubit rows are rendered, overlay an absolutely-positioned SVG layer on the grid container.
    - Each column is 64px wide (w-16), each row is 64px tall (h-16).
    - Qubit label column is 48px wide (w-12).

    ```tsx
    // src/components/editor/MultiQubitGateOverlay.tsx
    import type { Gate } from '@/types/circuit.types'

    interface Props {
      gates: Gate[]
      cellSize: number  // 64px
      labelWidth: number  // 48px
    }

    export function MultiQubitGateOverlay({ gates, cellSize, labelWidth }: Props) {
      const twoQubitGates = gates.filter(g => g.qubits.length === 2)
      if (twoQubitGates.length === 0) return null

      return (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 10 }}
          overflow="visible"
        >
          {twoQubitGates.map(gate => {
            const [control, target] = gate.qubits
            const colX = labelWidth + gate.column * cellSize + cellSize / 2
            const controlY = control * cellSize + cellSize / 2
            const targetY = target * cellSize + cellSize / 2
            const top = Math.min(controlY, targetY)
            const bottom = Math.max(controlY, targetY)

            return (
              <g key={gate.id}>
                {/* Vertical connecting line */}
                <line x1={colX} y1={top} x2={colX} y2={bottom} stroke="#7c3aed" strokeWidth={2} />
                {/* Control dot */}
                <circle cx={colX} cy={controlY} r={6} fill="#7c3aed" />
                {/* Target ⊕ symbol */}
                <circle cx={colX} cy={targetY} r={12} fill="none" stroke="#7c3aed" strokeWidth={2} />
                <line x1={colX - 12} y1={targetY} x2={colX + 12} y2={targetY} stroke="#7c3aed" strokeWidth={2} />
                <line x1={colX} y1={targetY - 12} x2={colX} y2={targetY + 12} stroke="#7c3aed" strokeWidth={2} />
              </g>
            )
          })}
        </svg>
      )
    }
    ```

    Update CircuitGrid: wrap the grid rows in a `relative` container, render `<MultiQubitGateOverlay>` on top:
    ```tsx
    // In CircuitGrid return, wrap grid rows:
    <div className="relative overflow-auto flex-1 p-4">
      <div className="relative inline-block"> {/* shrink-wraps to content width */}
        <div className="flex flex-col gap-0">
          {/* ... qubit rows ... */}
        </div>
        <MultiQubitGateOverlay gates={gates} cellSize={64} labelWidth={48} />
      </div>
    </div>
    ```

    Also update `occupied` map to mark BOTH qubits of a 2-qubit gate as occupied:
    ```ts
    for (const g of gates) {
      for (const q of g.qubits) {
        occupied.set(`q${q}_c${g.column}`, g.id)
      }
    }
    ```
    (This was already done in Plan 2.3 — verify it handles multi-qubit qubits array correctly.)

    AVOID: Rendering PlacedGate chips for both qubits of a CNOT — only render on the control qubit (qubits[0]). The target ⊕ is part of the SVG overlay.
    AVOID: Using CSS position tricks — SVG overlay on the grid container is the correct approach.
  </action>
  <verify>
    Browser: CNOT on q[0]→q[1] at col 0: control dot at q[0], ⊕ symbol at q[1], vertical purple line connecting them. 
    Browser: q[0] and q[1] col 0 cells are both marked occupied (cannot drop another gate there).
    `npm run build` exits 0 (no TS errors on SVG props).
  </verify>
  <done>CNOT displays control dot + ⊕ symbol + connecting vertical line. Multi-qubit cells are occupied. Build clean.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] `npm test -- --run` → 18/18 pass
- [ ] Browser: Drop CNOT → target picker appears → select target → gate renders with vertical connector
- [ ] Browser: Both CNOT qubit cells show as occupied (reject further drops)
- [ ] Browser: Delete X on CNOT chip removes gate + SVG connector disappears
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
