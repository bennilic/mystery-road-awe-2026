# Exercise 3 — Theory demos 1–5

Answers are written for this repo (Project ReMotion Investigation Portal). Page references point to
the course manuscript chapters listed in `EXERCISE_3.md`.

---

## Demo 1 — Historical view of the web

### Task: how web applications evolved, and where this app sits

| Era | Roughly | Shape of the web | Where logic lives |
| --- | --- | --- | --- |
| Static documents | 1991–1995 | Hand-written HTML files, hyperlinks | Nowhere: the server returns a file |
| Dynamic server pages (MPA) | 1995–2004 | CGI, PHP, JSP, ASP: server builds HTML per request | Server; every click is a full page load |
| AJAX / "Web 2.0" | 2005–2010 | `XMLHttpRequest`, jQuery: parts of a page update without reload | Split: server renders, JS patches the DOM |
| SPA frameworks | 2010–2016 | Backbone, Angular, then React/Vue: JS renders the whole UI from JSON | Client |
| Hybrid / modern rendering | 2016–today | Next.js, Remix, Astro: SSR/SSG + hydration, islands, server components | Both, chosen per route |

**Placement of this app:** between *AJAX* and *SPA frameworks*, i.e. a hand-rolled SPA from about
2012–2014. Justification:

- It is a **single HTML document** (`index.html`) with five `<section class="view">` blocks, and
  no server-side rendering of content, so it is past the MPA era.
- Content is produced by **client-side JavaScript** from JSON fetched at runtime
  (`fetch("data/evidence.json")` and friends), which is the SPA trait.
- But there is **no framework**: DOM updates are `innerHTML` string building, state is a mutable
  singleton, and routing is a hand-written `hashchange` handler. That is how SPAs were built
  *before* declarative UI libraries existed.
- It uses `fetch`, ES modules and TypeScript, so it is not literally from that era. The
  *architecture* is, and that is what the timeline places.

### Q1 — What did AJAX solve, and what did it introduce?

**Solved:** in a plain server-rendered page, any interaction that needs fresh data (filter a list,
submit a form, load more) requires a **full request and a full page reload**. The user loses scroll
position, focus and transient UI state, and the server re-sends the whole document including header,
navigation and footer. AJAX (and jQuery, which hid the browser differences in `XMLHttpRequest` and
the DOM API) let a page request only the data it needed and patch only the affected part of the DOM.

**New problems it introduced**, which SPA frameworks then targeted:

1. **Manual DOM synchronisation.** The developer must remember every place in the DOM that depends
   on a piece of data and update each one by hand. This is the "spaghetti" of jQuery callbacks. It
   is exactly what this app's `renderDashboard()` being called from four places (three data-loading steps
   in `dataLoading.ts` plus `navigation.ts`) shows.
2. **State scattered across the DOM and global variables**, with no single source of truth.
3. **Navigation and history broke.** The URL no longer reflects what is on screen (no back button, no
   deep links) until developers re-implemented routing themselves.
4. **Structure and reuse.** There was no component model, only HTML strings and selectors.

SPA frameworks answered with: declarative rendering (UI = f(state)), a component model, and routers.

### Q2 — Hash-based routing: which era, and what does it say?

`#dashboard`-style routing belongs to the **early SPA era (~2008–2013)**. Changing only the
fragment is the one URL change that does **not** trigger a page load, so it was the only way to get
"navigation without reload" and a working back button before the **History API**
(`pushState`/`popstate`, HTML5, widely supported ~2012) existed. Backbone's early router and
Angular 1's default `#/route` URLs used it too.

It tells us the architectural choice (client-side routing in one document) became common **when
browsers could update the URL without reloading, but before `pushState` was reliable**. Today a router
normally uses real paths (`/evidence/E04`), which also let a server render or at least serve
something meaningful for each URL. A hash is never sent to the server, so hash routes cannot be
server-rendered or indexed per view.

---

## Demo 2 — SSR vs. CSR

### Task 1: comparison table

| | **Server-Side Rendering (SSR)** | **Client-Side Rendering (CSR)** |
| --- | --- | --- |
| **First response** | Complete HTML with the content already in it | Near-empty HTML shell (`<div id="root">`) plus `<script>` tags |
| **Before the user sees content** | Browser parses HTML and paints. JS is optional | Browser downloads, parses and runs JS, then JS fetches data (often another round trip), then builds the DOM |
| **Time to first content** | Fast: one request | Slower: shell → bundle → data → render (waterfall) |
| **Subsequent navigation** | Classic: another full-page request, server renders a new page. With hydration/SPA-style navigation: only data or fragments | JS swaps the view in-place, usually only a small JSON request. No document reload |
| **Server load** | Renders on every request (or cached) | Serves static files, so cheap to host (CDN) |
| **SEO / no-JS / crawlers** | Content is in the HTML | Crawler or no-JS user sees an empty shell unless they run JS |
| **Interactivity cost** | Needs hydration if it is also interactive | Interactive as soon as it renders |

### Task 2: a real website — Wikipedia (primarily SSR)

Evidence collected on 2026-10-04 with `curl -sL -A "Mozilla/5.0" https://en.wikipedia.org/wiki/Server-side_scripting`
(the equivalent of "View source", which shows what the server sent *before* any JavaScript runs):

- The raw response is a **133 KB** HTML document with `<title>Server-side scripting - Wikipedia</title>`.
- The article text is **already in that HTML**: e.g. `<p id="mwCQ">Server-side scripting is often
  used to provide a customized …</p>`, plus the section headings (`<h2>`) and `mw-parser-output`
  content wrappers. Nothing needs JS to appear.
- Only a handful of `<script>` tags exist, and they enhance the page (search suggestions, collapsible
  sections) rather than create it.
- Following a link triggers a new document request with a new complete HTML response, i.e. classic
  server-rendered navigation.

In the Network tab you would see the document request carrying the content, and no `fetch`/XHR call
returning the article as JSON. That is the signature of SSR. (A CSR site such as a typical Create
React App deployment shows the reverse: a ~1 KB HTML file with an empty root, and the content only
arriving via a JSON call after the bundle ran.)

### Q1 — This app is CSR. Step by step to a visible Dashboard

Why: the HTML the server sends contains **no case data**. `index.html` holds an empty
`<div id="dashboardContent"><!-- rendered by app.js --></div>`. All content is created in the
browser.

1. Browser requests `/` and the server (Vite in dev, any static host in prod) returns `index.html`
   unchanged. No rendering happens on the server.
2. The parser reaches `<link rel="stylesheet" href="styles.css">` and `<script type="module"
   src="js/main.ts">`. The loading overlay is visible and the Dashboard section is empty.
3. The browser downloads and executes the module graph (`main` → `navigation` → views → `state` …).
4. `main.ts` registers `DOMContentLoaded → initApp()`. `initApp` reads bookmarks/notes from
   `localStorage`, attaches listeners and calls `loadAllData()`.
5. `loadAllData()` fetches `data/case.json`, then `people.json`, `locations.json`; then evidence and
   timeline in parallel. Each response is parsed and written into `state`.
6. After each step `renderDashboard()` builds an HTML string and assigns it to `innerHTML`; the
   browser parses it into DOM and paints.
7. When the three loading steps finish, the overlay is hidden and `handleHashChange()` shows the
   Dashboard section. **Only now** does the user see real content.

That is a request waterfall: HTML → JS → JSON (×5) → render.

### Q2 — One real cost of that choice

**Everything the user sees depends on JavaScript and several network round trips.**

- **JavaScript disabled:** the user sees a header, a nav that does nothing, and an empty page (the
  overlay stays up forever); there is no `<noscript>` fallback.
- **Slow connection:** time to first meaningful content = HTML + JS bundle + 5 JSON requests, serialised
  in part by `loadCorePeopleAndLocations`. A server-rendered page could show the dashboard as soon
  as the HTML arrives.
- **Search crawlers:** a crawler that does not execute JS indexes an empty shell. Even ones that do
  render JS do it later and less reliably. And since the routes are hash fragments, the server never
  even sees which view was requested.

For a coursework investigation tool behind no search engine, this cost is acceptable. See the ADR.

---

## Demo 3 — The virtual DOM

### Task 1: in my own words

The real DOM is the browser's live tree of elements. Touching it is comparatively expensive because
changes can trigger style recalculation, layout and repaint, and replacing a subtree throws away
element state (focus, scroll, selection, text typed into inputs). The **virtual DOM** is a cheap
in-memory description of what the UI *should* look like, as plain JavaScript objects. On each state
change the library builds a **new** description, **compares** it to the previous one (diffing /
reconciliation) and applies only the **minimal set of real DOM operations** that make the real tree
match. The problem it solves is *not* "the DOM is slow", but: **how do I let developers write
"render the whole UI from the current state" without paying for rebuilding the whole real DOM every
time**, and without hand-writing the "which nodes changed" logic.

### Task 2: the example in the original `app.js` (commit `22cb2d8`)

Toggling **one** bookmark star on **one** evidence card:

```js
function handleBookmarkClick(evidenceId) {
  // ...flip one id in the `bookmarks` array...
  saveBookmarksToStorage();
  if (currentPage === "evidence") renderEvidenceList();   // <-- the culprit
}

function renderEvidenceList() {
  ...
  var html = "";
  for (var i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]);            // rebuilds every card as a string
  }
  container.innerHTML = html;                              // destroys and recreates every card node
```

What actually changed: one `<button class="bookmark-btn">` gets class `active` and its icon changes
`☆` → `★`. What was recreated: all 18 `.evidence-card` elements, with every title, summary, badge and
tag chip, because `innerHTML = html` discards the existing children and parses new ones.
Side effects visible in the same code: it re-parses all strings, loses hover/focus on the clicked
button (the node it was on no longer exists), and the `container.addEventListener("click", …)` at the
end of `renderEvidenceList` runs again on **every** render, stacking listeners (a latent bug the
hand-written approach invites).

### Q1 — How would a virtual DOM avoid recreating the unchanged parts?

The card list would be described as data → elements. After the click the library produces a new
virtual tree in which 17 cards are identical to before and one card has a different `className` and
icon text. Diffing the two trees finds that **only** one `<button>`'s `class` attribute and one
`<span>`'s text differ, so it issues exactly two real DOM updates (`className = …`,
`textContent = …`). The 17 other cards and the rest of the card (title, summary, tags) are never
touched, keeping their DOM nodes, focus and scroll state. In React this is helped by `key={ev.id}`,
which lets reconciliation match old and new cards by identity instead of position.

### Q2 — Is the virtual DOM "faster" than `innerHTML`?

**Not inherently. It is a trade.** Diffing is *extra* work: building the new tree and walking both
trees costs CPU and memory *on top of* the eventual DOM writes. A hand-written, surgical
`button.classList.toggle("active")` is faster than any virtual-DOM update, because it does zero diffing.
And for a one-off full replacement, `innerHTML` can beat diffing, since the browser's HTML parser is
native code.

What you buy is **not speed in the best case, but a good worst case with a simple programming model**:
you write "render everything from state" and the library keeps the real DOM updates small, rather than
you hand-tracking every dependency. You are trading **extra CPU for diffing** for **less DOM churn and
far less hand-written update code (fewer bugs)**. Roughly: it is faster than the *naive* approach
(rebuild everything with `innerHTML`), slower than the *expert hand-optimised* approach.

### Q3 — Does a virtual DOM library automatically make an app fast?

No. React apps still get slow when:

- **Too many re-renders:** a state change high in the tree re-runs every child component function,
  and while the DOM diff stays small, rendering thousands of components is still CPU work.
  (Mitigations: `React.memo`, keeping state local, splitting components.)
- **Expensive work during render:** sorting/filtering large arrays on every render instead of
  `useMemo`, or heavy computation in the component body.
- **Missing or unstable `key`s** (e.g. array index or `Math.random()`), which makes React throw away
  and recreate nodes, defeating the diff.
- **Huge lists** rendered entirely (needs windowing/virtualisation).
- **Large bundles and waterfalls**: the initial load cost (see CSR above) is not touched by the virtual DOM.
- **Unnecessary effects** that set state in a loop, or layout thrashing from reading layout in effects.

---

## Demo 4 — SPA vs. MPA: state & routing

### Task 1: how navigation works in this app

```text
click "Timeline" in nav  (index.html: onclick="navigateTo('timeline')")
        │
        ▼
navigateTo(view)            js/navigation.ts   →  window.location.hash = "timeline"
        │   (the browser updates the URL fragment; NO request is made)
        ▼
"hashchange" event          registered once in main.ts setupEventListeners()
        │
        ▼
handleHashChange()          js/navigation.ts
   1. reads location.hash, falls back to "dashboard" if unknown
   2. state.currentPage = hash
   3. removes .active from every .view, adds it to #view-<hash>
   4. moves .active to the matching .nav-btn
   5. first visit only (state.viewRendered[hash]): calls that view's render function
        │
        ▼
the already-loaded DOM section becomes visible
```

**What does *not* happen** (it would in a classic multi-page site): no HTTP request for a new
document; no new HTML parse; no JS re-download or re-execution; **the JavaScript heap is not
thrown away** (`state`, fetched data, filters, the open evidence detail all survive); no
white flash or scroll reset from a document swap; the stylesheet and the header/footer are never re-sent.

### Task 2: what is lost on a full reload vs. preserved

| State | Where it lives | Survives a full reload? |
| --- | --- | --- |
| Bookmarked evidence ids | `localStorage` `remotion_bookmarks` | **Yes** |
| Personal notes | `localStorage` `remotion_notes` | **Yes** |
| Saved hypothesis draft | `localStorage` `remotion_hypothesis` | **Yes** |
| Current view | URL hash | **Yes** (the hash is part of the URL, so `handleHashChange()` restores it) |
| Fetched case/evidence/people/locations/timeline | `state.*` (memory) | **No**, re-fetched on boot |
| Evidence filters, search text, sort order | DOM control values + `state.filteredEvidence` | **No** (reset to defaults) |
| Currently open evidence detail (`selectedEvidence`) | memory | **No** |
| People/Locations tab (`currentPeopleTab`) | memory | **No** (back to "People") |
| Timeline filters/order | DOM control values | **No** |
| `viewRendered` render-once flags | memory | **No** (all reset to false, which is correct, as the DOM is gone too) |
| Unsaved hypothesis edits (typed, not saved) | DOM only | **No** |
| Loading flags (`evidenceViewLoading`, `loadingStepsRemaining`) | memory | **No** |

### Q1 — Where does "the current page's data" live?

**MPA:** between requests it lives on the **server** (database, session) and in the request itself
(URL, cookies, form post). The browser holds no durable state; every navigation hands the server
what it needs and the server answers with a page that already embodies that data. The client is
effectively stateless.

**SPA:** it lives in the **browser's memory** (`state` here) and in browser storage. The server
only serves data endpoints (here static JSON).

Consequences:

- **Good:** instant navigation, no re-fetching, UI state (filters, an open panel, a half-typed form)
  survives view changes, and the server stays simple and cacheable.
- **Bad:** state is **lost on reload or tab close** unless explicitly persisted (hence
  `localStorage`); state can be **stale** (the vanilla dashboard bug — see Demo 10); the client
  carries the complexity of keeping state and UI in sync; it is not shareable via URL; and two
  tabs hold diverging copies.

### Q2 — What does a router library do that the hand-rolled version does not?

`handleHashChange` only maps *a hash string* to *toggling classes*. A router library is also
responsible for:

- **Path-based URLs via the History API** (`pushState`/`popstate`), not just `#fragments`.
- **Route parameters and nesting** (`/evidence/:id`, layouts with child routes), and **query
  strings** (`?type=log&status=flagged`), which would make filters shareable and reload-proof.
- **Proper not-found handling** (here an unknown hash silently becomes the dashboard).
- **Declarative route definitions** with matching, rather than an `if`/`else` chain.
- **Scroll and focus management** on navigation (restoring scroll on back, focusing the new
  heading for screen readers).
- **Navigation guards / redirects** (e.g. unsaved hypothesis changes) and **code-splitting / lazy
  loading** per route.
- **Link semantics:** real `<a href>` links that work with middle-click, "open in new tab" and
  right-click, instead of `<button onclick>`.
- **Data loading per route** and pending/error UI (in data routers).

### Q3 — The browser's back button right now

Each `navigateTo()` assigns `window.location.hash`, and changing the hash **adds a history entry**.
Pressing Back moves to the previous entry, which fires `hashchange` (and **not** a page load), and
`handleHashChange()` reads the *restored* hash and shows that view. So Back works across views, "for free",
because the browser owns the history stack and the app only *reacts* to the hash.

What does **not** come back: in-view state. Filters and the open evidence detail are not in the URL, so
Back to the Evidence view shows it exactly as it was left only because the DOM section was never
destroyed, not because anything was restored. After a reload, that state is gone.

---

## Demo 5 — React introduction

### Task 1: a tiny JSX component

`react/sandbox/CaseBadge.tsx` (no state, no props, static data only):

```tsx
const CASE_ID = "REMOTION-2026-10";
const CASE_STATUS = "open";

export function CaseBadge() {
  return (
    <p>
      Case <strong>{CASE_ID}</strong> is <span className="badge badge-flagged">{CASE_STATUS}</span>
    </p>
  );
}
```

It type-checks under the project's strict `tsconfig` (`npm run typecheck`). `{…}` embeds a JS
expression; `className` replaces `class` since `class` is a reserved word in JS; there is one root
element returned.

### Task 2: what "component" means vs. a function returning an HTML string

A **React component** is a function (or class) that takes props and returns a *description of UI*
(React elements) which React owns and manages over time: it decides when to call it again, how to
update the DOM from the new output, where its state lives (hooks), when it mounts/unmounts (effects,
cleanup), and it can be nested and composed as `<Card />` in JSX.

`renderEvidenceCardHTML(ev)` is a plain function returning a **string**. The caller must hand that string to
`innerHTML`, and from then on the function has **no relationship** to the DOM it produced: nothing
re-runs it when data changes, nothing tracks which DOM nodes came from it, it has no local state or
lifecycle, and the string is untyped markup (a typo in a tag name is only found at runtime). Also,
*escaping is the developer's job*: `"<h3>" + ev.title + "</h3>"` injects unescaped text. React
escapes by default.

| | `renderEvidenceCardHTML(ev)` | `<EvidenceCard ev={ev} />` |
| --- | --- | --- |
| Returns | HTML string | Element objects (a tree) |
| Output → DOM | developer calls `innerHTML` | React reconciles and patches |
| Re-run when data changes | developer must call it | React re-calls it, then diffs |
| Local state / lifecycle | none | hooks, effects |
| Escaping | manual (XSS risk) | automatic |
| Type-checked markup | no | yes (TSX) |

### Q1 — What is JSX? What does it compile to?

JSX is **syntax sugar for function calls**, not HTML and not a string. A build step
(esbuild/Babel via `@vitejs/plugin-react`, with `"jsx": "react-jsx"` in tsconfig) rewrites it.
With the automatic runtime:

```tsx
<p>Case <strong>{id}</strong></p>
```

becomes

```js
import { jsx, jsxs } from "react/jsx-runtime";
jsxs("p", { children: ["Case ", jsx("strong", { children: id })] });
```

(the older classic form is `React.createElement("p", null, "Case ", React.createElement("strong", null, id))`).
Each call returns a plain object (`{ type: "p", props: {...}, key: null }`), a **React element**.
So a component's return value is a tree of plain objects, which React diffs, and only then turns
into real DOM nodes.

### Q2 — How does each one's output become real DOM?

- **String version:** `renderEvidenceCardHTML` returns text. Concatenated with 17 others and assigned
  to `container.innerHTML`, the **browser's HTML parser** turns text into nodes *every time*,
  replacing everything previously there. The app has no representation of the result, only the text it
  made.
- **Component version:** the component returns **React elements**, objects in memory.
  React keeps the previous tree, diffs against the new one, and calls DOM APIs
  (`createElement`, `setAttribute`/`className`, `textContent`, `removeChild`) only for the differences. On
  first render it creates nodes directly with `document.createElement` (no HTML parsing). Because
  values are inserted as text nodes/properties, nothing is interpreted as markup, which is
  also why XSS-through-interpolation does not happen.

### Q3 — "Components are just functions": what would break with a side effect in render?

A component is `(props) => UI`: React expects it to be a **pure function of its props, state and
context**: same inputs, same output, no observable effects. React relies on that: it may call a
component **more than once** per update (StrictMode deliberately double-invokes render in development to
expose impurity), may **pause, discard or restart** a render (concurrent rendering), and may skip
calling it entirely when nothing changed.

A render-time side effect (mutating a global, `counter++`, writing to `localStorage`, `fetch`, editing
the DOM) therefore breaks things: the effect runs **an unpredictable number of times** (double
counters in StrictMode, a fetch fired on every re-render in a loop), components **depend on render order**,
two components sharing the mutated global show **inconsistent UI**, and the discarded concurrent
renders leave behind effects from output the user never saw. The fix is to put effects where React
expects them: **event handlers** (in response to the user) and **`useEffect`** (after commit, with
cleanup), and to keep render a calculation.
