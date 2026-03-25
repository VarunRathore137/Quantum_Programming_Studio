---
phase: 3
plan: 2
wave: 2
depends_on: ["01"]
files_modified:
  - src/store/simStore.ts
  - src/hooks/useAutoSim.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Circuit change triggers simulation within 400ms of last mutation (debounced)"
    - "In-flight simulation is cancelled when a new circuit change arrives"
    - "numQubits > 20 sets simStatus to 'cloud' and skips local engine"
    - "simStore.simResult is null when no simulation has run yet"
  artifacts:
    - "src/store/simStore.ts — Zustand store with simResult, simStatus, simError"
    - "src/hooks/useAutoSim.ts — debounced effect watcher on circuitStore"
  key_links:
    - "useAutoSim subscribes to circuitStore (gates, numQubits, numColumns) and calls simulate()"
    - "simStore.simResult populated from SimResult returned by simulate()"
    - "useAutoSim must be mounted in App.tsx or AppShell.tsx to activate auto-sim"
---

# Plan 3.2: Simulation Store + Auto-Sim Trigger

<objective>
Create the Zustand simulation store and auto-simulation hook. Circuit changes automatically
trigger the engine with 400ms debounce and AbortController cancellation.

Purpose: The reactive layer — wires the circuit data model to the simulation engine.
Output: useSimStore() available everywhere; useAutoSim() hook to mount once at app root.
</objective>

<context>
Load for context:
- src/store/circuitStore.ts (subscribe pattern, existing store shape)
- src/lib/sim/index.ts (SimResult type, simulate fn — created in Plan 3.1)
- src/types/circuit.types.ts (CircuitState)
- .planning/DECISIONS.md Phase 3 (debounced auto-sim, 400ms, AbortController)
</context>

<tasks>

<task type="auto">
  <name>Create useSimStore — simulation result state</name>
  <files>src/store/simStore.ts</files>
  <action>
    Create Zustand store with this exact shape:
    ```typescript
    export type SimStatus = 'idle' | 'running' | 'ready' | 'error' | 'cloud'
    interface SimStore {
      simResult: SimResult | null
      simStatus: SimStatus
      simError: string | null
      setSimResult: (result: SimResult) => void
      setSimStatus: (status: SimStatus) => void
      setSimError: (error: string | null) => void
      clearSim: () => void
    }
    ```
    Initial state: simResult=null, simStatus='idle', simError=null.
    AVOID: running simulation logic inside this store — store is state only.
    AVOID: importing circuitStore here — no circular dep; wiring happens in useAutoSim.
  </action>
  <verify>TypeScript compiles: npx tsc --noEmit (zero errors)</verify>
  <done>useSimStore exported, all fields typed, no circular imports.</done>
</task>

<task type="auto">
  <name>Create useAutoSim — debounced circuit watcher with cancellation</name>
  <files>src/hooks/useAutoSim.ts</files>
  <action>
    Custom hook that subscribes to circuitStore and triggers simulation:
    ```typescript
    export function useAutoSim() {
      useEffect(() => {
        const unsub = useCircuitStore.subscribe((state) => {
          // debounce + AbortController cancellation
        })
        return unsub
      }, [])
    }
    ```
    Implementation details:
    - Use a ref to hold the debounce timer ID (clearTimeout on each new mutation).
    - Debounce window: 400ms (constant, not configurable).
    - Cancel pattern: store abort ref, call abortRef.current?.abort() before each new sim run,
      then create new AbortController and store in ref.
    - On sim start: setSimStatus('running').
    - Call simulate(circuitSnapshot) — note: simulate() is synchronous TS math, not async.
      Wrap in try/catch. If error.code === 'QUBIT_LIMIT_EXCEEDED': setSimStatus('cloud'), return.
    - On success: setSimResult(result), setSimStatus('ready').
    - On other error: setSimStatus('error'), setSimError(err.message).
    - Mount this hook ONCE in src/components/layout/AppShell.tsx (add the call there — one line).
    AVOID: using useState for the timer — use useRef to avoid extra re-renders.
    AVOID: calling simulate() during React render — only inside effect callbacks.
  </action>
  <verify>
    1. npx tsc --noEmit (zero errors)
    2. Load app, add H gate to q0 — within 400ms simStore.simStatus becomes 'ready'
    3. Rapid gate additions: only ONE simulation fires after the burst stops
  </verify>
  <done>
    Auto-sim fires 400ms after last circuit mutation.
    simStatus transitions: idle → running → ready on successful sim.
    >20 qubit circuit: simStatus='cloud', no engine call made.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] useSimStore accessible from any component via import
- [ ] simStatus transitions correctly through idle → running → ready
- [ ] useAutoSim mounted in AppShell.tsx
</verification>

<success_criteria>
- [ ] Bell circuit change triggers simulation within 400ms
- [ ] Cloud stub triggers for >20 qubit circuits
- [ ] No React re-render loops on sim store updates
</success_criteria>
