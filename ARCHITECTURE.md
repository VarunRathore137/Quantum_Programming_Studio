# Quantum Programming Studio — Architecture

## Overview

**Quantum Programming Studio** is a browser-based, interactive quantum circuit editor. Users drag-and-drop quantum gates from a palette onto a circuit canvas. The circuit state is managed in React state using pure TypeScript classes. No backend, no quantum runtime — this is a front-end visual editor that can _export_ to Qiskit Python code.

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          Browser (React SPA)                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                     App.tsx (DndProvider)                       │  │
│  │                                                                 │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │              QuantumCircuitEditor.tsx                      │ │  │
│  │  │   State: circuit (QuantumCircuit), errorMessage,           │ │  │
│  │  │           successMessage                                   │ │  │
│  │  │                                                            │ │  │
│  │  │  ┌─────────────────┐   ┌─────────────────────────────────┐ │ │  │
│  │  │  │  GatePalette    │   │      CircuitCanvas              │ │ │  │
│  │  │  │                 │   │   (grid: qubits × columns)      │ │ │  │
│  │  │  │  GatePaletteItem│   │   ┌─────────────────────────┐   │ │ │  │
│  │  │  │  (useDrag hook) │   │   │     CircuitCell         │   │ │ │  │
│  │  │  │    ─────────────┼──▶│   │   (useDrop hook)        │   │ │ │  │
│  │  │  │    drag: "GATE" │   │   └─────────────────────────┘   │ │ │  │
│  │  │  └─────────────────┘   └─────────────────────────────────┘ │ │  │
│  │  │                  ▲                     │                    │ │  │
│  │  │                  │  onGateDropped()    │                    │ │  │
│  │  └──────────────────┼─────────────────────┼────────────────────┘ │  │
│  │                     │                     ▼                       │  │
│  │             ┌────────────────────────────────────┐               │  │
│  │             │  QuantumCircuit (class)             │               │  │
│  │             │   gates: QuantumGate[]              │               │  │
│  │             │   history: snapshot[]               │               │  │
│  │             │   + addGate / removeGate            │               │  │
│  │             │   + undo / redo                     │               │  │
│  │             │   + exportToQiskit / exportToJSON   │               │  │
│  │             └────────────────────────────────────┘               │  │
│  │                         │                                        │  │
│  │                         ▼                                        │  │
│  │             ┌────────────────────────────┐                       │  │
│  │             │  QuantumGate (class)        │                       │  │
│  │             │   id, type, targets,        │                       │  │
│  │             │   controls, angle, position │                       │  │
│  │             │   + validate / clone / JSON │                       │  │
│  │             └────────────────────────────┘                       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
App
└── DndProvider (HTML5Backend)
    └── QuantumCircuitEditor          ← top-level stateful editor
        ├── GatePalette               ← left panel; lists available gates by category
        │   └── GatePaletteItem[]     ← each gate is draggable (useDrag, type="GATE")
        └── CircuitCanvas             ← right panel; n-qubit × m-column grid
            └── CircuitCell[][]       ← each cell is a drop target (useDrop, accept="GATE")
                                         → occupied cells render a gate-box instead
```

---

## Data Flow

```
User drag ──▶ GatePaletteItem (useDrag)
                  │  item = { gateType, angle, timestamp }
                  ▼
             CircuitCell (useDrop, accept: "GATE")
                  │  onDrop(item, qubit, column)
                  ▼
             CircuitCanvas.handleGateDrop()
                  │  constructs DropPosition { qubit, column, x:0, y:0 }
                  ▼
             QuantumCircuitEditor.handleGateDropped()
                  │  circuit.clone() → newCircuit.addGate(...)
                  ▼
             setCircuit(newCircuit) → React re-render
```

---

## File Structure

```
quantum-studio/
├── public/
│   └── index.html                   Entry HTML
├── src/
│   ├── index.tsx                    React DOM entry (ReactDOM.render)
│   ├── App.tsx                      DndProvider + QuantumCircuitEditor mount
│   ├── App.css                      Global app wrapper styles
│   │
│   ├── classes/                     Domain model (pure TypeScript, no React)
│   │   ├── QuantumCircuit.ts        ⚠️ MISMATCHED: contains QuantumCircuitEditor logic
│   │   └── QuantumGate.ts           Gate class: type, targets, controls, angle, validate
│   │
│   ├── components/                  React UI components
│   │   ├── QuantumCircuitEditor.tsx ⚠️ CORRUPTED: contains garbled/truncated JSX
│   │   ├── CircuitCanvas.tsx        Grid display; maps qubits × columns to CircuitCell
│   │   ├── CircuitCell.tsx          useDrop hook; single droppable cell in the grid
│   │   ├── GatePalette.tsx          ⚠️ MISMATCHED: contains GatePalette.css content
│   │   └── GatePaletteItem.tsx      useDrag hook; represents one draggable gate
│   │
│   ├── styles/                      CSS modules (plain CSS, no preprocessor)
│   │   ├── QuantumCircuitEditor.css Editor layout, header, footer
│   │   ├── CircuitCanvas.css        Canvas grid, gate-box, cell drop states
│   │   ├── GatePalette.css          Palette panel, gate-grid, parametric sliders
│   │   └── DragDrop.css             Shared drag/drop visual feedback styles
│   │
│   └── types/
│       └── dragdrop.types.ts        Shared interfaces: DragGateItem, DropPosition,
│                                    GatePaletteItem, CircuitGridState, etc.
│
├── package.json                     Dependencies: react, react-dnd, typescript
└── tsconfig.json                    Strict TS: noImplicitAny, strictNullChecks, etc.
```

> ⚠️ **File Integrity Issues Detected**
> Three files have clearly mismatched content relative to their filenames:
> - `src/classes/QuantumCircuit.ts` — contains a full `QuantumCircuitEditor` component, not a `QuantumCircuit` class
> - `src/components/QuantumCircuitEditor.tsx` — contains severely garbled/truncated JSX (likely a save-corruption artifact)
> - `src/components/GatePalette.tsx` — contains raw CSS from `GatePalette.css`, not a React component

---

## Key Classes & Interfaces

### `QuantumGate` (`src/classes/QuantumGate.ts`)

| Member | Type | Purpose |
|--------|------|---------|
| `id` | `string` | Unique ID per gate (`gate_<ts>_<rand>`) |
| `type` | `string` | `H`, `X`, `Y`, `Z`, `S`, `T`, `RX`, `RY`, `RZ`, `CNOT`, `SWAP`, `MEASURE` |
| `targets` | `number[]` | Target qubit indices |
| `controls` | `number[]` | Control qubit indices |
| `angle` | `number \| null` | Rotation angle for parametric gates |
| `position` | `GatePosition` | `{ row, column }` on the circuit grid |
| `validate()` | method | Checks gate against 7 quantum rules |
| `clone()` | method | Deep copy for immutable state updates |
| `toJSON()` | method | Serialization to plain object |
| `fromJSON()` | static | Deserialization |

### `QuantumCircuit` (intended — actual file is mislabeled)

Based on usage across components, the circuit class provides:
- `addGate(type, targets, controls, angle, position)` → gateId
- `removeGate(gateId)`
- `getGate(gateId)` → `QuantumGate`
- `getGatesOnQubit(qubitIndex)` → `QuantumGate[]`
- `getGateCount()` → `number`
- `getCircuitDepth()` → `number`
- `getStatistics()` → `CircuitStats`
- `canUndo() / undo()`, `canRedo() / redo()`
- `exportToQiskit()` → Python code string
- `exportToJSON()` → JSON object
- `clone()` → deep copy (polyfilled at runtime in `App.tsx`)

### Type Interfaces (`src/types/dragdrop.types.ts`)

| Interface | Fields |
|-----------|--------|
| `DragGateItem` | `gateType`, `angle?`, `timestamp` |
| `DropPosition` | `qubit`, `column`, `x`, `y` |
| `DragCollectProps` | `isDragging`, `draggedItem`, `currentOffset` |
| `DropCollectProps` | `isOver`, `canDrop`, `dropItem` |
| `GatePaletteItem` | `type`, `name`, `icon`, `category`, `angle?`, `description?` |
| `CircuitGridState` | `numQubits`, `numColumns`, `occupied: Map<string, string>` |
| `DropValidationResult` | `isValid`, `reason?`, `suggestedAlternatives?` |

---

## State Management

State is held in `QuantumCircuitEditor` using `useState`. Circuit mutations always follow an **immutable clone pattern**:

```ts
const newCircuit = circuit.clone();
newCircuit.addGate(/* ... */);
setCircuit(newCircuit);    // triggers re-render
```

The `QuantumCircuit` internally maintains a **history stack** for undo/redo. No external state library (Redux, Zustand, etc.) is used.

---

## Drag-and-Drop Architecture (react-dnd)

| Layer | Component | Hook | DnD Role |
|-------|-----------|------|----------|
| Source | `GatePaletteItem` | `useDrag` | Declares type `"GATE"`, carries `DragGateItem` |
| Target | `CircuitCell` | `useDrop` | Accepts type `"GATE"`, enforces `canDrop` logic |
| Provider | `App` | `DndProvider` | HTML5 backend wraps the whole app |

---

## Export Capabilities

The circuit supports two export formats:
- **Qiskit (Python)** — `circuit.exportToQiskit()` generates executable Python code
- **JSON** — `circuit.exportToJSON()` downloads a structured JSON file of all gates

---

## Known Technical Debt

| Issue | Severity | Location |
|-------|----------|----------|
| File content mismatch (`QuantumCircuit.ts`) | 🔴 High | `src/classes/QuantumCircuit.ts` |
| Corrupted `QuantumCircuitEditor.tsx` with garbled JSX | 🔴 High | `src/components/QuantumCircuitEditor.tsx` |
| `GatePalette.tsx` contains CSS, not a React component | 🔴 High | `src/components/GatePalette.tsx` |
| Dead code after `export default App` in App.tsx (lines 24-30) | 🟡 Medium | `src/App.tsx` |
| `clone()` polyfill via `QuantumCircuit.prototype.clone` | 🟡 Medium | `src/classes/QuantumCircuit.ts` |
| No tests present | 🟡 Medium | Project-wide |
| `GatePalette` component body is missing — unknown what gates are listed | 🟡 Medium | `src/components/GatePalette.tsx` |
| `CircuitStats.numClassicalBits` always 0 (no classical register logic) | 🟢 Low | `QuantumCircuitEditor.tsx` |
