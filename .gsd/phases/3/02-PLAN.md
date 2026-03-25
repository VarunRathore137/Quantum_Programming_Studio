---
phase: 3
plan: 2
wave: 2
depends_on: [3.1]
files_modified:
  - src/store/simulatorStore.ts
  - src/components/sidebar/BlochSphere.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "A simulatorStore holds SimulatorResult and exposes runSimulation() action"
    - "runSimulation() calls simulateCircuit() and stores the result in Zustand"
    - "BlochSphere component reads real theta/phi from simulatorStore (not gate count)"
    - "BlochSphere visually updates within 300ms of a gate being dropped"
  artifacts:
    - "src/store/simulatorStore.ts exists and exports useSimulatorStore"
    - "BlochSphere.tsx reads from useSimulatorStore, not useState"
  key_links:
    - "simulatorStore subscribes to circuitStore gate changes via zustand subscribeWithSelector"
    - "BlochSphere.tsx shows angles for qubit 0 by default"
---

# Plan 3.2: Simulation Zustand Store + Live Bloch Sphere Physics

<objective>
Create a simulatorStore that auto-runs the simulation engine whenever the circuit changes,
and wire the Bloch sphere component to display real quantum state geometry.

Purpose: Replaces the mock "rotate based on gate count" Bloch sphere with true physics.
Output: simulatorStore.ts (new) + updated BlochSphere.tsx
</objective>

<context>
Load for context:
- src/store/circuitStore.ts (to understand how to subscribe to gate changes)
- src/store/historyStore.ts (for Zustand pattern reference)
- src/components/sidebar/BlochSphere.tsx (to understand current mock impl)
- src/lib/simulator/stateVector.ts (from Plan 3.1 — provides SimulatorResult type)
</context>

<tasks>

<task type="auto">
  <name>Create simulatorStore with auto-simulate subscription</name>
  <files>src/store/simulatorStore.ts</files>
  <action>
    Create `src/store/simulatorStore.ts`:
    - Import `create` from 'zustand'
    - Import `simulateCircuit`, `SimulatorResult` from '@/lib/simulator/stateVector'
    - Import `useCircuitStore` from '@/store/circuitStore'

    Store shape:
    ```ts
    interface SimulatorStore {
      result: SimulatorResult | null
      isSimulating: boolean
      error: string | null
      runSimulation: () => void
    }
    ```

    Implementation details:
    - `runSimulation()`: set isSimulating=true, then call `simulateCircuit(useCircuitStore.getState())`,
      set result, set isSimulating=false. Wrap in try/catch → set error on failure.
    - After defining the store, set up a Zustand subscription at module level:
      ```ts
      useCircuitStore.subscribe(
        (state) => state.gates,
        () => { useSimulatorStore.getState().runSimulation() },
        { equalityFn: (a, b) => a === b } // reference equality — runs on every mutation
      )
      ```
    - This means every gate add/remove/update triggers an auto-simulation immediately.
    - Export `useSimulatorStore`.

    AVOID: Calling `simulateCircuit` synchronously inside the Zustand store `create` callback
    (it must be an action, called lazily).
    AVOID: Using `subscribeWithSelector` import — use plain `useCircuitStore.subscribe()` 
    with a selector function (second argument pattern: subscribe(selector, listener)).
    NOTE: Zustand 5.x subscribe syntax: `store.subscribe(selector, listener)` requires 
    the `subscribeWithSelector` middleware. Instead, use `useCircuitStore.subscribe(listener)` 
    with full state and check `state.gates !== prev.gates` inside.
  </action>
  <verify>
    npx vitest run (all existing tests pass)
    npm run build (exits 0)
  </verify>
  <done>
    useSimulatorStore exists and exports runSimulation().
    Build passes with no TypeScript errors.
  </done>
</task>

<task type="auto">
  <name>Wire BlochSphere to real simulatorStore angles</name>
  <files>src/components/sidebar/BlochSphere.tsx</files>
  <action>
    Rewrite BlochSphere.tsx to read from simulatorStore instead of computing mock from gate count:

    ```tsx
    import { useSimulatorStore } from '@/store/simulatorStore'

    export function BlochSphere({ qubitIndex = 0 }: { qubitIndex?: number }) {
      const result = useSimulatorStore(s => s.result)
      const angles = result?.blochAngles[qubitIndex] ?? { theta: 0, phi: 0 }
      // Use angles.theta and angles.phi for the SVG projection
      ...
    }
    ```

    Keep all existing SVG rendering (equator ellipse, axes, labels, vector line+dot).
    Replace the useState(theta/phi) + useEffect with direct read from simulatorStore.
    Keep the `transition-all duration-500 ease-out` CSS animation on the vector line 
    so changes animate smoothly.

    The SVG projection math (r, x, y, z, projX, projY) stays the same — only 
    theta/phi source changes.

    AVOID: Calling runSimulation() directly from BlochSphere — the subscription handles it.
    AVOID: Adding a loading spinner inside BlochSphere — keep it lightweight.
  </action>
  <verify>
    npm run dev — open browser, drop H gate on q[0]:
    - Bloch sphere vector should move from |0⟩ top-pole to |+⟩ equator (theta≈π/2, phi≈0)
    Drop X gate after H:
    - Vector should now point toward |1⟩ bottom-pole (theta≈π)
  </verify>
  <done>
    BlochSphere reads from simulatorStore. No useState/useEffect for simulation state.
    Vector animates smoothly (500ms) on gate changes.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` exits 0
- [ ] Browser: Drop H on q[0] → Bloch sphere vector moves to equator
- [ ] Browser: Drop X → vector moves to |1⟩ pole
- [ ] Browser: Clear all gates → vector returns to |0⟩ pole (top)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] No regression in existing vitest tests
</success_criteria>
