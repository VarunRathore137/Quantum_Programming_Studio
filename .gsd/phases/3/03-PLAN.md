---
phase: 3
plan: 3
wave: 2
depends_on: [3.1, 3.2]
files_modified:
  - src/components/editor/CircuitControls.tsx
  - src/components/sidebar/CopilotSidebar.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Simulate button in CircuitControls triggers runSimulation() and shows loading state"
    - "State Probability widget in CopilotSidebar shows real basis-state probabilities from simulatorStore"
    - "Probability bars show up to 8 basis states (|000⟩ through |111⟩) when numQubits <= 3"
    - "When numQubits > 3, show top 8 highest-probability states (truncated with a note)"
    - "Zero-probability states are visually dimmed (opacity-30) but still listed"
  artifacts:
    - "CircuitControls.tsx calls useSimulatorStore for state and runSimulation()"
    - "CopilotSidebar.tsx reads real probabilities from simulatorStore"
  key_links:
    - "Simulate button connects CircuitControls → simulatorStore.runSimulation()"
    - "Probability bars in CopilotSidebar use simulatorStore.result.probabilities"
---

# Plan 3.3: Simulate Button Integration + Real Probability Display

<objective>
Wire the "Simulate" button to the real simulator and replace the static hardcoded
state probabilities in CopilotSidebar with live data from simulatorStore.

Purpose: Makes the simulation visible and interactive to the user — closing the loop
from circuit building → simulation → results visualization.
Output: Updated CircuitControls.tsx + updated CopilotSidebar.tsx
</objective>

<context>
Load for context:
- src/components/editor/CircuitControls.tsx (current Simulate button stub)
- src/components/sidebar/CopilotSidebar.tsx (current static probability data)
- src/store/simulatorStore.ts (from Plan 3.2)
- src/store/circuitStore.ts (for numQubits)
</context>

<tasks>

<task type="auto">
  <name>Wire Simulate button to simulatorStore + show loading indicator</name>
  <files>src/components/editor/CircuitControls.tsx</files>
  <action>
    Update CircuitControls.tsx:
    - Import `useSimulatorStore` from '@/store/simulatorStore'
    - Read `isSimulating`, `runSimulation`, `error` from the store
    - The "Simulate" button:
      * onClick: calls runSimulation()
      * Show a pulsing animation when isSimulating is true (add `animate-pulse` class conditionally)
      * Text: "Simulate" normally; "Running…" when isSimulating
      * Disabled when isSimulating is true
    - If error is non-null, show a small error badge next to the button (text-red-400, max 40 chars truncated)
    - Keep the existing "Run on Hardware" button unchanged (it remains a styled stub — Phase 4 feature)
    - Keep all existing undo/redo/qubit/column controls unchanged

    AVOID: Making the Simulate button async/await — runSimulation() is sync.
    AVOID: Adding a separate loading spinner outside the button text.
  </action>
  <verify>
    npm run build exits 0
    npm run dev — click Simulate: button text changes to "Running…" briefly then returns to "Simulate"
  </verify>
  <done>
    Simulate button is connected. Clicking it triggers simulation. isSimulating state is reflected in button.
  </done>
</task>

<task type="auto">
  <name>Replace static probabilities with live simulatorStore data</name>
  <files>src/components/sidebar/CopilotSidebar.tsx</files>
  <action>
    Update the "State Probability" section of CopilotSidebar.tsx:
    - Import `useSimulatorStore` from '@/store/simulatorStore'
    - Import `useCircuitStore` from '@/store/circuitStore' (for numQubits)
    - Derive the basis state labels array from numQubits:
      ```ts
      const labels = Array.from({ length: 2 ** numQubits }, (_, i) =>
        `|${i.toString(2).padStart(numQubits, '0')}⟩`
      )
      ```
    - Get `probabilities` from `simulatorStore.result?.probabilities ?? Array(2**numQubits).fill(0)`
    - When numQubits <= 3 (max 8 states): show all states
    - When numQubits > 3: sort states by descending probability, show top 8, 
      add a small "showing top 8 of N states" note

    For each state bar:
    - Label: e.g. `|00⟩` (font-mono)
    - Bar: width = `${prob * 100}%`, color:
      * `bg-violet-500` if prob > 0.01
      * `bg-zinc-700` if prob <= 0.01 (near-zero)
    - Percentage: `(prob * 100).toFixed(1)}%`
    - Apply `opacity-30` to the entire row if prob < 0.001

    Keep the existing glassmorphism/dark styling (space-y-3, text-sm, font-mono, etc.)
    Keep "AI Copilot" section below unchanged (it remains a visual stub).

    AVOID: Re-implementing probability calculation here — read from simulatorStore only.
    AVOID: Showing more than 8 probabilities when numQubits > 3 (performance + legibility).
  </action>
  <verify>
    npm run dev — in browser:
    1. Drop H gate on q[0]: |00⟩ and |10⟩ should show ~50% each
    2. Drop additional CNOT (q[0]→q[1]): |00⟩ and |11⟩ should show ~50% (Bell state)
    3. Change qubits to 1: only |0⟩ and |1⟩ shown; after H, both show 50%
  </verify>
  <done>
    State Probability widget shows live simulation results. Changes immediately when gates are added/removed.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] Bell state (H + CNOT): |00⟩ ≈ 50%, |11⟩ ≈ 50%, others ≈ 0%
- [ ] Single H gate on q[0]: |00⟩ ≈ 50%, |10⟩ ≈ 50%
- [ ] Empty circuit: |00…0⟩ = 100%, all others = 0%
- [ ] numQubits=4 with many gates: shows "top 8" note
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
