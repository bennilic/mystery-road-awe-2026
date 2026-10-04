# ADR 0001 — Use a client-side SPA built with React for the Investigation Portal

- **Status:** Proposed (Exercise 3, 2026-10-04) — proceeding with it unless Benjamin prefers one of the alternatives below
- **Context owner:** Benjamin Lichtenstein

## Context

The portal is a fictional case-file browser. What it does:

- Loads five **static JSON files** (case, evidence, people, locations, timeline), about 20 records each.
- Lets the investigator **search/filter/sort** evidence and timeline, open details, **bookmark**,
  **take notes** and **draft a hypothesis**.
- Keeps all personal data (bookmarks, notes, hypothesis) in **`localStorage`**. There is no
  backend, no accounts, no multi-user sharing.
- Is **interaction-heavy, but not content-heavy** for the open web: it is not a public site that
  needs to be found by search engines.
- Already is a hand-rolled SPA (hash routing, `innerHTML` rendering, a global state object).

## Decision

**Recommended default: keep the SPA architecture and render it with React + TypeScript on Vite.**
One-line justification: the app is a state-driven, interactive tool with cross-view shared state,
where declarative components remove the exact class of bugs found in Exercises 1 and 3 (stale renders,
manual DOM sync, duplicated markup).

## Why SPA is right for *this* app

- **Interaction model fits.** Filters, sort, bookmark toggles and the hypothesis form all update the
  screen instantly from local state, with no server round trip. Full page reloads would discard
  filter state and an open detail on each click.
- **No SEO / first-paint pressure.** Nobody needs to discover individual cases through a
  search engine, and the data is small (a few KB of JSON), so the CSR waterfall costs milliseconds.
- **No server.** A static host (GitHub Pages) is enough, since the build output is plain files.
  SSR would introduce a Node server just to render a page that nobody crawls.
- **Personal, client-held state** (bookmarks, notes) naturally lives in the browser anyway.

## Why React specifically

- State (bookmarks, filters, current view) is read in **many places** (Dashboard counts,
  Evidence cards, Workspace). Declarative rendering (UI = f(state)) removes the manual
  `renderDashboard()` call sites and the first-visit render flag.
- A **component model** removes the repeated badge/card/stat markup.
- **TypeScript integration:** the Exercise 2 domain types (`Evidence`, `TimelineEvent`) flow straight into props.
- A large ecosystem (routers, test tools, devtools), and the course goal is to learn the industry-standard model.

## Honest trade-offs and downsides

| Downside | Impact here |
| --- | --- |
| **Bundle size.** The React production bundle is ~227 kB (71 kB gzip) for `react.html`, versus ~20 kB for the entire vanilla app. | About **11×** more JavaScript to ship for the same screen. |
| **Build tooling and dependency surface.** Plugin, types, lint, and a dependency to keep updated. | More moving parts for a small app. |
| **CSR costs remain:** blank page without JS, nothing for crawlers, waterfall HTML→JS→JSON. | Acceptable for this use case; a hard problem if requirements changed (see Q2 below). |
| **Learning curve and idioms:** hooks rules, purity, effects, keys. Misuse creates its own bugs (stale closures, effect loops). | Real: React does not make the stale-data class of bug impossible, only less likely. |
| **Overkill for the size.** About 1.8k lines of vanilla TS handle five small views. | A cleaner vanilla structure would be viable. |
| **Migration cost and a split codebase** until Exercise 5 ends. | Two entry points, stubs, duplicated shell for now. |

## Alternatives considered

| Alternative | When it would be the better choice |
| --- | --- |
| **Server-rendered vanilla HTML/JS (MPA)** | If SEO, shareable per-record URLs, or users with very old devices mattered; or if data lived on a server and per-user rendering was needed. |
| **Vanilla TS + a small router + small helper (e.g. `lit-html`, Preact, Alpine)** | If bundle size and simplicity are the priority. **Preact** (~4 kB) is API-compatible with React and would be the closest lighter choice. |
| **Another framework (Vue, Svelte)** | Svelte compiles away its runtime (smaller output, less boilerplate) and would suit this size well; Vue has gentler templates. Choose them if the course did not target React. |
| **Meta-framework (Next.js / Astro)** | If SSR/SSG, SEO or per-route data loading becomes a requirement. Astro with islands would fit a mostly-static content site. |

## Consequences

- We commit to learning and maintaining the React mental model and to finishing the migration in Exercises 4/5.
- Shared mutable `state` is replaced by React state/context (and probably a reducer or store) — see
  Demo 10 Q1.
- Hash routing is replaced by a real router in a later exercise.
- If requirements change toward low-end devices or SEO, this ADR should be revisited.

## Demo 8 Questions

### Q1 — What is lost by (a) staying server-rendered vanilla; (b) choosing React over another SPA approach?

**(a) Staying server-rendered vanilla HTML/JS would lose:**

- Instant, no-reload interaction (filter state, open detail and notes UI reset on each navigation,
  unless pushed into URLs or cookies).
- A single place for shared state, since each page would reload and re-read it from storage.
- A path to reuse: with no components you are back to copy-pasted markup.
- *But gains:* tiny payloads, working without JS, trivially crawlable.

**(b) Choosing React over a different SPA approach loses:**

- **Size and startup cost** (≈70 kB gzip runtime vs ~4 kB Preact or ~0 for compiled Svelte/vanilla).
- **Simplicity:** a build step, a plugin, JSX and hooks rules versus plain functions and the DOM.
- **Control over updates:** React decides when to render; hand-written code can be more direct.
- *Gains:* the huge ecosystem, hiring/teaching standard, and best tooling for TypeScript.

### Q2 — A hard requirement for low-end devices or poor connections

**I would change the architecture** away from a pure client-rendered React SPA, because a CSR SPA puts
the *cost* (download + parse + execute the JS bundle, then fetch data, then render) on exactly the
device and network least able to pay it.

Options, in the order I would reach for them:

1. **Prerender / SSG the content** (build the HTML for Dashboard, Evidence list and so on at build time,
   e.g. with Astro or Next static export) so the first paint needs no JS, and **hydrate selectively**
   (islands) only for the interactive parts (filters, bookmark, hypothesis form).
2. **Go lighter on the client:** drop React for Preact or plain TS if interactivity is small,
   and code-split by route.
3. **Reduce data/waterfall:** inline the critical JSON in the HTML, cache with a service worker
   (also gives offline).

For this app, SSG plus small islands is the most natural fit because the data is static and the page set is
small. I would *not* stick with SPA-by-default: the requirement flips the decision from "interactivity
dominates" to "time to first meaningful paint on weak hardware dominates".
