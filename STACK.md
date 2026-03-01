# Quantum Programming Studio — Tech Stack

## Runtime

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| UI Framework | React | `^18.2.0` | Functional components only, no class components |
| Language | TypeScript | `^4.9.5` | Strict mode, all null checks enabled |
| Drag-and-Drop | react-dnd | `^16.0.1` | HTML5 backend; `useDrag` / `useDrop` hooks |
| DnD Backend | react-dnd-html5-backend | `^16.0.1` | Native HTML5 drag events |
| Styling | Vanilla CSS | — | No CSS framework or preprocessor |
| Build Tool | react-scripts (CRA) | `5.0.1` | Create React App under the hood (Webpack + Babel) |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/react` | `^18.0.0` | TypeScript types for React |
| `@types/react-dom` | `^18.3.7` | TypeScript types for React DOM |

## TypeScript Configuration

| Setting | Value | Impact |
|---------|-------|--------|
| `target` | `es2020` | Modern JS output |
| `strict` | `true` | All strict checks on |
| `noImplicitAny` | `true` | No implicit `any` |
| `strictNullChecks` | `true` | Explicit null handling |
| `noUnusedLocals` | `true` | Compiler catches dead variables |
| `noUnusedParameters` | `true` | Compiler catches unused params |
| `noImplicitReturns` | `true` | All code paths must return |
| `declarationMap` | `true` | Source maps for declarations |

## Scripts

```bash
npm start        # Development server (CRA dev server, hot reload)
npm run build    # Production build (minified, tree-shaken)
npm test         # Jest + React Testing Library (no tests exist yet)
npm run eject    # Eject from CRA (irreversible)
```

## Browser Targets

**Production:** `>0.2%` market share, not dead, no Opera Mini  
**Development:** Latest Chrome, Firefox, Safari

## Notable Absences

- ❌ No state management library (Redux, Zustand, Jotai)
- ❌ No CSS preprocessor (Sass, Less) or utility framework (Tailwind)
- ❌ No routing library (React Router) — single-page, single-view app
- ❌ No test files (`npm test` would run no tests)
- ❌ No lint/format config (ESLint only via CRA defaults, no Prettier)
- ❌ No CI/CD configuration
- ❌ No quantum runtime or backend integration (export-only: Qiskit Python, JSON)
