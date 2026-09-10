# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Project ReMotion — Investigation Portal**: a course-provided, browser-based, vanilla-JavaScript
(no frameworks, no build tool) investigation app built around a fictional incident — an
AI-assisted rehabilitation robot ("ReMotion") loading the wrong calibration profile and triggering
an emergency stop. The app lets an investigator browse evidence, people, locations, and a timeline,
and build a hypothesis.

This is **coursework for Advanced Web Engineering (CSDC)**, cloned from
`https://github.com/leonardo1710/mystery-road-awe-2026` as a brownfield starting point. It is
**deliberately messy** — the course goal is to analyse, refactor, debug, and progressively modernize
it across a series of exercises. Do not "clean it up" proactively outside of what the active
exercise asks for; bugs and code smells are part of the assignment, not accidents to silently fix.

## Current exercise

**`EXERCISE_1.md`** — the active assignment (mirrors the copy handed out for class; keep it in
sync if a newer copy is provided). Scope: pure refactor of `app.js` into ES modules, three
independent bug hunts (mutation/reference, async/Promise, silent/console-only), a full bug-hunt
pass, DevTools/debugger demos, and cleanup (`var`→`let`/`const`, code smells, arrow functions).

**Explicitly out of scope for Exercise 1** (later exercises): TypeScript migration, build tooling,
a full separation-of-concerns architecture, parallelizing async data loading, framework migration.
Don't get ahead of the course — note ideas for later rather than implementing them now.

Keep a running change log (commit messages are fine) so bug fixes can be diffed live in class:
commit the reproduction state (or note the pre-fix commit hash) before applying a fix.

## Running the app

Must be served over HTTP (uses `fetch()` for local JSON — `file://` will not work):

```bash
python -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`.

## Layout

| Path | Purpose |
|------|---------|
| `index.html` | Single-page shell; view sections toggled via JS, loads `app.js` as a classic (non-module) `<script>` |
| `app.js` | Entire application logic — ~1085 lines, one file (this is what Exercise 1 Demo 1 splits into modules) |
| `styles.css` | All styling |
| `data/*.json` | Case data: `case.json`, `evidence.json`, `people.json`, `locations.json`, `timeline.json` — loaded via `fetch()` at startup |
| `assets/`, `resources/` | Images (logo, people portraits) — note the two dirs overlap in content with different naming conventions (`kernel-colt.png` vs `kernel_colt.png`); this inconsistency is one of the "rough edges" mentioned in the README |
| `EXERCISE_1.md` | Current assignment spec and self-check list |
| `README.md` | Course-provided project overview |
| `Advanced_Web_Engineering.pdf` | Course manuscript ("the script") — use as the reference source for theory questions and the chapters cited in `EXERCISE_1.md`'s "Corresponding manuscript reading" section |
| `.claude/PRESENTATION_PREP.md` | Grading rubric, logistics, and presentation-format guidance for exercise presentations |

## `app.js` — current state (pre-refactor)

Flat file, top-level `var` globals, mixed `.then()`-chain and direct DOM manipulation. Notable
global state (all `var`, all module-private once Demo 1 lands):

- `allEvidence`, `filteredEvidence`, `selectedEvidence`, `bookmarks`, `currentPage`
- `allPeople`, `allLocations`, `allTimeline`, `caseData`
- `viewRendered` (per-view render-once flags), `notesStore`
- `STORAGE_KEY_BOOKMARKS`, `STORAGE_KEY_NOTES`, `STORAGE_KEY_HYPOTHESIS` — `localStorage` keys
  (prefix `remotion_`)

Data loading (`loadCorePeopleAndLocations`, `loadEvidenceData`, `loadTimelineData`, `loadAllData`)
is nested `.then()` chains, sequential rather than parallel — Demo 9 converts this to
`async`/`await` while preserving the sequential behavior (parallelizing is out of scope here).

## Working conventions for this repo

- **No package.json, no bundler, no framework.** Keep it that way unless a later exercise says
  otherwise — plain ES modules loaded natively by the browser (`<script type="module">`).
- **Bugs found during Demos 2–5 are the assignment, not incidental findings** — document
  reproduction steps, root cause, and fix per bug (see `EXERCISE_1.md` Demo 5) rather than just
  patching and moving on.
- **Pure refactors stay pure.** When a task says "refactor only" (e.g. Demo 1's module split),
  behavior — including existing bugs — must be identical before/after. Don't fix bugs incidentally
  while relocating code; note them for the dedicated bug-hunt demos instead.
- This is a personal/coursework repo, not a `pj-a0` project — the global `pj-a0`-specific rules
  (Jira workflow, PR conventions, `pj-a0` org) don't apply here.
