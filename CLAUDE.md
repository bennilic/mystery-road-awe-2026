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

### Commit message convention

Format commits as: `Exercise <N> | Demo <M> | Additional Info`

Example: `Exercise 1 | Demo 1 | Split app.js into ES modules`

### Checkbox-ticking convention (EXERCISE_1.md)

Each exercise file's Self-Check table has two kinds of checkboxes per demo: **Tasks** and
**Questions**.

- **Tasks** get ticked by the agent once genuinely completed *and verified* (e.g. the refactor was
  run and its behavior checked against the pre-refactor app, not just "the code was written").
  Ticking a Task box is a factual claim that the work was done and confirmed working — back it with
  evidence (a commit hash, a test run, a before/after comparison), not just intent.
- **Questions** are nominally Benjamin's own live-demo readiness check — "can I explain this out
  loud, right now, without notes" — which is why EXERCISE_1.md itself says "I fixed it" isn't
  enough, he needs to be able to explain *why*.
  Standing instruction (2026-09-15): always answer Questions too, not just Tasks, when working a
  Demo/Exercise — don't wait for a per-demo ask. Add the answer to the presentation narration (per
  the slide title convention below) and tick the box once added. Flag once per session (not on
  every box) that Question boxes ticked this way reflect an AI-authored answer, not verified
  personal command of the material — the readiness signal is weaker than the checklist's own
  stated bar of "can I explain this out loud, right now, without notes," so Benjamin should treat
  these as a drafted answer to review/internalize before presenting, not as already-demonstrated
  readiness.
- Tick only what was actually verified in the current work session — leave a box unticked rather
  than tick speculatively. An unticked box is fine per the exercise's own rules; a wrongly-ticked
  one misrepresents demo readiness.

### Presentation updates after each finished step

Whenever a task/demo step is finished (a Task checkbox gets ticked in `EXERCISE_1.md`), also add a
slide for it to `presentation/steps.json` in the same pass — via the `create-presentation` skill —
before moving on to the next step. Don't batch this up for later or wait until a whole demo is
done: one finished, verified step gets one slide, immediately.

Each added slide's `narration` must be a real explanation, not a restatement of the diff: say *why*
the change was made and *why* it fixes/achieves what it does, matching the "explain the change and
*why*, not just what" guidance already in the skill. Tag it with the correct `exercise`/`demo` per
the skill's schema.

### Slide title convention

Every slide that answers a specific Task or Question from `EXERCISE_1.md`'s per-demo checklist
must lead its `title` with a `D<demo> - T<n>` or `D<demo> - Q<n>` tag, matching that item's position
in the demo's own Tasks/Questions lists (e.g. Demo 1's 2nd listed Task → `D1 - T2`, its 3rd listed
Question → `D1 - Q3`) — followed by a dash and as much extra description as useful, e.g.
`"D1 - Q2 — reading/writing allEvidence across modules"`. This keeps navigation legible: Benjamin
can tell which checklist item a slide answers at a glance instead of hunting through narration. If
one Task/Question needs more than one slide, suffix with `(1/2)`/`(2/2)` etc. rather than inventing
a new numbering scheme. General app-tour slides not tied to a specific Task/Question (`demo: 0`)
don't get this prefix — they're not answering a checklist item.

### Exercise intro slide

Each exercise gets exactly one section-marker slide at the very front of its block — before even
that exercise's `demo: 0` tour steps — titled `"Exercise <N> — <exercise name>"`, so the deck always
shows which exercise is currently being presented. Give it `"demo": -1` (sorts before `demo: 0`
per `present.js`'s numeric sort) and no `view`/`highlight` (it's a pure narration marker, not tied
to any app screen). Add this once per exercise, the first time that exercise gets any real slides —
don't add it again on every subsequent update to the same exercise's slides.

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
