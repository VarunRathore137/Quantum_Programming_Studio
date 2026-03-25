---
phase: 3
plan: 3
wave: 2
depends_on: ["01"]
files_modified:
  - src/components/simulation/ProbabilityHistogram.tsx
  - src/components/simulation/StatevectorPanel.tsx
  - src/components/simulation/SimResultsPanel.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Bell state shows two bars: '00' at 50%, '11' at 50%"
    - "Histogram bars animate smoothly when probabilities change"
    - "Top-32 states shown; virtual scroll for all 2^n states"
    - "Statevector panel shows amplitude + phase for each basis state"
    - "Panel renders nothing (or a placeholder) when simResult is null"
  artifacts:
    - "src/components/simulation/ProbabilityHistogram.tsx"
    - "src/components/simulation/StatevectorPanel.tsx"
    - "src/components/simulation/SimResultsPanel.tsx — container that mounts both panels"
  key_links:
    - "All components read from useSimStore() — no props drilling"
    - "SimResultsPanel mounted inside CircuitEditor.tsx or AppShell.tsx right-side panel"
---

# Plan 3.3: Probability Histogram + Statevector Display

<objective>
Build the simulation results visualization panels: probability histogram (top-32 + virtual scroll)
and statevector amplitude table.

Purpose: Users see measurement outcomes and quantum amplitudes immediately after auto-sim runs.
Output: SimResultsPanel with two sub-components mounted in the editor layout.
</objective>

<context>
Load for context:
- src/store/simStore.ts (SimResult, SimStatus — created in Plan 3.2)
- src/lib/sim/index.ts (SimResult type — amplitude structure)
- src/components/editor/CircuitEditor.tsx (where to mount SimResultsPanel)
- src/index.css (design tokens for colors, glassmorphism style)
</context>

<tasks>

<task type="auto">
  <name>Build ProbabilityHistogram and StatevectorPanel</name>
  <files>
    src/components/simulation/ProbabilityHistogram.tsx
    src/components/simulation/StatevectorPanel.tsx
  </files>
  <action>
    ProbabilityHistogram.tsx:
    - Read simResult from useSimStore(s => s.simResult).
    - Sort probabilities descending, take top 32.
    - Render each bar as a div with percentage-width transition (CSS `transition: width 300ms ease`).
    - Bar labels: basis string on left (e.g. '00'), percentage on right (e.g. '50.0%').
    - Bar color: use CSS var tied to circuit's primary accent (glowing purple-blue gradient).
    - When probabilities > 32 states: render a "Show all (2^n states)" button that opens a
      virtualized list using a simple windowed approach (render only visible rows, 40px each).
    - Null/idle state: show a dashed placeholder with text "Run circuit to see probabilities".

    StatevectorPanel.tsx:
    - Read simResult.statevector from useSimStore.
    - Show as a scrollable table: columns = [basis, amplitude (a+bi), magnitude |a|, phase ∠].
    - Truncate to top-32 by magnitude. Format numbers to 4 decimal places.
    - Phase display: atan2(im, re) in radians, shown as fraction of π (e.g. "π/2").
    - Null state: show placeholder matching histogram style.

    AVOID: importing Three.js — that's for Bloch sphere (Plan 3.4).
    AVOID: any DOM manipulation or refs for bar widths — use inline style percentage.
  </action>
  <verify>
    1. npx tsc --noEmit — zero type errors
    2. With Bell circuit running: histogram shows exactly 2 bars at 50% each
  </verify>
  <done>Histogram bars animate on sim result change. StatevectorPanel shows correct amplitudes.</done>
</task>

<task type="auto">
  <name>Assemble SimResultsPanel and mount in editor layout</name>
  <files>
    src/components/simulation/SimResultsPanel.tsx
    src/components/editor/CircuitEditor.tsx
  </files>
  <action>
    SimResultsPanel.tsx:
    - Tab-based container with two tabs: "Probabilities" and "Statevector".
    - Reads simStatus from useSimStore to show loading spinner when status='running'.
    - When simStatus='cloud': show "☁ Running on cloud simulator" badge (no results panel).
    - When simStatus='error': show error message from simStore.simError.
    - Wrap in a glassmorphism card (semi-transparent dark bg, 1px border, subtle blur).

    CircuitEditor.tsx:
    - Add a right-side column (or bottom panel) for <SimResultsPanel />.
    - Use CSS grid or flex layout: left=circuit grid, right=results panel (min-width: 280px).
    - AVOID: changing CircuitGrid.tsx layout — slot SimResultsPanel alongside it.
  </action>
  <verify>
    1. App renders with SimResultsPanel visible alongside circuit grid
    2. Switching tabs works; loading spinner appears during simulation
    3. npx tsc --noEmit — zero errors
  </verify>
  <done>Panel visible in editor layout, tabs switch correctly, displays cloud badge for >20q circuits.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Bell state simulation shows 50/50 histogram
- [ ] Tab switching between Probabilities and Statevector works
- [ ] Cloud badge displayed for >20 qubit circuits
</verification>

<success_criteria>
- [ ] Histogram top-32 renders correctly for diverse circuits
- [ ] Statevector amplitudes shown with correct complex format
- [ ] Panel integrates cleanly with existing editor layout
</success_criteria>
