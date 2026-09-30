---
name: create-presentation
description: Build or update the interactive, screen-by-screen presentation used to present this course's exercise demos in class. Steps through the live running app and annotated code changes like slides, with spotlight highlights and back/forward navigation. Use when preparing to present a demo, right after finishing a bug fix or refactor task, or whenever EXERCISE_1.md checkboxes get ticked.
---

# Create Presentation

Builds/updates `presentation/` in this repo: a small, static, iframe-based "presenter mode" that
sits on top of the real app and walks it screen-by-screen for the in-class demo — see
`.claude/PRESENTATION_PREP.md` for why this stays a *thin* narration/highlight layer over the real
live app rather than a separate slide deck.

## What it produces

```
presentation/
  present.html     # the presenter shell (iframes ../index.html + overlay chrome)
  present.css       # spotlight/narration/code-panel styling
  present.js        # engine: reads steps.json, drives the iframe, draws the spotlight
  steps.json        # the actual per-demo script — this is what you regenerate/extend
```

`present.html/css/js` are a stable **engine** — copy them from this skill's `assets/` folder only
if missing from `presentation/`. Normally you only touch `steps.json`.

## How the engine works (so you can write correct steps)

- `present.html` loads the real app in a same-origin `<iframe src="../index.html">`. Because it's
  same-origin, `present.js` can reach into the iframe's DOM directly — no screenshots, no
  duplicated markup, so slides never drift out of sync with the actual app.
- The app only has 5 hash routes: `dashboard`, `evidence`, `people`, `timeline`, `workspace`
  (see `app.js` → `handleHashChange`). An `"app"` step drives navigation by setting
  `iframe.contentWindow.location.hash`, exactly like a user clicking the nav bar.
- Highlighting is a CSS-selector spotlight (a dark overlay with a cutout box positioned over
  `iframe.contentDocument.querySelector(selector)`'s real bounding box) — it tracks whatever is
  actually on screen, so if a bug fix changes the DOM structure, re-check the selector still
  resolves rather than assuming it does.
- A `"code"` step dims the app and shows a before/after code panel instead (Before/After tabs —
  see "Code slides: always before **and** after" below). Snippets are embedded
  directly in `steps.json` (not fetched from git at runtime) so the presentation still works if the
  repo's history changes later — pull them from git *when writing* `steps.json`, not at present-time.
- Presentation order is **not** raw array order. On load, `present.js` sorts `steps` by
  `(exercise ascending, demo ascending)`, stable-tiebreaking on original array position for equal
  keys. This means steps can be appended to `steps.json` in whatever order they were completed in
  class (per the authoring procedure below) while the deck still always *plays* in course order.
  Missing `exercise`/`demo` default to `0`. `sessionStorage`'s remembered `presentIndex` is an
  index into this sorted array, so it stays correct across reloads as long as `steps.json` itself
  doesn't change shape between sessions.
- Every step is independently addressable — Back/Next, arrow keys, and a **"Hide overlay"** button
  (also `h` / `Esc`) that instantly drops all presenter chrome and hands control back to the raw
  app. Always demo with this in reach: if the lecturer steers off-script ("open DevTools", "click
  that instead"), hide the overlay rather than fighting the script — see the "keep it live" guidance
  in `.claude/PRESENTATION_PREP.md`.
- A **"Jump to" dropdown** sits above Back/Next for skipping straight to any Exercise/Demo group
  instead of stepping through the whole deck (useful once a deck passes a couple dozen steps).
  Options are built automatically from `steps.json`'s own `(exercise, demo)` pairs at load time —
  tagging a step correctly is the only "authoring" the dropdown needs, there's nothing else to
  maintain here. It stays in sync with Back/Next/keyboard navigation (selecting it jumps via the
  same `render()` path those use; stepping manually updates its displayed selection to match).

## Steps schema (`presentation/steps.json`)

```json
{
  "title": "Exercise 1 — Project ReMotion Refactor",
  "localRoot": "/Users/benjaminlichtenstein/Developer/VSCode/mystery-road-awe-2026",
  "steps": [
    {
      "id": "unique-slug",
      "type": "app",
      "title": "Slide title shown in the narration panel",
      "narration": "What to say out loud on this slide.",
      "exercise": 1,
      "demo": 2,
      "view": "evidence",
      "highlight": "#evidenceList",
      "action": { "type": "click", "selector": "#clearFiltersBtn" }
    },
    {
      "id": "another-slug",
      "type": "code",
      "title": "Slide title",
      "narration": "Explain the change and *why*, not just what.",
      "exercise": 1,
      "demo": 8,
      "file": "app.js",
      "line": 42,
      "before": "var allEvidence = [];",
      "after": "let allEvidence = [];"
    }
  ]
}
```

- Top-level `localRoot` (optional): this repo's absolute path on disk. Powers the "Open in VS Code"
  link on code slides (`vscode://file/<localRoot>/<file>:<line>`). It's inherently
  machine-specific — fine here since this is a single-user, single-laptop tool, not something
  shared across machines. Omit it and the link simply doesn't render.
- `exercise` / `demo` (both optional integers, on every step regardless of type): which course
  exercise and which `EXERCISE_1.md` "Demo N" heading this step demonstrates, e.g.
  `"exercise": 1, "demo": 3` for a step from "Demo 3 — Bug hunt: an asynchronous/Promise-handling
  bug". These drive presentation order — see "How the engine works" above — they are *not* just
  metadata. **Convention:** general app-tour/intro steps not tied to any specific demo (dashboard
  walkthrough, view tours, etc.) get `"demo": 0` so they sort first within their exercise, ahead of
  any numbered demo. Steps omitting `exercise`/`demo` entirely also default to `0`/`0`, which is
  deliberate: it means older, not-yet-tagged steps behave like general-tour steps (sort first)
  rather than landing in an arbitrary position — tag them properly as you touch them.
- `type: "app"` fields: `view` (one of the 5 routes, optional if staying on the current view),
  `highlight` (a CSS selector resolvable inside the iframe, optional), `action` (optional single
  `{type: "click", selector}` fired after navigation — e.g. to reproduce a bug live), `waitFor`
  (optional CSS selector to poll for, up to 600ms, before highlighting/acting — use for views whose
  content renders asynchronously after the hash change, so the spotlight doesn't land on an empty
  or still-loading container; if the selector never appears, the step proceeds anyway after the
  timeout rather than hanging the deck — everything's local, so this stays short).
- `type: "code"` fields: `file`, `before`, `after` (**both required** — see the next section),
  `line` (optional — the first changed line number; powers the "Open in VS Code" link together
  with top-level `localRoot`, jumping straight to that line in the real file). With both present
  the slide gets Before/After tabs, opening on After.
- `id` must be unique and stable — keep old ids when editing a step. Note that step *order* is now
  driven by `exercise`/`demo`, not array position, so reordering entries in the raw JSON array is
  harmless; what must stay stable is each id itself and its `exercise`/`demo` tag (changing the tag
  moves the slide in the deck, which is fine if the recorded demo number was wrong, but do it
  deliberately).

## Code slides: always before **and** after

Every `"code"` step must carry **both** `before` and `after`. Benjamin wants to flip between the
two tabs live in class; a one-sided snippet hides the very thing the slide is about (what changed).
This applies to Question slides, config slides and "here's the new file" slides too — not only
bug-fix diffs.

- **Real history, not invention.** Take `before` from the commit preceding the change
  (`git show <commit>^:<file>`) and `after` from the change itself (`git show <commit>:<file>`),
  not HEAD — the file may have moved on since. Keep both snippets the same scope (same
  function/lines) so the tabs compare line-for-line.
- **Nothing existed before** (new file such as `.gitignore`, a first workflow, `package-lock.json`):
  use the literal text `(file did not exist yet)` as `before` — or, when only a *part* of an
  existing file is new (e.g. new `scripts` entries), the same block without the new entries.
- **Conceptual contrasts** (Question slides, e.g. "what does `await` do"): `before` is the real
  pre-refactor construct (e.g. the old `.then()` chain), `after` the current code.
- **A deliberate failure demo** (proving a gate blocks): `before` = the correct code, `after` = the
  deliberately broken code, with the real tool output appended as trailing comments in the file's
  own comment syntax — capture it by actually reproducing the failure, then revert.
- If a correct side genuinely can't be derived from history, say so in your report rather than
  fabricating one.

## Syntax highlighting (`present.js`)

The code panel colours snippets with a tiny dependency-free tokenizer (Dark+ palette, `.tok-*`
classes in `present.css`) — deliberately no CDN highlighter, so the talk works offline. Formats
currently coloured:

| Extension | Renderer |
|-----------|----------|
| `.js`, `.ts` (also labels with a suffix, e.g. `app.js (pre-refactor)`) | `renderHighlightedJavaScript` — keywords incl. TS ones, built-in types, generics, strings, numbers, comments |
| `.json` (incl. JSONC `//` comments) | `renderHighlightedJson` — keys, string values, numbers, `true/false/null` |

Anything else (`.yml`, `.css`, `.gitignore`, …) renders as plain monospace text.

**Whenever you introduce a slide for a file format that isn't in the table, add highlighting for
it in the same change** — don't leave new formats plain: write a `renderHighlighted<Format>`
function next to the existing two (token regex with named groups → `appendToken(container, text,
className)`, reusing the existing `tok-*` classes so colours stay consistent), add an
`is<Format>File` matcher on `step.file`, and branch to it in `renderCodeTab`. Verify it in the
browser (check the produced `span` classes on a real slide), then copy the updated `present.js`
into this skill's `assets/` folder so the engine copy doesn't drift from `presentation/`.
Use `textContent`/`appendToken` only — never `innerHTML` — so snippet text can't inject markup.

## Procedure when this skill runs

1. **Read the active `EXERCISE_<N>.md`** — find which demo(s) the user wants slides for (ask if ambiguous: "all
   checked demos" vs. "just demo N"). Don't script a demo whose tasks aren't actually done —
   presenting a slide for unfinished work defeats the point.
2. **Read `presentation/steps.json`** if it exists — treat it as data to extend, not overwrite.
   Preserve existing step `id`s; append new steps for newly-completed demos (raw array position no
   longer determines presentation order — see "How the engine works" — so append freely rather than
   worrying about where in the file a new step lands), and only edit an existing step if its
   underlying code/DOM actually changed since it was written. **Tag every new step** with
   `"exercise"` (the exercise number — `1`, `2`, …) and `"demo"` (the Demo # within it, from
   the `EXERCISE_1.md` "Demo N — ..." heading you're scripting — use `"demo": 0` for a general
   app-tour step not tied to any specific demo).
3. **For each bug-fix or refactor demo**, find the real before/after:
   - `git log --oneline` to find the reproduction-state and fix commits (the course explicitly asks
     students to keep these as separate commits — use them).
   - `git show <pre-fix-hash>:<file>` / `git show <fix-hash>:<file>` (or `git diff`) to pull the
     exact before/after snippet (both sides, always — see "Code slides: always before and after") —
     keep snippets short (the relevant function/lines), not whole
     files.
   - Note the real line number the change starts at in the *current* (post-fix) file, and set it as
     `line` — that's what the slide's "Open in VS Code" link jumps to. Make sure top-level
     `localRoot` is set in `steps.json` (once, repo-wide) or the link won't render at all.
4. **For each app-navigation slide**, confirm the `view` and `highlight` selector are real:
   - grep `index.html` for the target element's `id`/class rather than guessing one.
   - if the slide reproduces a bug live via `action`, make sure the selector/click actually
     reproduces it against the *current* code (re-check after fixes land — a bug-repro step should
     move from "before" demos to a code-diff step once fixed, not linger as a live repro of
     already-fixed behavior).
5. **Ensure the engine exists**: if `presentation/present.html|css|js` are missing, copy them from
   `.claude/skills/create-presentation/assets/`. Don't regenerate the engine from scratch unless
   the user reports it's broken — steps.json is the only file meant to churn.
6. **Write/merge `presentation/steps.json`.**
7. **Tell the user how to preview** — the presenter needs the same dev server as the app (it's a
   same-origin iframe, so `file://` won't work). Since Exercise 2 the app is TypeScript built with
   Vite, so a plain `python -m http.server` will **not** work (it serves `.ts` as `video/mp2t` and
   the app never boots, leaving the loading overlay stuck):
   ```bash
   npm run dev -- --port 8080
   ```
   then open `http://localhost:8080/presentation/present.html`. (The VS Code "Present in Chrome"
   launch config does this for you.) If the browser still hangs after switching servers, hard-reload
   — it may have cached the old wrong-MIME response.
8. **Do a real pass yourself**: open it (e.g. via the `run` skill or a browser tool) and click
   through every step at least once, confirming each spotlight actually lands on the right element
   and each code panel shows real, correctly-escaped, correctly-coloured code with working Before and After tabs — a step that silently fails to find its
   selector is worse than no step, since the presenter won't notice mid-demo.

## Explicit non-goals

- This is **not** a slide deck replacing the live app — see `.claude/PRESENTATION_PREP.md`: none of
  the 30 grading points are for presentation polish, and a rehearsed-looking format can actively
  hurt the "explanation"/"understanding" criteria if it reads as a script being played back rather
  than genuine command of the material.
- Don't add steps for things that aren't real yet (planned-but-not-implemented fixes, future
  exercises' scope). Script only what's actually done and presentable.
- Don't fetch git history at runtime from `present.js` — keep the presentation file self-contained
  and fast; do the git digging while authoring `steps.json`.
