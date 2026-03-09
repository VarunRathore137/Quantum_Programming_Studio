---
phase: 2
plan: 2
wave: 1
depends_on: []
files_modified:
  - src/lib/gates/gateDefinitions.ts
  - src/components/palette/GatePalette.tsx
  - src/components/palette/DraggableGateChip.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Beginner palette shows exactly H, X, Y, Z, CNOT, MEASURE (≤10 gates)"
    - "Advanced palette shows all 18 GateTypes organized in categories"
    - "Each gate chip is draggable via dnd-kit useDraggable"
    - "Toggle button switches between Beginner and Advanced views"
  artifacts:
    - "src/lib/gates/gateDefinitions.ts exists with all gate metadata"
    - "src/components/palette/GatePalette.tsx exists"
    - "src/components/palette/DraggableGateChip.tsx exists"
---

# Plan 2.2: Gate Palette — Beginner/Advanced Toggle

<objective>
Build the gate palette panel with Beginner/Advanced toggle (CIRCUIT-08). Each gate chip is a draggable dnd-kit source. The palette is the left panel side of the circuit editor.

Purpose: Users need a visual gate picker. This plan delivers the full palette without needing the drop zone — drag sources and drop targets are intentionally decoupled.
Output: `gateDefinitions.ts`, `GatePalette.tsx`, `DraggableGateChip.tsx`
</objective>

<context>
Load for context:
- src/types/circuit.types.ts (GateType union)
- src/types/dragdrop.types.ts (GatePaletteItem, DragGateItem)
- .planning/research/STACK.md (dnd-kit chosen)
</context>

<tasks>

<task type="auto">
  <name>Create gate definitions registry</name>
  <files>src/lib/gates/gateDefinitions.ts</files>
  <action>
    Create `src/lib/gates/gateDefinitions.ts` — pure data, no React:

    ```ts
    import type { GateType } from '@/types/circuit.types'

    export interface GateDefinition {
      type: GateType
      label: string          // short symbol: "H", "X", "CX"
      name: string           // full name: "Hadamard", "Pauli-X", "CNOT"
      category: 'single' | 'two-qubit' | 'parametric' | 'measurement'
      beginner: boolean      // show in beginner palette?
      numQubits: number      // 1 or 2 (for validation in drop zone)
      defaultParams?: { theta?: number; phi?: number; lambda?: number }
      description: string    // tooltip text
    }

    export const GATE_DEFINITIONS: GateDefinition[] = [
      // === SINGLE QUBIT (Beginner) ===
      { type: 'H',    label: 'H',    name: 'Hadamard',   category: 'single',      beginner: true,  numQubits: 1, description: 'Creates equal superposition' },
      { type: 'X',    label: 'X',    name: 'Pauli-X',    category: 'single',      beginner: true,  numQubits: 1, description: 'Bit flip (NOT gate)' },
      { type: 'Y',    label: 'Y',    name: 'Pauli-Y',    category: 'single',      beginner: false, numQubits: 1, description: 'Bit + phase flip' },
      { type: 'Z',    label: 'Z',    name: 'Pauli-Z',    category: 'single',      beginner: true,  numQubits: 1, description: 'Phase flip' },
      { type: 'S',    label: 'S',    name: 'S Gate',     category: 'single',      beginner: false, numQubits: 1, description: '√Z phase gate' },
      { type: 'T',    label: 'T',    name: 'T Gate',     category: 'single',      beginner: false, numQubits: 1, description: 'π/8 phase gate' },
      { type: 'Sdg',  label: 'S†',   name: 'S-Dagger',   category: 'single',      beginner: false, numQubits: 1, description: 'Inverse S gate' },
      { type: 'Tdg',  label: 'T†',   name: 'T-Dagger',   category: 'single',      beginner: false, numQubits: 1, description: 'Inverse T gate' },
      // === TWO-QUBIT (Beginner: CNOT only) ===
      { type: 'CNOT',    label: 'CX',   name: 'CNOT',       category: 'two-qubit',   beginner: true,  numQubits: 2, description: 'Controlled-NOT (entangling)' },
      { type: 'CZ',      label: 'CZ',   name: 'Ctrl-Z',     category: 'two-qubit',   beginner: false, numQubits: 2, description: 'Controlled-Phase flip' },
      { type: 'SWAP',    label: '⇌',    name: 'SWAP',        category: 'two-qubit',   beginner: false, numQubits: 2, description: 'Exchange two qubits' },
      { type: 'Toffoli', label: 'CCX',  name: 'Toffoli',     category: 'two-qubit',   beginner: false, numQubits: 3, description: 'Controlled-Controlled-NOT' },
      // === PARAMETRIC ===
      { type: 'RX', label: 'Rx', name: 'RX',   category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 2 }, description: 'X-axis rotation by θ' },
      { type: 'RY', label: 'Ry', name: 'RY',   category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 2 }, description: 'Y-axis rotation by θ' },
      { type: 'RZ', label: 'Rz', name: 'RZ',   category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 2 }, description: 'Z-axis rotation by θ' },
      { type: 'U3', label: 'U',  name: 'U3',   category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: 0, phi: 0, lambda: 0 }, description: 'General single-qubit gate (θ, φ, λ)' },
      { type: 'P',  label: 'P',  name: 'Phase', category: 'parametric', beginner: false, numQubits: 1, defaultParams: { theta: Math.PI / 4 }, description: 'Phase gate by θ' },
      // === MEASUREMENT ===
      { type: 'MEASURE',  label: '⊗', name: 'Measure',  category: 'measurement', beginner: true,  numQubits: 1, description: 'Measure qubit in Z basis' },
      { type: 'BARRIER',  label: '|', name: 'Barrier',  category: 'measurement', beginner: false, numQubits: 1, description: 'Circuit barrier (timing marker)' },
    ]

    export const BEGINNER_GATES = GATE_DEFINITIONS.filter(g => g.beginner)
    export const ADVANCED_GATE_CATEGORIES: Record<string, GateDefinition[]> = {
      'Single Qubit': GATE_DEFINITIONS.filter(g => g.category === 'single'),
      'Two Qubit':    GATE_DEFINITIONS.filter(g => g.category === 'two-qubit'),
      'Parametric':   GATE_DEFINITIONS.filter(g => g.category === 'parametric'),
      'Measurement':  GATE_DEFINITIONS.filter(g => g.category === 'measurement'),
    }

    export function getGateDefinition(type: GateType): GateDefinition | undefined {
      return GATE_DEFINITIONS.find(g => g.type === type)
    }
    ```

    AVOID: using string literals for gate types — always reference GateType from circuit.types.ts.
  </action>
  <verify>TypeScript strict mode compiles this file with 0 errors (`npx tsc --noEmit`).</verify>
  <done>gateDefinitions.ts exports GATE_DEFINITIONS (19 entries), BEGINNER_GATES (6), ADVANCED_GATE_CATEGORIES. All typed against GateType.</done>
</task>

<task type="auto">
  <name>Build DraggableGateChip + GatePalette component</name>
  <files>
    src/components/palette/DraggableGateChip.tsx
    src/components/palette/GatePalette.tsx
  </files>
  <action>
    **DraggableGateChip.tsx** — useDraggable from @dnd-kit/core:
    ```tsx
    // src/components/palette/DraggableGateChip.tsx
    import { useDraggable } from '@dnd-kit/core'
    import { CSS } from '@dnd-kit/utilities'
    import type { GateDefinition } from '@/lib/gates/gateDefinitions'
    import type { DragGateItem } from '@/types/dragdrop.types'

    interface Props { gate: GateDefinition }

    export function DraggableGateChip({ gate }: Props) {
      const dragData: DragGateItem = { gateType: gate.type, angle: gate.defaultParams?.theta ?? null, timestamp: Date.now() }
      const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `palette-${gate.type}`,
        data: dragData,
      })
      const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }

      return (
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          title={gate.description}
          className={`
            select-none cursor-grab active:cursor-grabbing
            flex flex-col items-center justify-center
            w-14 h-14 rounded-lg border border-zinc-700
            bg-zinc-800 hover:bg-zinc-700 hover:border-violet-500
            text-zinc-100 transition-colors
            ${isDragging ? 'ring-2 ring-violet-400' : ''}
          `}
        >
          <span className="text-lg font-mono font-bold leading-none">{gate.label}</span>
          <span className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[52px] text-center">{gate.name}</span>
        </div>
      )
    }
    ```

    **GatePalette.tsx** — the full palette panel:
    ```tsx
    // src/components/palette/GatePalette.tsx
    import { useState } from 'react'
    import { BEGINNER_GATES, ADVANCED_GATE_CATEGORIES } from '@/lib/gates/gateDefinitions'
    import { DraggableGateChip } from './DraggableGateChip'

    export function GatePalette() {
      const [advanced, setAdvanced] = useState(false)

      return (
        <aside className="w-52 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-y-auto">
          {/* Header + toggle */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gates</span>
            <button
              onClick={() => setAdvanced(v => !v)}
              className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              {advanced ? 'Beginner' : 'Advanced'}
            </button>
          </div>

          {/* Gate chips */}
          <div className="flex-1 overflow-y-auto p-2">
            {!advanced ? (
              // Beginner: flat grid, no categories
              <div className="grid grid-cols-2 gap-2">
                {BEGINNER_GATES.map(gate => <DraggableGateChip key={gate.type} gate={gate} />)}
              </div>
            ) : (
              // Advanced: categorized sections
              Object.entries(ADVANCED_GATE_CATEGORIES).map(([cat, gates]) => (
                <div key={cat} className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 px-1">{cat}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {gates.map(gate => <DraggableGateChip key={gate.type} gate={gate} />)}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )
    }
    ```

    AVOID: importing from @dnd-kit/sortable — not installed, not needed.
    AVOID: using any — keep DragGateItem fully typed.
  </action>
  <verify>
    1. `npm run build` exits 0.
    2. Browser: GatePalette renders in left panel. Beginner shows 6 chips. Toggle → Advanced shows 19 chips in 4 categories.
    3. Browser: Dragging a chip shows the cursor grab indicator. (Drop target not yet wired — chip just snaps back.)
  </verify>
  <done>
    GatePalette renders. Beginner ≤10 chips visible. Advanced shows all 19 in categories. Drag cursor works. Build exits 0.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] `npm test -- --run` → 18/18 still pass (no regression)
- [ ] Browser: Beginner palette shows H, X, Z, CNOT, MEASURE (6 gates)
- [ ] Browser: Advanced toggle works, shows 4 category sections
- [ ] Browser: Dragging a chip shows drag cursor (no console errors)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
