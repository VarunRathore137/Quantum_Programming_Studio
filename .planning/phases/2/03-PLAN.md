---
phase: 2
plan: 3
wave: 2
depends_on: [2.1, 2.2]
files_modified:
  - src/components/editor/CircuitGrid.tsx
  - src/components/editor/GridCell.tsx
  - src/components/editor/PlacedGate.tsx
  - src/components/editor/CircuitEditor.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "User can drag H gate onto qubit 0 col 0 and it appears in that grid cell"
    - "CircuitStore.gates updates after drop (gate with correct qubit + column)"
    - "User can delete a placed gate by clicking an X button on it"
    - "Occupied cells reject duplicate drops (no two single-qubit gates in same qubit+col)"
    - "Circuit grid scrolls horizontally when columns exceed viewport"
  artifacts:
    - "src/components/editor/CircuitGrid.tsx exists as the DndContext host"
    - "src/components/editor/GridCell.tsx — useDroppable, highlighted on dragOver"
    - "src/components/editor/PlacedGate.tsx — renders a gate chip in a cell with delete button"
    - "src/components/editor/CircuitEditor.tsx — composes Grid + Palette + Controls"
---

# Plan 2.3: Circuit Grid + Drop Zones + Placed Gates

<objective>
Build the main circuit grid: a 2D matrix of drop zones (useDroppable cells) that accept dragged gate chips and call circuitStore.addGate() on drop. Each placed gate renders a PlacedGate chip with a delete button.

Purpose: This is the core interaction of the entire product. After this plan, the user can drag a gate from the palette onto the grid and see it stick.
Output: CircuitGrid, GridCell, PlacedGate, CircuitEditor (the assembled editor view).
</objective>

<context>
Load for context:
- src/store/circuitStore.ts (addGate, removeGate, useCircuitStore)
- src/store/historyStore.ts (useHistoryStore — for undo push in addGate/removeGate)
- src/types/circuit.types.ts (Gate, GateType)
- src/types/dragdrop.types.ts (DragGateItem)
- src/lib/gates/gateDefinitions.ts (getGateDefinition, numQubits)
- src/components/palette/GatePalette.tsx
- src/components/editor/CircuitControls.tsx
</context>

<tasks>

<task type="auto">
  <name>Build GridCell (drop zone) and PlacedGate</name>
  <files>
    src/components/editor/GridCell.tsx
    src/components/editor/PlacedGate.tsx
  </files>
  <action>
    **GridCell.tsx** — useDroppable cell:
    ```tsx
    // src/components/editor/GridCell.tsx
    import { useDroppable } from '@dnd-kit/core'

    interface GridCellProps {
      qubit: number
      column: number
      isOccupied: boolean
      children?: React.ReactNode
    }

    export function GridCell({ qubit, column, isOccupied, children }: GridCellProps) {
      const dropId = `cell-q${qubit}-c${column}`
      const { setNodeRef, isOver } = useDroppable({
        id: dropId,
        data: { qubit, column },
        disabled: isOccupied, // prevent drop on occupied cells
      })

      return (
        <div
          ref={setNodeRef}
          className={`
            relative w-16 h-16 border border-zinc-800 flex items-center justify-center
            transition-colors duration-100
            ${isOver && !isOccupied ? 'bg-violet-900/40 border-violet-500' : 'bg-transparent'}
            ${isOccupied ? 'cursor-default' : 'cursor-crosshair hover:bg-zinc-800/40'}
          `}
        >
          {children}
        </div>
      )
    }
    ```

    **PlacedGate.tsx** — rendered gate chip inside a cell:
    ```tsx
    // src/components/editor/PlacedGate.tsx
    import { X } from 'lucide-react'
    import type { Gate } from '@/types/circuit.types'
    import { getGateDefinition } from '@/lib/gates/gateDefinitions'

    interface PlacedGateProps {
      gate: Gate
      onDelete: (id: string) => void
    }

    export function PlacedGate({ gate, onDelete }: PlacedGateProps) {
      const def = getGateDefinition(gate.type)
      const label = def?.label ?? gate.type

      return (
        <div className="relative group w-14 h-14 flex flex-col items-center justify-center rounded-lg bg-violet-600 border border-violet-400 text-white select-none">
          <span className="text-sm font-mono font-bold leading-none">{label}</span>
          {gate.params?.theta !== undefined && (
            <span className="text-[9px] text-violet-200 mt-0.5">
              {(gate.params.theta / Math.PI).toFixed(2)}π
            </span>
          )}
          {/* Delete button — shown on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(gate.id) }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Delete gate"
          >
            <X size={10} />
          </button>
        </div>
      )
    }
    ```

    AVOID: making PlacedGate itself draggable in this plan — gate repositioning is a Phase 2 stretch goal, not in scope.
    AVOID: handling multi-qubit spans here — that is Plan 2.4.
  </action>
  <verify>`npm run build` exits 0 after adding these files.</verify>
  <done>GridCell and PlacedGate components exist, typed, build clean.</done>
</task>

<task type="auto">
  <name>Build CircuitGrid and CircuitEditor with DndContext</name>
  <files>
    src/components/editor/CircuitGrid.tsx
    src/components/editor/CircuitEditor.tsx
  </files>
  <action>
    **CircuitGrid.tsx** — DndContext host + full grid:
    ```tsx
    // src/components/editor/CircuitGrid.tsx
    import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core'
    import { useCircuitStore } from '@/store/circuitStore'
    import { getGateDefinition } from '@/lib/gates/gateDefinitions'
    import type { DragGateItem } from '@/types/dragdrop.types'
    import type { GateType } from '@/types/circuit.types'
    import { GridCell } from './GridCell'
    import { PlacedGate } from './PlacedGate'
    import { useState } from 'react'

    export function CircuitGrid() {
      const { numQubits, numColumns, gates, addGate, removeGate } = useCircuitStore()
      const [activeItem, setActiveItem] = useState<DragGateItem | null>(null)

      // Build occupation map: "q0_c1" → gateId
      const occupied = new Map<string, string>()
      for (const g of gates) {
        for (const q of g.qubits) {
          occupied.set(`q${q}_c${g.column}`, g.id)
        }
      }

      const handleDragEnd = (event: DragEndEvent) => {
        setActiveItem(null)
        const { over, active } = event
        if (!over) return
        const dragData = active.data.current as DragGateItem
        const { qubit, column } = over.data.current as { qubit: number; column: number }
        const def = getGateDefinition(dragData.gateType as GateType)
        if (!def) return

        // For single-qubit gates: validate cell is free
        const key = `q${qubit}_c${column}`
        if (occupied.has(key)) return // cell occupied — reject

        addGate({
          type: dragData.gateType as GateType,
          qubits: [qubit],
          column,
          params: def.defaultParams ? { ...def.defaultParams } : undefined,
        })
      }

      return (
        <DndContext
          onDragStart={(e) => setActiveItem(e.active.data.current as DragGateItem)}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-auto flex-1 p-4">
            {/* Qubit rows */}
            <div className="flex flex-col gap-0">
              {Array.from({ length: numQubits }, (_, qi) => (
                <div key={qi} className="flex items-center">
                  {/* Qubit label */}
                  <div className="w-12 flex-shrink-0 text-right pr-2 text-xs text-zinc-400 font-mono">
                    q[{qi}]
                  </div>
                  {/* Horizontal wire line + cells */}
                  <div className="flex items-center relative">
                    {/* Wire */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-600 -translate-y-0.5 pointer-events-none" />
                    {Array.from({ length: numColumns }, (_, ci) => {
                      const key = `q${qi}_c${ci}`
                      const gateId = occupied.get(key)
                      // Only render PlacedGate for the gate's primary qubit (qubits[0])
                      const gate = gateId ? gates.find(g => g.id === gateId && g.qubits[0] === qi) : undefined
                      return (
                        <GridCell key={ci} qubit={qi} column={ci} isOccupied={!!gateId}>
                          {gate && <PlacedGate gate={gate} onDelete={removeGate} />}
                        </GridCell>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DragOverlay: floating chip following cursor */}
          <DragOverlay>
            {activeItem && (
              <div className="w-14 h-14 rounded-lg bg-violet-600 border-2 border-violet-400 flex items-center justify-center text-white font-mono font-bold text-sm opacity-90 shadow-lg shadow-violet-900/50">
                {activeItem.gateType}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )
    }
    ```

    **CircuitEditor.tsx** — assembles the full editor view (replaces placeholder main content):
    ```tsx
    // src/components/editor/CircuitEditor.tsx
    import { GatePalette } from '@/components/palette/GatePalette'
    import { CircuitControls } from './CircuitControls'
    import { CircuitGrid } from './CircuitGrid'

    export function CircuitEditor() {
      return (
        <div className="flex flex-col h-full">
          <CircuitControls />
          <div className="flex flex-1 overflow-hidden">
            <GatePalette />
            <CircuitGrid />
          </div>
        </div>
      )
    }
    ```

    Then update `src/App.tsx` (or wherever AppShell renders `main`):
    - Import CircuitEditor and pass it as the `main` prop to AppShell.

    AVOID: putting DndContext in App.tsx or any ancestor — it must wrap both the palette (drag source) AND the grid (drop target). CircuitGrid is the correct scope.
    AVOID: using `setTimeout` or `useEffect` for drop handling — handle synchronously in onDragEnd.
  </action>
  <verify>
    1. `npm run build` exits 0.
    2. Browser: Drag H gate from palette → drop onto grid cell → small violet H chip appears in that cell.
    3. Browser: Hover over placed gate → red X appears → click X → gate removed.
    4. Browser: Dropping onto an occupied cell is rejected (no duplicate).
    5. `npm test -- --run` → 18/18 pass.
  </verify>
  <done>
    Drag-and-drop works end-to-end: palette → grid → placed gate. Delete works. Occupied rejection works. Tests clean.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] `npm test -- --run` → 18/18 pass
- [ ] Browser: H gate dragged to q[0] col 0 — violet chip renders, store has gate
- [ ] Browser: Qubit lines (wires) visible as horizontal gray lines
- [ ] Browser: Occupied cell does not accept second gate
- [ ] Browser: Delete X button removes gate from grid and store
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
