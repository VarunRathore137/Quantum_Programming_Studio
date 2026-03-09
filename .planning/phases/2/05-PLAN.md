---
phase: 2
plan: 5
wave: 3
depends_on: [2.3]
files_modified:
  - src/components/editor/AngleEditor.tsx
  - src/components/editor/PlacedGate.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "RX, RY, RZ, U3, P gates show an angle input field when placed on the grid"
    - "Changing the angle value updates Gate.params.theta in CircuitStore"
    - "Angle is displayed as a fraction of π (e.g., '0.50π') on the placed gate chip"
    - "Non-parametric gates have no angle field"
  artifacts:
    - "src/components/editor/AngleEditor.tsx exists"
    - "PlacedGate.tsx imports and renders AngleEditor for parametric gates"
---

# Plan 2.5: Parametric Gate Angle Editor

<objective>
Allow users to set rotation angles for parametric gates (RX, RY, RZ, U3, P) directly on the placed gate chip. A small inline angle input appears on the chip. Changes update the gate's params in CircuitStore via a new `updateGateParams` action.

Purpose: Parametric gates are useless without being able to set their angle. This plan delivers CIRCUIT-07 (set parametric gate angles).
Output: AngleEditor component, updateGateParams action in circuitStore, PlacedGate updated to show angle editor.
</objective>

<context>
Load for context:
- src/store/circuitStore.ts (needs new updateGateParams action)
- src/store/historyStore.ts (push snapshot before param update)
- src/types/circuit.types.ts (Gate.params structure)
- src/lib/gates/gateDefinitions.ts (category: 'parametric' — to detect parametric gates)
- src/components/editor/PlacedGate.tsx (to extend with AngleEditor)
</context>

<tasks>

<task type="auto">
  <name>Add updateGateParams action to circuitStore</name>
  <files>src/store/circuitStore.ts</files>
  <action>
    Add `updateGateParams` to the CircuitStore interface and implementation:

    Interface addition:
    ```ts
    updateGateParams: (id: string, params: Gate['params']) => void
    ```

    Implementation:
    ```ts
    updateGateParams: (id, params) => {
      const { gates, numQubits, numColumns } = get()
      useHistoryStore.getState().pushHistory({ gates, numQubits, numColumns })
      set(s => ({
        gates: s.gates.map(g => g.id === id ? { ...g, params: { ...g.params, ...params } } : g)
      }))
    },
    ```

    AVOID: mutating params in place — always spread the existing params object.
    AVOID: pushing history AFTER the update — always push the snapshot BEFORE mutation so undo restores correct state.
  </action>
  <verify>TypeScript compiles with 0 errors. `npm test -- --run` → 18/18 pass.</verify>
  <done>circuitStore exports updateGateParams. Changing params on a gate pushes undo history snapshot first.</done>
</task>

<task type="auto">
  <name>Build AngleEditor and update PlacedGate to show it</name>
  <files>
    src/components/editor/AngleEditor.tsx
    src/components/editor/PlacedGate.tsx
  </files>
  <action>
    **AngleEditor.tsx**:
    ```tsx
    // src/components/editor/AngleEditor.tsx
    import { useState } from 'react'

    interface AngleEditorProps {
      value: number           // angle in radians
      onChange: (rad: number) => void
    }

    export function AngleEditor({ value, onChange }: AngleEditorProps) {
      // Display as multiples of π; edit raw number
      const [editing, setEditing] = useState(false)
      const [draft, setDraft] = useState('')

      const displayPi = `${(value / Math.PI).toFixed(2)}π`

      const handleBlur = () => {
        setEditing(false)
        const parsed = parseFloat(draft)
        if (!isNaN(parsed)) onChange(parsed * Math.PI)
      }

      if (editing) {
        return (
          <input
            autoFocus
            type="number"
            step="0.25"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => { if (e.key === 'Enter') handleBlur(); if (e.key === 'Escape') setEditing(false) }}
            onClick={e => e.stopPropagation()}
            className="w-14 text-center text-[10px] bg-zinc-900 border border-violet-400 rounded text-violet-200 outline-none px-1"
            title="Enter angle as multiple of π (e.g. 0.5 = π/2)"
          />
        )
      }

      return (
        <button
          onClick={e => { e.stopPropagation(); setDraft((value / Math.PI).toFixed(2)); setEditing(true) }}
          className="text-[9px] text-violet-200 hover:text-white underline decoration-dotted mt-0.5 leading-none"
          title="Click to edit angle"
        >
          {displayPi}
        </button>
      )
    }
    ```

    **Update PlacedGate.tsx** to render AngleEditor for parametric gates:
    - Import `getGateDefinition` from gateDefinitions
    - Import `useCircuitStore` for `updateGateParams`
    - Import `AngleEditor`
    - In PlacedGate, check `def?.category === 'parametric'`
    - If parametric, render `<AngleEditor value={gate.params?.theta ?? 0} onChange={rad => updateGateParams(gate.id, { theta: rad })} />`

    Full updated PlacedGate:
    ```tsx
    // src/components/editor/PlacedGate.tsx
    import { X } from 'lucide-react'
    import type { Gate } from '@/types/circuit.types'
    import { getGateDefinition } from '@/lib/gates/gateDefinitions'
    import { useCircuitStore } from '@/store/circuitStore'
    import { AngleEditor } from './AngleEditor'

    interface PlacedGateProps {
      gate: Gate
      onDelete: (id: string) => void
    }

    export function PlacedGate({ gate, onDelete }: PlacedGateProps) {
      const def = getGateDefinition(gate.type)
      const label = def?.label ?? gate.type
      const { updateGateParams } = useCircuitStore()
      const isParametric = def?.category === 'parametric'

      return (
        <div className="relative group w-14 h-14 flex flex-col items-center justify-center rounded-lg bg-violet-600 border border-violet-400 text-white select-none">
          <span className="text-sm font-mono font-bold leading-none">{label}</span>
          {isParametric && (
            <AngleEditor
              value={gate.params?.theta ?? 0}
              onChange={rad => updateGateParams(gate.id, { theta: rad })}
            />
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
    }
    ```

    AVOID: Using `<input type="range">` slider — the target is an IDE, so precise numeric input is more appropriate.
    AVOID: Calling onChange on every keystroke in text input — only commit on blur/Enter.
  </action>
  <verify>
    Browser: Place RX gate → chip shows "0.50π" label → click label → input appears → type "0.25" → blur → chip now shows "0.25π" → circuitStore gate.params.theta equals 0.25 * Math.PI.
    Browser: H gate (non-parametric) has no angle field.
    Browser: Ctrl+Z after angle change → angle reverts.
    `npm run build` exits 0. `npm test -- --run` → 18/18 pass.
  </verify>
  <done>
    Parametric gates show editable angle field in π units. Changes persist to store. Undo reverts angle. Non-parametric gates unaffected. Build clean.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] `npm test -- --run` → 18/18 pass
- [ ] Browser: RX gate shows "0.50π" → click → edit to "0.25" → blur → store shows theta = π/4
- [ ] Browser: Ctrl+Z reverts angle to previous value
- [ ] Browser: H gate has no angle field (category !== 'parametric')
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
