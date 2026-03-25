---
phase: 3
plan: 5
wave: 3
depends_on: ["02"]
files_modified:
  - src/components/layout/StatusBar.tsx
  - src/components/simulation/MetricsPanel.tsx
  - src/components/layout/AppShell.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Status bar shows 'Simulator initializing...' on first load, transitions to 'Simulator ready' within 8s"
    - "Status bar shows 'Running...' (with spinner) during active simulation"
    - "Status bar shows '☁ Cloud mode' badge when numQubits > 20"
    - "Metrics panel shows correct gate count and depth for any circuit"
    - "App loads and shows functional editor within 3 seconds (UX-01)"
  artifacts:
    - "src/components/layout/StatusBar.tsx — bottom bar, reads simStatus from useSimStore"
    - "src/components/simulation/MetricsPanel.tsx — gate count, circuit depth, qubit count display"
  key_links:
    - "StatusBar reads simStatus and simError from useSimStore()"
    - "MetricsPanel reads simResult.gateCount and simResult.depth from useSimStore()"
    - "Both components mounted in AppShell.tsx"
---

# Plan 3.5: Status Bar + Circuit Metrics (UX-01, UX-02, SIM-07)

<objective>
Build the status bar (simulator state feedback) and circuit metrics panel (gate count, depth).
Covers UX-01 (3s load) and UX-02 (clear simulator status bar).

Purpose: Closes the feedback loop — users always know what state the simulator is in.
Output: StatusBar at bottom of AppShell; MetricsPanel as a compact stats strip below circuit.
</objective>

<context>
Load for context:
- src/store/simStore.ts (SimStatus type, simResult.gateCount, simResult.depth)
- src/store/circuitStore.ts (numQubits — for showing qubit count in metrics)
- src/components/layout/AppShell.tsx (where to mount both components)
- src/index.css (design tokens — match existing IDE aesthetic)
</context>

<tasks>

<task type="auto">
  <name>Build StatusBar — simulator state indicator</name>
  <files>src/components/layout/StatusBar.tsx</files>
  <action>
    StatusBar reads simStatus from useSimStore(s => s.simStatus) and renders:
    - 'idle':    "● Simulator ready"  (green dot)
    - 'running': "◌ Simulating..."   (pulsing animation dot, spinner icon)
    - 'ready':   "● Simulator ready"  (green dot) + last sim time in ms (store the timestamp)
    - 'error':   "✕ Simulation error: {simError}" (red)
    - 'cloud':   "☁ Cloud simulator — circuit exceeds 20 qubits" (blue badge style)

    On initial mount (before first sim): show "Simulator initializing..." for 400ms, then
    transition to correct status. Implement via a `useEffect` with a 400ms setTimeout that
    sets a local `initialized` state to true before reading simStatus.

    Styling: fixed bottom bar, full width, height 28px, dark background slightly lighter than
    AppShell bg, monospace font (JetBrains Mono or system-ui monospace), left-padded 16px.
    Status dot/icon on left, text center-left, version string on far right.

    AVOID: polling or setInterval — purely reactive to simStatus changes.
  </action>
  <verify>
    1. npx tsc --noEmit — zero errors
    2. On page load: shows "Simulator initializing..." then "Simulator ready"
    3. Add H gate: shows "Simulating..." briefly, then "Simulator ready"
    4. Set qubits to 21: shows cloud badge immediately
  </verify>
  <done>Status bar transitions correctly through all 5 states. Cloud badge appears for >20q circuits.</done>
</task>

<task type="auto">
  <name>Build MetricsPanel and mount both components in AppShell</name>
  <files>
    src/components/simulation/MetricsPanel.tsx
    src/components/layout/AppShell.tsx
  </files>
  <action>
    MetricsPanel.tsx — compact metrics strip (SIM-07):
    - Read from useSimStore(s => s.simResult) for gateCount and depth.
    - Read from useCircuitStore(s => s.numQubits) for qubit count.
    - Display 3 stat pills in a horizontal row:
      - "⎋ {gateCount} gates" (shows 0 if simResult null)
      - "↕ depth {depth}" (shows — if simResult null)
      - "⊗ {numQubits} qubits"
    - Style: pill shape, glassmorphism bg, subtle border, 12px font.
    - Position: thin strip directly below CircuitControls, above CircuitGrid.

    AppShell.tsx modifications:
    - Mount <StatusBar /> at the very bottom of the AppShell layout.
    - Mount <MetricsPanel /> in the appropriate slot (above circuit grid area).
    - Both imports added, no other AppShell logic changed.
    AVOID: adding any simulation logic to AppShell — it is layout only.
  </action>
  <verify>
    1. StatusBar visible at the bottom of the app at all times
    2. MetricsPanel shows correct gate count after Bell state circuit built
    3. npx tsc --noEmit — zero errors
  </verify>
  <done>
    StatusBar mounted at app bottom for all routes.
    MetricsPanel shows live gate count, depth, qubit count.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Status bar visible and transitions correctly
- [ ] MetricsPanel shows correct gate count and depth
- [ ] UX-01: App loads functional editor within 3s (no blocking on sim init)
</verification>

<success_criteria>
- [ ] Status bar covers all 5 SimStatus states correctly
- [ ] Circuit metrics update after each simulation
- [ ] Cloud badge appears immediately when numQubits > 20
</success_criteria>
