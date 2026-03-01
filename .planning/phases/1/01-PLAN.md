---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.ts
  - index.html
  - tsconfig.json
  - tsconfig.node.json
  - tailwind.config.ts
  - src/main.tsx
  - src/App.tsx
  - src/index.css
  - src/vite-env.d.ts
  - components.json
autonomous: false

must_haves:
  truths:
    - "Vite dev server starts with `npm run dev` without errors"
    - "React 19 + TypeScript project compiles clean (`npm run build`)"
    - "Tailwind v4 styles render correctly (dark background visible in browser)"
    - "shadcn/ui Button component renders in App.tsx as smoke test"
    - "Old CRA files (src/App.css, react-scripts) are removed"
  artifacts:
    - "vite.config.ts exists with React plugin"
    - "tailwind.config.ts exists"
    - "components.json exists (shadcn/ui config)"
    - "src/main.tsx is the new Vite entry point"
    - "package.json contains vite, @vitejs/plugin-react, react@>=19, tailwindcss@>=4"
  key_links:
    - "Vite + React + TypeScript scaffold is the base all other plans build on"

user_setup: []
---

# Plan 1.1: Project Re-Scaffold (Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui)

<objective>
Tear out the existing Create React App scaffold and replace it with the approved stack: Vite 6 + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui. This is the foundation every other Phase 1 plan depends on.

Purpose: CRA is deprecated. The existing scaffold uses React 18, react-dnd (wrong library — DECISIONS.md specifies dnd-kit), and no Tailwind. We need to be on the correct stack before any feature work begins.
Output: A clean, runnable Vite project with dark-mode Tailwind + shadcn/ui installed, old CRA artefacts removed.
</objective>

<context>
Load for context:
- .planning/DECISIONS.md (stack decisions 1 and 5)
- .planning/research/STACK.md
- package.json (current — must understand what to remove)
</context>

<tasks>

<task type="auto">
  <name>Install Vite + React 19 + TypeScript + Tailwind v4 dependencies</name>
  <files>
    package.json
    vite.config.ts
    tsconfig.json
    tsconfig.node.json
    index.html
    src/vite-env.d.ts
  </files>
  <action>
    1. Delete the following CRA-specific devDeps: `react-scripts`.
    2. Remove wrong drag-drop lib: `react-dnd`, `react-dnd-html5-backend`.
    3. Replace scripts: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`, `"test": "vitest"`.
    4. Install (save to package.json):
       - `vite@^6`, `@vitejs/plugin-react@^4` (devDep)
       - `react@^19`, `react-dom@^19`
       - `@types/react@^19`, `@types/react-dom@^19`, `typescript@^5` (devDep)
       - `tailwindcss@^4`, `@tailwindcss/vite@^4` (devDep)
    5. Create `vite.config.ts`:
       ```ts
       import { defineConfig } from 'vite'
       import react from '@vitejs/plugin-react'
       import tailwindcss from '@tailwindcss/vite'
       export default defineConfig({ plugins: [react(), tailwindcss()] })
       ```
    6. Create `tsconfig.json` with `"target": "ESNext"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`, strict mode on, `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }`.
    7. Create `tsconfig.node.json` for Vite config file itself.
    8. Create `index.html` with `<div id="root">` and `<script type="module" src="/src/main.tsx">`.
    9. Create `src/vite-env.d.ts` with `/// <reference types="vite/client" />`.
    AVOID: Do NOT use `@tailwindcss/postcss` — Tailwind v4 uses the Vite plugin directly, not PostCSS. The PostCSS route causes `vite build` to silently ignore styles.
    AVOID: Do NOT keep `react-scripts` in package.json even as devDep — it conflicts with Vite's build.
  </action>
  <verify>Run `npm run dev` — Vite dev server outputs "Local: http://localhost:5173" with no errors.</verify>
  <done>Vite dev server starts on port 5173 with 0 errors in the terminal output.</done>
</task>

<task type="auto">
  <name>Set up Tailwind v4 dark theme + shadcn/ui base</name>
  <files>
    src/index.css
    src/main.tsx
    src/App.tsx
    components.json
    tailwind.config.ts
  </files>
  <action>
    1. Create `src/index.css`:
       ```css
       @import "tailwindcss";

       :root {
         --background: 222.2 84% 4.9%;
         --foreground: 210 40% 98%;
         /* shadcn/ui CSS variable tokens — dark theme */
       }
       * { box-sizing: border-box; }
       body { background: hsl(var(--background)); color: hsl(var(--foreground)); font-family: Inter, system-ui, sans-serif; }
       ```
    2. Create `src/main.tsx`:
       ```tsx
       import { StrictMode } from 'react'
       import { createRoot } from 'react-dom/client'
       import './index.css'
       import App from './App'
       createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
       ```
    3. Initialize shadcn/ui: run `npx shadcn@latest init --defaults` and select dark theme, CSS variables, src/components/ui as output.
    4. Create `components.json` with `{ "style": "new-york", "tailwind": { "config": "tailwind.config.ts", "css": "src/index.css", "baseColor": "zinc", "cssVariables": true }, "rsc": false, "tsx": true, "aliases": { "components": "@/components", "utils": "@/lib/utils" } }`.
    5. Update `src/App.tsx` to render a smoke-test Button:
       ```tsx
       import { Button } from '@/components/ui/button'
       export default function App() {
         return <div className="min-h-screen flex items-center justify-center"><Button>Quantum Studio</Button></div>
       }
       ```
    AVOID: Do NOT import from 'tailwind.config.ts' in CSS — Tailwind v4 uses `@import "tailwindcss"` only; config file is for custom tokens only if needed.
    AVOID: Do NOT add shadcn/ui components manually — let the CLI scaffold them to avoid import path mismatches.
  </action>
  <verify>Open browser at http://localhost:5173 — dark background with a styled "Quantum Studio" button visible. No console errors.</verify>
  <done>Dark background renders, shadcn/ui Button is styled (not default browser button). `npm run build` completes with 0 errors.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify scaffold in browser before proceeding</name>
  <files></files>
  <action>
    Run `npm run dev` and open http://localhost:5173.
    Confirm:
    - Dark background (near-black, not white)
    - "Quantum Studio" button is styled (shadcn/ui new-york style)
    - Browser console shows 0 errors
    - Terminal shows 0 TypeScript errors
    Then run `npm run build` and confirm 0 errors.
  </action>
  <verify>`npm run build` exits 0. Browser shows dark UI with styled button.</verify>
  <done>User confirms visual + build pass. Safe to proceed to Plan 1.2.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run dev` starts on :5173 with 0 errors
- [ ] Browser shows dark background + styled shadcn/ui Button
- [ ] `npm run build` exits 0 (no TypeScript or Tailwind errors)
- [ ] `package.json` has no `react-scripts`, no `react-dnd`
- [ ] `vite.config.ts` exists with React + Tailwind v4 plugins
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Old CRA artifacts are gone
- [ ] Ready for Plan 1.2 (types + store) to be scaffolded on top
</success_criteria>
