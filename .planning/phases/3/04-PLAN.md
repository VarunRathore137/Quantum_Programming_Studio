---
phase: 3
plan: 4
wave: 3
depends_on: ["02"]
files_modified:
  - src/components/simulation/BlochSphere.tsx
  - src/components/simulation/BlochSpherePanel.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Single qubit |+⟩ state shows Bloch sphere vector pointing to +X axis"
    - "Single qubit |0⟩ shows vector pointing to +Z axis"
    - "Entangled qubit (e.g., Bell state) shows sphere at ~35% opacity with badge '⟨ψ⟩ entangled'"
    - "Bloch sphere updates each time simResult changes"
    - "Each qubit in the circuit has its own Bloch sphere"
  artifacts:
    - "src/components/simulation/BlochSphere.tsx — 3D CSS sphere for a single qubit"
    - "src/components/simulation/BlochSpherePanel.tsx — grid of spheres for all qubits"
  key_links:
    - "BlochSpherePanel reads simResult.blochVectors from useSimStore()"
    - "BlochSpherePanel mounted as a tab in SimResultsPanel (Plan 3.3) — add 'Bloch Spheres' tab"
---

# Plan 3.4: Bloch Sphere Visualization

<objective>
Render a per-qubit Bloch sphere that updates live with simulation results. Entangled qubits
show a faded sphere + badge. Uses CSS 3D transforms (no Three.js — avoids heavy bundle).

Purpose: The signature visual of the tool — users see quantum state physically.
Output: BlochSpherePanel mounted as a third tab in SimResultsPanel.
</objective>

<context>
Load for context:
- src/store/simStore.ts (SimResult.blochVectors type — {x,y,z}|null per qubit)
- src/components/simulation/SimResultsPanel.tsx (tab panel to add 'Bloch Spheres' tab)
- .planning/DECISIONS.md Phase 3 → Decision 3 (entangled fade: 35% opacity + badge)
</context>

<tasks>

<task type="auto">
  <name>Build BlochSphere — CSS 3D single-qubit sphere with Bloch vector arrow</name>
  <files>src/components/simulation/BlochSphere.tsx</files>
  <action>
    Props: `{ blochVector: {x:number; y:number; z:number} | null; qubitIndex: number; label?: string }`

    Render strategy — CSS 3D transforms (not Three.js/WebGL):
    - Outer div: `position:relative; width:120px; height:120px; perspective:300px`.
    - Sphere: a div with `border-radius:50%`, semi-transparent blue-purple gradient, border.
    - Orientation arrow: an absolutely-positioned thin bar (4px × 60px) centered in sphere.
      Rotate using CSS `transform: rotateX(${polar}deg) rotateZ(${azimuth}deg)`.
      Compute polar and azimuth from blochVector (x,y,z):
        - polar   = acos(z) in degrees (z ∈ [-1,1] → 0°–180°)
        - azimuth = atan2(y, x) in degrees
    - Arrow tip: a small glowing circle (6px) at top of bar.
    - Reference axes: three thin lines (X/Y/Z) rendered as divs at fixed rotation.
    - Axis labels: "+Z", "-Z", "+X" as tiny text spans.
    - Qubit label at bottom: "q{qubitIndex}".

    Entangled state (blochVector === null):
    - Wrap entire sphere in a div with `opacity: 0.35`.
    - Overlay badge: `position:absolute; bottom:0; left:50%; transform:translateX(-50%)`
      with text "⟨ψ⟩ entangled", styling: small pill with purple border.
    
    AVOID: Three.js, WebGL, canvas — pure CSS 3D only for bundle size.
    AVOID: `transform-style: preserve-3d` on the overall layout container — scope it locally.
  </action>
  <verify>
    1. npx tsc --noEmit — zero errors
    2. Manually test: blochVector={x:1,y:0,z:0} → arrow points to equator, +X direction
    3. blochVector=null → sphere is faded with entangled badge
  </verify>
  <done>BlochSphere renders with correct arrow orientation for |+⟩, |0⟩, |1⟩ states. Entangled state shows fade + badge.</done>
</task>

<task type="auto">
  <name>Build BlochSpherePanel and wire into SimResultsPanel tabs</name>
  <files>
    src/components/simulation/BlochSpherePanel.tsx
    src/components/simulation/SimResultsPanel.tsx
  </files>
  <action>
    BlochSpherePanel.tsx:
    - Read simResult from useSimStore(s => s.simResult).
    - If simResult is null: show placeholder "Run circuit to see Bloch spheres".
    - Iterate over simResult.blochVectors (length = numQubits from circuitStore).
    - Render a responsive flex-wrap grid of <BlochSphere> components, one per qubit.
    - Max visible without scroll: 8 spheres. For >8 qubits, show scrollable row.
    - Add qubit count label above: "Showing {n} qubits".

    SimResultsPanel.tsx modification:
    - Add a third tab: "Bloch Spheres".
    - Import and mount <BlochSpherePanel /> inside this tab.
    - No other changes to SimResultsPanel.
  </action>
  <verify>
    1. Bell state (2 qubits): two Bloch spheres rendered, both showing faded+entangled badge
    2. Single qubit H circuit: one sphere with arrow at +X equator
    3. npx tsc --noEmit — zero errors
  </verify>
  <done>Panel shows correct sphere per qubit. Bell state entanglement displayed via fade+badge.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] |+⟩ state Bloch vector points to +X axis (equatorial)
- [ ] Bell state qubits show fade + entangled badge
- [ ] Bloch Spheres tab appears in SimResultsPanel
</verification>

<success_criteria>
- [ ] All 3 standard states (|0⟩, |1⟩, |+⟩) show correct vector orientation
- [ ] Entangled qubits visually distinct via opacity + badge
- [ ] No Three.js or heavy library imports
</success_criteria>
