# Exercise 3 — React setup, shell and Dashboard (Demos 6, 9, 10)

Run it: `npm run dev -- --port 8080`, then open `http://localhost:8080/react.html`
(the vanilla app stays at `http://localhost:8080/`).

## Change log (what changed and why)

| Change | Why |
| --- | --- |
| `npm i react react-dom` and `npm i -D @vitejs/plugin-react @types/react @types/react-dom` | Runtime, JSX transform plus Fast Refresh, and type definitions (see Demo 6 Q1) |
| `vite.config.js`: `plugins: [react()]`, `build.rollupOptions.input` lists `index.html` and `react.html` | Compile JSX, and make `vite build` include the second page |
| `tsconfig.json`: `"jsx": "react-jsx"`, `include` adds `react/**/*.ts(x)` | Type-check `.tsx` with the automatic runtime |
| `react.html` + `react/main.tsx` | Second entry point mounting `<App />` into `#root` |
| `react/App.tsx`, `components/{Header,NavBar,Footer}.tsx`, `routing/useHashRoute.ts`, `pages/StubPage.tsx` | The application shell (Demo 9) |
| `react/data/CaseDataContext.tsx`, `react/data/bookmarks.ts` | Data access for React (Demo 10) |
| `react/dashboard/*.tsx`, `react/pages/DashboardPage.tsx` | Dashboard as components (Demo 10) |
| `react/sandbox/CaseBadge.tsx` | The tiny JSX component for Demo 5 |

The vanilla app under `js/` and `index.html` is **untouched**. The same `styles.css` is reused, so
class names are kept (`.nav-btn`, `.stat-card`, …) and both versions look identical.

---

## Demo 6

### Task 3 / Q3 — How the two versions coexist

**Decision: side by side, as two HTML entry points** (`index.html` = vanilla, `react.html` = React).
Selecting the version is just choosing the URL.

Why this and not the alternatives:

| Option | Verdict |
| --- | --- |
| **Separate entry point (chosen)** | Zero risk to the working app and the presentation deck (which iframes `index.html`). Easy A/B comparison of the two dashboards in two tabs. Deleting the experiment is `rm`. |
| Feature flag / `?react=1` in `index.html` | One document has to host both worlds, so the vanilla code that does `document.getElementById(...)` and `innerHTML` on elements React would also manage would fight React over the same DOM nodes. |
| Full swap-over now | Breaks four views that do not exist in React yet; the app would regress until Exercises 4 and 5 finish. |
| Mount React *inside* vanilla (islands) | Plausible for gradual migration but needs a bridge between `state` mutation and React rendering, which is complexity this exercise does not need. |

**What would go wrong with the opposite choice (a full swap-over):** four of five views would
disappear (Evidence, People, Timeline, Workspace) so the portal would be unusable until they are
rebuilt, and there would be no working reference to compare the React Dashboard against. With a
single-document mix, the two renderers would overwrite each other's DOM.

Trade-off accepted: the React shell **cannot yet show the other four views**, so they are stubs with a
link to the vanilla app; the user must switch URLs for them. In Exercise 5, `react.html` becomes
`index.html`.

### Q1 — What had to be installed/configured, and what is each piece for?

| Piece | Responsibility |
| --- | --- |
| `react` | The core: elements, components, hooks, the reconciler *interface* (and `react/jsx-runtime`, which compiled JSX calls) |
| `react-dom` | The **renderer** for browsers: `createRoot().render()` turns React elements into real DOM and does the diffing/patching. (React itself is renderer-agnostic; React Native uses a different renderer.) |
| `@vitejs/plugin-react` | Vite plugin: enables the **JSX transform** (compiling `<X />` to `jsx()` calls) for `.jsx/.tsx`, and **Fast Refresh** (edit a component, see it update in the browser while keeping state) in dev. |
| `@types/react`, `@types/react-dom` | Type declarations so `tsc` can check props, hooks and JSX. Neither package ships its own types. |
| `typescript` (already present) | Type-checking only; Vite/esbuild strips types. |
| `tsconfig` → `"jsx": "react-jsx"` | Tells **tsc** how to type-check JSX and to use the automatic runtime (no `import React` needed). It does not compile anything (we run `noEmit`). |
| `tsconfig` → `include` | Without adding `react/**/*.tsx`, `npm run typecheck` would silently skip the new files. |
| `vite.config.js` → `build.rollupOptions.input` | Dev server serves any root `.html`, but the production bundle only includes listed inputs, so `react.html` has to be listed. |

### Q2 — From `.tsx` to the DOM

1. The browser loads `react.html`. It contains `<div id="root"></div>` and `<script type="module"
   src="react/main.tsx">`.
2. The request for `/react/main.tsx` hits **Vite's dev server**, which transforms it **on demand**:
   esbuild strips the TypeScript types and compiles JSX to `jsx()` calls (via the React plugin),
   and rewrites bare imports (`react`, `react-dom/client`) to pre-bundled `/node_modules/.vite/deps/…`
   URLs. The browser receives plain JavaScript with a JS MIME type. (In `vite build` Rollup bundles
   the same graph into `dist/assets/react-*.js`.)
3. `main.tsx` finds `#root` and calls `createRoot(root).render(<StrictMode><App /></StrictMode>)`.
4. React calls `App()`, which returns elements (`<CaseDataProvider>`, `<Header>`, …), then calls
   those components recursively, until only host elements (`div`, `button`, …) remain. That is the
   **render phase**, producing a tree of plain objects.
5. In the **commit phase** `react-dom` creates the real DOM nodes (`document.createElement`) and
   inserts them under `#root`. The browser paints.
6. Later updates (hash change, data arrival) re-run the affected components, diff, and patch.

### Task 1 & 2

Done as listed in the change log. The visible entry point is `<App />`, rendering the full shell and
Dashboard.

---

## Demo 9 — Application shell

### Task 1 & 2

- Header/branding: `components/Header.tsx`. Navigation: `components/NavBar.tsx`. Footer:
  `components/Footer.tsx`. Routing skeleton: `routing/useHashRoute.ts` + the `PAGES` table in
  `App.tsx` (one entry per view, typed as `Record<ViewName, …>` so a missing page is a compile error).
- Five routes mirror the vanilla app. `dashboard` is real; the other four render `StubPage`.
- Verified live in the browser: clicking each nav button changes the rendered page and the `active`
  nav styling, and Back/Forward work.

### Q1 — How is "the current view" tracked? Compare to `currentPage` / `handleHashChange()`

**Same, conceptually:** the **URL hash is the source of truth** (so deep links, reload and Back all
work), a `hashchange` listener reacts to it, unknown values fall back to `dashboard`, and the five
view names are the same.

**Different, fundamentally:**

| | Vanilla | React shell |
| --- | --- | --- |
| Where the current view is held | **copied** into the mutable `state.currentPage` *and* encoded in which `.view` has class `active` *and* which `.nav-btn` has `active`: three places to keep in sync | **derived** from the hash on every render by `useHashRoute()`; no copy exists |
| What reacts to a change | `handleHashChange()` **imperatively** does DOM work: loops over sections and buttons removing/adding classes | The hook subscribes with `useSyncExternalStore`; the change makes `App` re-render, and the output **declares** the right nav button and page |
| Page lifecycle | All five sections always exist in the DOM, hidden by CSS; first-visit render flag (`viewRendered`) | Only the current page is mounted; leaving a page unmounts it, so entering it again starts fresh (no render flags) |
| Event wiring | Inline `onclick="navigateTo(...)"` globals attached to `window` | `onClick={() => navigateTo(view.id)}` closures, no globals |

Superficially different, same idea: `navigateTo()` still just sets `location.hash`; `useHashRoute`'s
`parseView` is the old `isViewName` fallback; `useSyncExternalStore(subscribe, …)` is
`addEventListener("hashchange", …)` in a React-safe wrapper.

### Q2 — A view that does not exist

`#nonsense` → `parseView` returns `"dashboard"`, so the shell shows the Dashboard (and highlights the
Dashboard nav button), **identical to the vanilla fallback**. Verified in the browser.

Caveat, honestly: the URL still says `#nonsense`. That is the same in vanilla, and it is not a real 404.
The honest alternative is a `<NotFoundPage />` branch or redirecting the hash to `#dashboard`. I kept the
vanilla behaviour deliberately so the migration stays behaviour-preserving, and because for this app a
silent fallback is more forgiving than an error page. A router library (Exercise 4/5) would make
this an explicit `*` route.

---

## Demo 10 — Dashboard

### Task 1 & 2

Components (from the hierarchy in `03-component-hierarchy.md`):

```text
DashboardPage            reads useCaseData(); loading / error / ready
├─ HowToUseCard          static content, buttons call navigateTo()
└─ DashboardContent      derives reviewedCount, progressPercent, recent lists
   ├─ CaseSummaryCard    caseInfo
   ├─ StatGrid           5 counts → StatCard ×5
   ├─ ReviewProgress     progressPercent
   └─ dashboard-columns
      ├─ RecentEvidenceList   items → mini rows with status badge
      └─ RecentTimelineList   events → mini rows with formatted date
```

Verification (Playwright against the dev server):

- The visible text of `<main>` in `react.html` is **character-for-character identical** to the text
  of `#view-dashboard` in the vanilla `index.html` with the real data (18 evidence, 6 people, 6
  locations, 1 bookmarked, 1 reviewed, 6 %, same five recent evidence items and timeline events).
- Navigating Dashboard → Workspace → Dashboard keeps the data and re-reads the bookmark count
  (changing bookmarks in `localStorage` while on another page shows up on return: 1 → 3).
- `npm run typecheck`, `npm run lint` and `npm run build` pass.

### Q1 — Where does the data come from, and is this final?

`CaseDataProvider` (`react/data/CaseDataContext.tsx`) fetches the same five `data/*.json` files
(`Promise.all`) once on mount into a `loading | error | ready` state, and exposes it via React
**context**; `DashboardPage` reads it with `useCaseData()` and passes slices down as **props**. Bookmarks
are read from the same `localStorage` key the vanilla app writes (`remotion_bookmarks`).

**It is a placeholder, and I know I will change it.** Reasons: (1) it is read-only, since no view
mutates data yet, while Evidence/Workspace will need bookmarks, notes, hypothesis and filters (writes
that should update the Dashboard live); (2) there is no caching, refetching or request
de-duplication; (3) it does not reuse `js/dataLoading.ts` on purpose, because that module writes the
mutable `state` singleton and pokes DOM elements React does not own; (4) bookmarks are read
from `localStorage` instead of shared React state, so a bookmark toggled *in the same React tree* would not
update the Dashboard until it remounts. Exercises 4/5: lift the shared domain state (reducer or
store) and likely use a data-fetching layer (React Query / router loaders). The *shape*, "load once,
provide at the top, read in pages, pass props down", stays.

### Q2 — Does React have the vanilla "stale on first visit" risk?

The vanilla bug: `renderDashboard()` ran only when `!state.viewRendered.dashboard`, plus when data
loads; a manual "already rendered" flag meant later changes (e.g. bookmarks) did not reach the
screen until a render happened to be triggered. The cache invalidation was **manual**.

**The same *class* of bug can't happen in this React version, for two structural reasons:**

1. **No render cache flag exists.** React re-runs `DashboardContent` whenever its inputs change
   (props or state) and the page remounts on every visit, so there is nothing that says "already
   rendered, skip".
2. **Values are derived, not stored.** `reviewedCount` and `progressPercent` are computed *during
   render* from `data.evidence`, so there is no second copy that can drift.

**Where a stale risk remains (honest limits):** the bookmark count is read once per mount
(`useState(readBookmarkCount)`), not subscribed. If bookmarks changed *while the Dashboard is
mounted* (not possible yet, as the other views are stubs) it would be stale until remount. And the fetched data is
loaded once, so changes to the JSON files need a reload. Both are tied to the placeholder
architecture from Q1.

### Q3 — *When* are derived values recalculated?

- **Vanilla:** only when something *calls* `renderDashboard()`: after each of the three data-loading
  steps and on the first visit. A bookmark toggled later does not trigger it, so numbers could be stale.
  The recomputation is **imperative and event-driven by the developer**: "I remember to call it".
- **React:** `reviewedCount` and `progressPercent` are recomputed **on every render of
  `DashboardContent`**, i.e. whenever the component's props or state change or it mounts, and never
  otherwise. It is **declarative and driven by data**. Because the calculation is a cheap `filter`
  over 18 items it stays un-memoised on purpose. If it were expensive or the list large, `useMemo(…,
  [data.evidence])` would be the way to avoid re-doing it on unrelated re-renders.

A side effect worth knowing for the demo: React renders the *same inputs → same output* every time, so
the percentage can never disagree with the stat cards beside it, since both come from one pass over
the same array.
