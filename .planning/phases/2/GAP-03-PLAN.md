---
phase: 2
plan: gap-03
wave: 0
depends_on: []
gap_closure: true
files_modified:
  - .planning/DECISIONS.md
autonomous: true
user_setup: []

gap_source: "DECISIONS.md — Phase 2 Open Questions (marked 'TBD after discussion')"

must_haves:
  truths:
    - "All 5 Phase 2 open questions are answered and recorded in DECISIONS.md"
    - "No open questions remain for the phase"
  artifacts:
    - ".planning/DECISIONS.md Phase 2 section is complete"
---

# Gap 03: Record Phase 2 Architecture Decisions

<objective>
The DECISIONS.md Phase 2 section has 5 open questions that were never answered. The plans
implicitly made choices (dnd-kit, CSS grid + SVG overlay, drop-then-pick UX, granular undo),
but these decisions were never formally recorded. This gap records the implicit choices as
explicit decisions so future phases can reference them.

Problem identified in: DECISIONS.md — "Phase 2 Decisions — Open Questions — Decisions TBD after discussion"
Root cause: /discuss-phase concluded but DECISIONS.md was not updated with the resolved choices.
</objective>

<tasks>

<task type="auto">
  <name>Record all 5 Phase 2 decisions in DECISIONS.md</name>
  <files>.planning/DECISIONS.md</files>
  <action>
    Replace the "Phase 2 Decisions" section with the resolved decisions based on what the plans chose:

    ```markdown
    ## Phase 2 Decisions

    **Date:** 2026-03-09

    ---

    ### 1. Drag-and-Drop Library — @dnd-kit/core

    **Chose:** `@dnd-kit/core` + `@dnd-kit/utilities`

    - **Reason:** Accessibility-first (ARIA), touch support, no required DOM structure, tree-shakeable.
      React-DnD is unmaintained. Native HTML5 DnD has no mobile support and poor touch UX.
    - **Packages:** `@dnd-kit/core`, `@dnd-kit/utilities` ONLY. `@dnd-kit/sortable` and
      `@dnd-kit/modifiers` explicitly excluded — not needed for grid drop zones.

    ---

    ### 2. Multi-Qubit Gate UX — Drop Control + Click Target Picker

    **Chose:** Drop onto control qubit → popover appears → user clicks target qubit button.

    - **Reason:** Drag-with-range-indicator requires complex hit-testing across multiple qubit rows.
      The popover approach is deterministic, requires no custom pointer-tracking, and is Phase 2-safe.
    - **Stretch (Phase 3+):** Drag across rows with visual span indicator may be added later.

    ---

    ### 3. Canvas Rendering — CSS Grid + SVG Overlay

    **Chose:** CSS grid (HTML divs) for cells + absolutely-positioned SVG layer for connection lines.

    - **Reason:** CSS grid is the simplest, most debuggable approach. SVG overlay handles CNOT
      connector lines without a full Canvas API. HTML5 Canvas deferred until virtualization is needed
      (>100 qubits/columns).

    ---

    ### 4. Undo/Redo Scope — Individual Gate Placements (Granular)

    **Chose:** Every gate placement, deletion, qubit count change, or column count change pushes
    a separate history entry.

    - **Reason:** Granular undo matches user mental model ("undo the last thing I did").
      Batched undo requires transaction semantics that are out of scope for Phase 2.
    - **Max history depth:** 50 entries (configurable via MAX_HISTORY constant).

    ---

    ### 5. Gate Palette Organization — Fixed Left Panel, No Drag

    **Chose:** Fixed-width left panel (w-52), not a floating or draggable toolbar.

    - **Reason:** Matches IDE layout conventions (VS Code sidebar model). Draggable palette adds
      significant UX complexity for little gain. Panel width is hardcoded — user resize deferred.
    - **Toggle:** Beginner (≤10 gates, flat grid) ↔ Advanced (all gates in 4 categories).
    ```

    Replace the entire "Phase 2 Decisions" section with the above.
    Keep all Phase 1 decisions unchanged.

    AVOID: leaving any "Open Questions" or "TBD" markers in the file.
  </action>
  <verify>
    1. Open DECISIONS.md — no "TBD" or "Open Questions" text remains in the Phase 2 section.
    2. `git diff .planning/DECISIONS.md` shows 5 questions replaced with 5 answers.
  </verify>
  <done>
    All 5 Phase 2 decisions documented. DECISIONS.md has no remaining open questions for Phase 2.
  </done>
</task>

</tasks>

<verification>
After task, verify:
- [ ] DECISIONS.md Phase 2 section has exactly 5 numbered decisions (no unanswered questions)
- [ ] No "TBD" text in DECISIONS.md
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
