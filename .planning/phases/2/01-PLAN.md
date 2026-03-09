---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/store/circuitStore.ts
  - src/store/historyStore.ts
  - src/components/editor/CircuitControls.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "dnd-kit packages are installed and importable"
    - "Ctrl+Z undoes the last circuit mutation; Ctrl+Y/Ctrl+Shift+Z redoes it"
    - "User can change qubit count (1–20) and column count (1–50) via UI controls"
    - "undo/redo history is cleared when a new circuit is loaded via setCircuit()"
  artifacts:
    - "src/store/historyStore.ts exists with push/undo/redo actions"
    - "src/components/editor/CircuitControls.tsx exists with qubit + column inputs"
---

# Plan 2.1: Dependencies + Undo/Redo + Circuit Controls

<objective>
Install dnd-kit, wire undo/redo into a dedicated Zustand slice, and build the CircuitControls toolbar for qubit/column count. This is the foundation Wave 1 plan — everything the visual editor needs before gate drag-drop can be wired.

Purpose: Without undo/redo and dnd-kit installed, no subsequent plan can proceed.
Output: `historyStore.ts` (undo/redo), `CircuitControls.tsx` (toolbar), dnd-kit installed.
</objective>

<context>
Load for context:
- .planning/ROADMAP.md (Phase 2 requirements)
- src/store/circuitStore.ts (existing store — addGate/removeGate to wrap)
- src/types/circuit.types.ts (Gate, CircuitState types)
- package.json (to confirm what's installed)
</context>

<tasks>

<task type="auto">
  <name>Install dnd-kit packages</name>
  <files>package.json</files>
  <action>
    Run: `npm install @dnd-kit/core @dnd-kit/utilities`
    These are the only two packages needed for Phase 2:
    - `@dnd-kit/core` — DnDContext, useDraggable, useDroppable, DragOverlay
    - `@dnd-kit/utilities` — CSS.Transform.toString() helper
    AVOID: installing `@dnd-kit/sortable` or `@dnd-kit/modifiers` — not needed yet, adds bundle weight.
    After install, verify: `import { DndContext } from '@dnd-kit/core'` compiles without error.
  </action>
  <verify>npm run build -- --outDir /tmp/build-check 2>&1 | grep -i error | head -5 (zero TypeScript errors after install)</verify>
  <done>package.json lists @dnd-kit/core and @dnd-kit/utilities in dependencies. `npm run build` exits 0.</done>
</task>

<task type="auto">
  <name>Create historyStore with undo/redo + keyboard bindings</name>
  <files>
    src/store/historyStore.ts
    src/store/circuitStore.ts
  </files>
  <action>
    Create `src/store/historyStore.ts` — a Zustand store for circuit history:

    ```ts
    // src/store/historyStore.ts
    import { create } from 'zustand'
    import type { Gate } from '@/types/circuit.types'

    const MAX_HISTORY = 50

    interface HistoryEntry {
      gates: Gate[]
      numQubits: number
      numColumns: number
    }

    interface HistoryStore {
      past: HistoryEntry[]
      future: HistoryEntry[]
      pushHistory: (entry: HistoryEntry) => void
      undo: () => HistoryEntry | null
      redo: () => HistoryEntry | null
      clearHistory: () => void
    }

    export const useHistoryStore = create<HistoryStore>((set, get) => ({
      past: [],
      future: [],
      pushHistory: (entry) =>
        set(s => ({
          past: [...s.past, entry].slice(-MAX_HISTORY),
          future: [], // clear redo on new action
        })),
      undo: () => {
        const { past, future } = get()
        if (past.length === 0) return null
        const prev = past[past.length - 1]
        set({ past: past.slice(0, -1), future: [prev, ...future] })
        return prev
      },
      redo: () => {
        const { past, future } = get()
        if (future.length === 0) return null
        const next = future[0]
        set({ past: [...past, next], future: future.slice(1) })
        return next
      },
      clearHistory: () => set({ past: [], future: [] }),
    }))
    ```

    Then update `src/store/circuitStore.ts`:
    - Import `useHistoryStore` at top
    - In `addGate`: before mutating, call `useHistoryStore.getState().pushHistory({ gates: s.gates, numQubits: s.numQubits, numColumns: s.numColumns })`
    - In `removeGate`: same — push snapshot BEFORE deletion
    - In `setCircuit` and `resetCircuit`: call `useHistoryStore.getState().clearHistory()`
    - In `setNumQubits` and `setNumColumns`: push snapshot BEFORE update

    Add a `useKeyboardShortcuts` hook exported from `src/store/historyStore.ts`:
    ```ts
    // at bottom of historyStore.ts
    import { useEffect } from 'react'
    import { useCircuitStore } from './circuitStore'

    export function useUndoRedoKeyboard() {
      const { undo, redo } = useHistoryStore()
      const { gates, numQubits, numColumns, setGates, setNumQubits, setNumColumns } = useCircuitStore()
      useEffect(() => {
        const handler = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault()
            const prev = undo()
            if (prev) { setGates(prev.gates); setNumQubits(prev.numQubits); setNumColumns(prev.numColumns) }
          }
          if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault()
            const next = redo()
            if (next) { setGates(next.gates); setNumQubits(next.numQubits); setNumColumns(next.numColumns) }
          }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
      }, [undo, redo, setGates, setNumQubits, setNumColumns])
    }
    ```

    AVOID: putting undo history directly in circuitStore — separate concerns; history is UI-layer logic.
    AVOID: circular imports — historyStore imports from circuit.types (not circuitStore), circuitStore imports from historyStore via getState() (not hook).
  </action>
  <verify>
    1. Add a gate, Ctrl+Z → gate disappears.
    2. Ctrl+Y → gate reappears.
    3. `npm run build` exits 0 (no TS errors).
    4. `npm test -- --run` → all 18 existing tests still pass.
  </verify>
  <done>
    Undo restores previous gate list. Redo re-applies. Existing 18 tests still green. Build exits 0.
  </done>
</task>

<task type="auto">
  <name>Build CircuitControls toolbar (qubit count + column count)</name>
  <files>src/components/editor/CircuitControls.tsx</files>
  <action>
    Create `src/components/editor/CircuitControls.tsx`:
    - Two numeric inputs: "Qubits" (min 1, max 20, step 1) and "Columns" (min 1, max 50, step 1)
    - On change, call `setNumQubits(n)` / `setNumColumns(n)` from useCircuitStore
    - Show current value from store as default value
    - Styled: dark background, monospace font, small size — matches IDE aesthetic
    - Include "Undo" and "Redo" icon buttons (Undo2 / Redo2 from lucide-react)
    - Wire undo/redo buttons to the same logic as keyboard shortcuts
    - Include `useUndoRedoKeyboard()` call at the top of this component so the keyboard shortcuts are active when CircuitControls is mounted

    Layout: horizontal bar, `flex items-center gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900`

    AVOID: using uncontrolled inputs — use controlled inputs with value from the store.
    AVOID: triggering setNumQubits on every keystroke with an unvalidated value — validate range before calling.
  </action>
  <verify>
    Browser: change qubit input to 5 → useCircuitStore().numQubits equals 5.
    Browser: Undo button is clickable and triggers undo action.
    `npm run build` exits 0.
  </verify>
  <done>
    CircuitControls renders with qubit + column inputs wired to store. Undo/Redo buttons work. Build clean.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm install` succeeded — @dnd-kit/core and @dnd-kit/utilities in node_modules
- [ ] `npm run build` exits 0 (zero TypeScript errors)
- [ ] `npm test -- --run` → 18/18 pass
- [ ] Manual: Add gate → Ctrl+Z → gate removed → Ctrl+Y → gate restored
- [ ] Manual: Change qubit count → value updates in store
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
