---
phase: 3
plan: 4
wave: 3
depends_on: [3.1, 3.2, 3.3]
files_modified:
  - src/components/editor/CircuitControls.tsx
  - src/components/sidebar/CopilotSidebar.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "User can export the circuit in QASM2, QASM3, and Qiskit formats via a dropdown menu"
    - "Export copies text to clipboard with visual confirmation (toast notification)"
    - "Export also supports JSON download (circuit data as .json file)"
    - "CopilotSidebar shows qubit selector to view Bloch sphere for any qubit (not just q[0])"
    - "Qubit selector is a small tabbed row of q[0], q[1], … q[N-1] buttons"
  artifacts:
    - "Export dropdown component added to CircuitControls.tsx toolbar"
    - "BlochSphere qubit selector added to CopilotSidebar.tsx"
  key_links:
    - "Export uses existing circuitStore.exportQASM2(), exportQASM3(), exportQiskit() methods"
    - "BlochSphere qubitIndex prop (added in Plan 3.2) driven by CopilotSidebar local state"
---

# Plan 3.4: Export Panel + Multi-Qubit Bloch Sphere Selector

<objective>
Add a functional export panel (QASM2 / QASM3 / Qiskit / JSON) to the toolbar and
let users select which qubit to visualize on the Bloch sphere.

Purpose: Completes Phase 3 — the app now captures, simulates, and exports circuits.
Output: Export dropdown added to CircuitControls.tsx + qubit selector in CopilotSidebar.tsx
</objective>

<context>
Load for context:
- src/components/editor/CircuitControls.tsx (toolbar where export button will go)
- src/components/sidebar/CopilotSidebar.tsx (where qubit selector + BlochSphere go)
- src/store/circuitStore.ts (exportQASM2, exportQASM3, exportQiskit, exportToJSON methods)
- src/components/sidebar/BlochSphere.tsx (accepts qubitIndex prop from Plan 3.2)
</context>

<tasks>

<task type="auto">
  <name>Add "Export" dropdown to CircuitControls toolbar</name>
  <files>src/components/editor/CircuitControls.tsx</files>
  <action>
    Add an "Export ↓" button with a popover dropdown to CircuitControls, placed between
    the Simulate button and the Run on Hardware button.

    Implementation (no external popover library — use React state + absolute positioning):
    - Add `const [showExport, setShowExport] = useState(false)` local state
    - Add a click-outside handler via useEffect (document mousedown listener) to close dropdown
    - Wrap in a `relative` div to anchor the dropdown

    Export button styling:
    - Same size as Simulate button, use `bg-emerald-600/20 text-emerald-400 border-emerald-500/30` variant
    - Icon: a simple Download icon (use ChevronDown from lucide-react or SVG arrow)
    - Label: "Export"

    Dropdown menu (absolute positioned, `top-full mt-1`, `bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50`):
    ```
    ┌──────────────────────────┐
    │ Copy QASM 2.0            │
    │ Copy QASM 3.0            │
    │ Copy Qiskit Python       │
    │ ────────────────         │
    │ Download JSON            │
    └──────────────────────────┘
    ```
    Each item calls the corresponding store method on click:
    - "Copy QASM 2.0": `navigator.clipboard.writeText(exportQASM2())`
    - "Copy QASM 3.0": `navigator.clipboard.writeText(exportQASM3())`
    - "Copy Qiskit":   `navigator.clipboard.writeText(exportQiskit())`
    - "Download JSON": create a Blob, trigger `<a download="circuit.json">` click programmatically

    After any copy action: briefly show a "Copied!" badge next to the export button
    (useState for 1500ms then reset to null). Use emerald-400 color.

    AVOID: Using any third-party dropdown/popover library (not in package.json).
    AVOID: Async clipboard API — navigator.clipboard.writeText returns a Promise, handle with .catch silently.
  </action>
  <verify>
    npm run build exits 0
    npm run dev — click Export button: dropdown opens.
    Click "Copy QASM 2.0": "Copied!" badge appears for ~1.5s; paste in a text editor confirms QASM is there.
    Click "Download JSON": browser prompts to download circuit.json.
  </verify>
  <done>
    Export dropdown functional. All 4 export formats work. "Copied!" feedback visible. JSON download works.
  </done>
</task>

<task type="auto">
  <name>Add qubit selector tabs to BlochSphere panel in CopilotSidebar</name>
  <files>src/components/sidebar/CopilotSidebar.tsx</files>
  <action>
    Update CopilotSidebar to let the user select which qubit's Bloch sphere to view:
    - Add `const [selectedQubit, setSelectedQubit] = useState(0)` local state
    - Read `numQubits` from `useCircuitStore(s => s.numQubits)`
    - Clamp `selectedQubit` to 0 when numQubits decreases (useEffect)

    Above the BlochSphere component, add a horizontal qubit selector row:
    ```tsx
    <div className="flex gap-1 justify-center mb-2 flex-wrap">
      {Array.from({ length: numQubits }, (_, i) => (
        <button
          key={i}
          onClick={() => setSelectedQubit(i)}
          className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
            selectedQubit === i
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-zinc-700/50'
          }`}
        >
          q[{i}]
        </button>
      ))}
    </div>
    ```

    Pass `qubitIndex={selectedQubit}` to `<BlochSphere />`.

    Only show the selector row when numQubits > 1. When numQubits === 1, show BlochSphere directly
    without a selector (qubitIndex=0 implicitly).

    AVOID: Showing more than 6 qubit tabs — add a small scroll if numQubits > 6 (`overflow-x-auto`).
    AVOID: Resetting selectedQubit on every gate drop — only clamp if out of range.
  </action>
  <verify>
    npm run dev — in browser:
    1. Set qubits to 3: three tabs q[0], q[1], q[2] appear above Bloch sphere
    2. Drop H on q[0]: switch to q[0] tab → vector at equator; switch to q[1] → vector at |0⟩
    3. Set qubits to 1: tab row disappears, just BlochSphere shown
  </verify>
  <done>
    Qubit selector tabs appear for numQubits > 1. Bloch sphere shows correct qubit's state.
    Switching tabs updates the sphere with animated SVG transition.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] Export dropdown opens/closes correctly; click-outside closes it
- [ ] "Copy QASM 2.0" produces valid QASM in clipboard
- [ ] "Download JSON" downloads a .json file
- [ ] "Copied!" badge appears briefly after copying
- [ ] Qubit selector tabs show for numQubits > 1
- [ ] Selecting different qubit tab shows correct Bloch sphere state
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] `npm run build` exits 0 across all plans
</success_criteria>
