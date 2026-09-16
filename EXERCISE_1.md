# Exercise 1 — Refactoring the App

This is the first exercise in Advanced Web Engineering Course (CSDC). You will **not add any new
features** in this exercise. The goal is to make the existing application correct and more
maintainable, understand advanced JavaScript topics, and get comfortable with your browser's
developer tools along the way.

**Out of scope for this exercise** (these come later in the course): migrating to TypeScript,
introducing a build tool, splitting into a full separation-of-concerns architecture beyond plain
modules, parallelizing/optimizing the async data loading, and any framework migration. If you
notice things related to those topics while you work, write them down (you'll come back to them).

Keep a running note of what you changed and why (a `CHANGES.md`, or commit messages, your choice!).
Several theory questions ask you to explain a specific change you made, and for bug fixes, **using
real commits is the easiest way to show a before/after live in class**. E.g. commit the reproduction
state (or just note the commit hash before your fix) so you can diff it against your fix on demand.

## Corresponding manuscript reading

This exercise corresponds to the following chapters in the course manuscript:

- **Chapter 2, Scope, Closures, and Function Forms** — PDF pp. 19–28
- **Chapter 3, Values, References, Mutation, and Prototypes** — PDF pp. 29–34
- **Chapter 4, The Browser Runtime, DOM Events, and Debugging** — PDF pp. 36–39
- **Chapter 5, ES Modules and Maintainable Boundaries** — PDF pp. 41–45
- **Chapter 6, Promises, `async`/`await`, and Error Flow** — PDF pp. 47–52

## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are
presented in class. Every task and every question has its own checkbox — you can't answer a
question convincingly without having actually done its task first.

These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are
able to present in the Moodle course. **Before class, go through and tick only what you can
genuinely demonstrate or answer on the spot, live.** An unticked box is fine, but remember that you
need to at least tick ~70% of tasks on all exercises for a positive course grade. "I fixed it" is
not enough for any bug-related item: you need to be able to explain *why* it was broken and *why*
your fix works.

| # | Demo | Ready? |
|---|---|---|
| 1 | Split the app into JS modules | ☑ |
| 2 | Bug hunt — mutation/reference bug | ☑ |
| 3 | Bug hunt — an asynchronous/Promise-handling bug | ☑ |
| 4 | Bug hunt — silent (console-only) bug | ☑ |
| 5 | Bug hunt — full walkthrough & reflection | ☑ |
| 6 | Use the JavaScript debugger | ☑ |
| 7 | DevTools tour (Console/Network/Application/Elements) | ☑ |
| 8 | Clean coding: globals, `var`/`let`/`const`, code smells | ☑ |
| 9 | Refactor nested Promises to `async`/`await` | ☐ |
| 10 | Refactor to arrow functions | ☐ |

A demo only counts as "Ready" once **every** task and question checkbox inside it (below) is
ticked — the table above is just a fast overview, tick the boxes inside each demo first.

---

## Demo 1 — Split the app into JS modules

`app.js` is currently one file, well over a thousand lines, mixing data loading, global state,
rendering for every view, event handling, and utility functions. Split it into multiple files using
native ES modules (`import`/`export`). No bundler, no build step, just modules the browser loads
directly.

**Tasks**

- [x] Design a module boundary you can justify, and implement it (e.g. data loading, shared state,
      one module per view's rendering, `localStorage` helpers, small formatting/lookup utilities,
      and an entry-point module that wires up navigation and event listeners on startup).
- [x] Update `index.html` to load your entry point with `<script type="module" src="...">` instead
      of the current plain `<script src="app.js">`.
- [x] Do this as a **pure refactor first**: the app must behave identically before and after (bugs
      and all — you are not fixing anything yet in this demo). Re-run the app after every few
      changes and confirm nothing new broke.
- [x] Decide deliberately, function by function, what needs to be exported and what can stay
      private to its module. Not everything needs to be public.

**Questions** (depend on the tasks above)

- [x] What is the difference between a classic `<script>` and a `<script type="module">`? Name at
      least two behavioral differences that are relevant to this app.
- [x] Before your refactor, `allEvidence` was a global `var`, readable and writable from anywhere in
      `app.js`. After splitting into modules, what has to happen for a different module to read or
      change that value? What error do you get if you forget, and why is that error actually
      useful?
- [x] What's the difference between a named export and a default export? Point to one place in your
      refactor where you chose one over the other, and explain why.
- [x] Why won't `type="module"` scripts run at all if you open `index.html` directly from disk
      (`file://...`) instead of through a local HTTP server? (You already need a server for
      `fetch()` — is this the same reason, a different one, or both?)

---

## Demo 2 — Bug hunt: a mutation/reference bug

The app has several independent defects hidden across its views. Find them the way you would on a real project: by using the app thoroughly,
reading error output, debugging and reasoning about the code once you have a reproducible symptom.

For this demo specifically, find and fix a bug where an array or object gets changed in a place
that surprises you (something is mutated that shouldn't have been, or two things that were supposed
to be independent turn out to be linked).

**Tasks**

- [x] Reproduce the bug reliably and write down the exact steps.
- [x] Form a hypothesis for the root cause and confirm it (not just patch the symptom).
- [x] Fix it, and verify the fix doesn't break anything else nearby.

**Questions** (depend on the task above)

- [x] Explain — in your own words — the difference between a *reference* and a *copy* in
      JavaScript, and how that distinction explains what you observed.
- [x] Walk through the exact user actions and system state that trigger the bug. Could you have
      found it by reading the code top-to-bottom without running it? Why or why not?

---

## Demo 3 — Bug hunt: an asynchronous/Promise-handling bug

Find and fix a bug caused by how the app handles a Promise-based operation — for example,
something that should update once an async operation finishes but doesn't, or state that gets
checked before (or without ever) being properly set by an async callback. This does not have to be
flaky or timing-sensitive to reproduce. The point is that you can't explain the root cause without talking about
*when*, relative to a Promise/callback, something did or didn't happen.

**Tasks**

- [x] Reproduce the bug reliably and write down the exact steps.
- [x] Form a hypothesis for the root cause, expressed in terms of the async operation involved (what
      was supposed to happen once it resolved, and what actually happened instead), and confirm it.
- [x] Fix it, and verify the fix actually addresses the async handling rather than papering over the
      symptom (e.g. don't just add a delay or a retry if the real issue is a missing state update).

**Questions** (depend on the task above)

- [x] Explain the async operation this bug revolves around: what does it fetch/return, and at what
      point in its lifecycle (before it starts, while pending, on success, on failure) does the bug
      actually happen? How did you confirm that, rather than just guessing?

      The async operation is `fetch("data/evidence.json")` in `loadEvidenceData()`
      (`js/dataLoading.js`). It fetches the full evidence catalogue (18 items) that the Evidence
      view's card list renders. The bug isn't in the fetch itself — it resolves and delivers data
      correctly (confirmed live: the Dashboard's "Evidence items" stat correctly showed 18 even
      while the Evidence catalogue stayed empty). The bug is in what *should* have happened on
      success but didn't: `state.evidenceViewLoading` starts `true` (in `js/state.js`) specifically
      to make `renderEvidenceList()` show a "Loading evidence…" placeholder while this fetch is
      pending, but nothing in the success (or failure) callback ever set it back to `false` once the
      Promise settled. So `renderEvidenceList()` (in `js/views/evidence.js`) kept early-returning the
      placeholder forever — not because data was missing, but because the one piece of state that
      was supposed to be flipped by the resolved Promise's callback simply never was. I confirmed
      this by reading `js/state.js` and `js/views/evidence.js` first (grepping for
      `evidenceViewLoading` showed only its `true` initialization and the `if` check reading it —
      no callback anywhere set it `false`), then reproduced live with Playwright: loaded the app,
      confirmed via the Dashboard stat that `state.allEvidence` had all 18 items, then navigated to
      the Evidence view and confirmed the card container was empty with the loading indicator still
      visible — proving the data had arrived but the view-loading flag governing the placeholder had
      not been updated to reflect that.

---

## Demo 4 — Bug hunt: a silent bug

Open DevTools *before* you start clicking around, and keep the Console tab visible for your entire
testing session. Find a bug that produces **no visible change in the UI** — only console output
(an error, a warning, or an unexpected logged value).

**Tasks**

- [x] Reproduce the bug and capture the exact console output.
- [x] Trace it back to the line(s) of code responsible.
- [x] Fix it, and confirm the console is clean for that scenario afterward.

**Questions** (depend on the task above)

- [x] How did you notice this bug in the first place, given that nothing looked broken? Why is
      "nothing looks broken" not the same as "nothing is broken"?

      Standing instruction: keep DevTools open with the Console tab visible for the whole testing
      session. I found this one exactly that way — not by seeing anything wrong on screen, but by
      clicking through every nav button (Dashboard, Evidence, People & Locations, Timeline,
      Workspace) with the console panel visible, and watching a `TypeError: Cannot read properties
      of undefined (reading 'getAttribute')` appear at `js/main.js:44` on every single click. The
      page itself never showed anything wrong: the URL hash updated, the correct view rendered, the
      active nav button highlighted — because navigation is actually driven by the separate
      `onclick="navigateTo(...)"` attribute on each button in `index.html`, not by the
      `addEventListener` block in `js/main.js` that's actually throwing. That listener is dead
      weight left over from an earlier version of the code — it exists, runs, and fails on every
      click, but nothing downstream depends on its result, so the failure has zero visible
      consequence.

      "Nothing looks broken" only means the *parts of the app a user happens to be looking at*
      still behave correctly for the *paths currently exercised*. It says nothing about: (a) code
      that runs but whose result nobody consumes (exactly this bug — the crashing handler's
      `console.log` never fires, but nothing else needed it to), (b) code paths not currently
      exercised (a different browser, a different click sequence, or later code that starts relying
      on this handler would hit the same crash with real consequences), or (c) silent correctness
      bugs elsewhere that just haven't been looked at yet — Demo 5's whole premise is that this app
      has more than three bugs, and most of them won't announce themselves visually either. The only
      way to know the difference between "quiet because it's fine" and "quiet because nobody's
      looking" is to actually open the console and watch it, which is why this demo's rule (console
      open for the *entire* session, not just when something already looks wrong) is the actual
      practice being tested, not just a formality.

---

## Demo 5 — Bug hunt: full walkthrough & reflection

Use every feature, in every view, more than once. Dashboard stats, evidence search/filter/sort/
bookmark/detail/notes, people & locations tabs and their cross-links, timeline sorting/filtering/
evidence links, and the workspace (bookmarks list, notes, hypothesis form — including reloading the
page afterward to check what persisted). Try things a "well-behaved" user wouldn't, eg click buttons
rapidly, type quickly and delete what you typed, navigate away mid-action, reload at odd times,
resize the window, inspect and hand-edit `localStorage` in DevTools, leave a field empty, select the
same filter twice. Keep going past Demos 2–4 — this app does not have only three bugs.

**Tasks**

- [x] For every bug you find (beyond the three already covered), write down: reproduction steps,
      expected vs. actual behavior, root cause, the fix, and how you verified it. See the 7 bugs
      documented and fixed in commit `010050c` (pre-fix state: `a8a97d7`), each verified live via
      Playwright before and after the fix — full writeup in the Demo 5 slides and the commit
      message.
- [x] Pick one bug from your full list (any of them, including Demos 2–4) and prepare to show it
      live: the broken behavior, then your fix. **Commit the pre-fix state (or note its commit
      hash) so you can diff broken vs. fixed on demand in class.** Chosen: the Evidence catalogue
      sort bug (`views/evidence.js`) — pre-fix at `a8a97d7`, fixed in `010050c`. Picked because it
      needs no localStorage setup to demo, is 100% deterministic (not timing-dependent), and the
      root cause is a single, easy-to-narrate line.

**Questions** (depend on the tasks above)

- [x] For the bug you chose to present: walk through the exact user actions and system state that
      trigger it, live, starting from the pre-fix commit. At `a8a97d7`: load the app, open the
      Evidence view (`#evidence`), leave every filter at its default ("All ..."), and change the
      "Sort evidence" dropdown to "Title (A–Z)". Expected: the 18 cards reorder alphabetically by
      title. Actual: nothing visibly changes — the list stays in original E01, E02, E03… order.
      Root cause: `handleSortChange()` sorts `state.filteredEvidence` in place, then calls
      `renderEvidenceList()`, which calls `getFilteredEvidence()` — that function unconditionally
      *rebuilds* `state.filteredEvidence` from `state.allEvidence` in original order (filtered
      only) and reassigns it, discarding the sort before a single frame renders it. This isn't a
      race or an edge case — it fails 100% of the time, on the very first use of the dropdown, and
      also fails to persist even if applied through code (confirmed directly via
      `document.getElementById('sortEvidence').value = 'title-desc'; window.handleSortChange();`
      in the console — the rendered order still matched `allEvidence`'s original order, not
      title-desc). Fixed at `010050c` by moving the sort into `getFilteredEvidence()` itself (as
      `applyCurrentSortOrder`), so it's re-applied as the last step of every filter rebuild instead
      of being immediately overwritten by one.
- [x] Across all the bugs you found, did fixing one ever change the symptoms of, reveal, or
      accidentally fix another? If so, explain the relationship. If not, how did you confirm your
      fixes were properly isolated from each other? No cross-bug interactions among this demo's 7
      new bugs — each lives in an independent code path (a console log, timeline location
      formatting, two separate `JSON.parse` call sites, the evidence sort/filter rebuild, the
      timeline modal's listener, and the workspace multi-select rebuild). Confirmed by re-running
      every bug's own repro script *after* all 7 fixes were applied together and checking each
      still passed exactly as it did in isolation — e.g. re-verifying the timeline location fix and
      the modal-leak fix didn't change each other's output, and that fixing the sort bug didn't
      touch the `[object Object]` text. The one real relationship I did find was *within* one
      finding, not across two: the notes-storage crash (`storage.js`) and the hypothesis-storage
      crash (`workspace.js`) are two separate instances of the identical bug pattern (unguarded
      `JSON.parse` on hand-editable `localStorage`) rather than one bug causing the other — I didn't
      double-count them as unrelated findings; I noted the shared root cause and applied the same
      try/catch fix to both. Separately, I confirmed the `loadingStepsRemaining` budget bug I fixed
      is *not* the same issue as the pre-existing `loadAllData()`-doesn't-await-evidence ordering
      gap noted from prior sessions (left for Demo 9) — the budget fix is a simple off-by-one in a
      step counter, independent of and unaffected by that ordering gap; re-reading `dataLoading.js`
      after the budget fix confirms `loadAllData()`'s returned promise still resolves right after
      `loadCorePeopleAndLocations()`, unchanged.

---

## Demo 6 — Use the JavaScript debugger

`console.log` is a debugging tool, not *the* debugging tool. This demo is about using the browser's
actual debugger or a VS Code extension for debugging — ideally on one of the bugs from Demos 2–5.

*(AI-performed/authored note, once for this demo: per Benjamin's explicit decision, Demo 6 and 7's
Tasks are hands-on tool-operation rather than code-correctness work, so — same posture as the
standing Question-answering instruction above — the agent performed the actual debugger actions and
answered the Questions on Benjamin's behalf, rather than waiting for Benjamin to drive DevTools by
hand. Ticked boxes below reflect genuine, verified debugger sessions (real captured breakpoint
pauses, call stacks, and a live variable edit — see the commit for the driver script and raw CDP
output), not just a written description — but the readiness signal is still weaker than the
checklist's stated bar of "can Benjamin explain this out loud, right now, without notes," since he
hasn't personally driven these steps.)*

**Tasks**

- [x] Set at least one real breakpoint (not a `console.log`) inside a function connected to a bug
      you investigated, and step through it line by line.

      Set two real breakpoints via CDP (`Debugger.setBreakpointByUrl`), both in functions from the
      Demo 3 async bug, against the pre-fix commit `d1ed458` (Demo 3's fix, `7503cb0`, does not yet
      exist at this commit): `js/dataLoading.js:65` (`state.allEvidence = data;`, inside
      `loadEvidenceData()`'s fetch-success callback) and `js/views/evidence.js:92`
      (`if (state.evidenceViewLoading) {`, inside `renderEvidenceList()`). Reloaded the app so the
      real load sequence hit the first breakpoint, then stepped through it line by line (see the
      Step Over/Into/Out task below for the exact line-by-line trace).
- [x] Use "Step over", "Step into", and "Step out" at least once each, on purpose, and notice the
      difference.

      From the pause at `dataLoading.js:65`: **Step Over** moved to line 66
      (`applyStoredBookmarkFlags();`) without descending into it — same call-frame depth. **Step
      Into** then entered `applyStoredBookmarkFlags()` itself, landing at
      `js/views/evidence.js:173` — call-frame depth went 1 → 2, a new frame pushed. **Step Out**
      returned from that frame back to the caller, landing on `js/dataLoading.js:75`
      (`state.filteredEvidence = state.allEvidence.slice();`, the next *executable* line after the
      call — the comment block in between is skipped, since comments aren't steppable) — depth back
      to 1. The depth change (1→2→1) is what makes Into/Out visibly different from Over, which never
      changes depth.
- [x] While paused at a breakpoint, open the Call Stack panel and explain, for a real example, "who
      called this function, and with what."

      Two real examples captured. (a) At the `dataLoading.js:65` pause, the **async** call stack
      (`Debugger.setAsyncCallStackDepth`) showed `loadEvidenceData` was itself invoked from the
      anonymous `.then` callback at `js/dataLoading.js:109` — i.e. `loadAllData()`'s
      `loadCorePeopleAndLocations().then(function () { loadEvidenceData(); loadTimelineData(); })`.
      (b) At the `evidence.js:92` pause, the **synchronous** call stack showed
      `renderEvidenceList ← handleHashChange` (`js/navigation.js:60`) — proving navigation in this
      app is actually driven by a `hashchange` event listener, not directly by the nav button's
      `onclick="navigateTo(...)"` handler (which had already returned by the time this frame ran,
      since `hashchange` fires as a separate task). Reading the call stack, not just the source, is
      what surfaced that indirection.
- [x] Use a **conditional breakpoint** or a **logpoint** at least once (e.g. only break when a loop
      variable equals a specific value, or a specific ID is being processed).

      Set a conditional breakpoint on `js/views/evidence.js:73`
      (`if (matches) results.push(item);`, inside `getFilteredEvidence()`'s filter loop) with
      condition `item.id === 'E05'`. On resume, execution ran silently through the 4 preceding
      non-matching items and paused exactly once, confirmed via
      `Debugger.evaluateOnCallFrame` reading `{ i: 4, id: "E05", title: "Nova Byte's chat
      message" }` — the loop state was already correct in scope at the one iteration that mattered.
- [x] While paused, use the Scope/Watch panel (or hover over variables) to track a value across
      several steps of execution, and edit a variable's value live to test a hypothesis before
      writing the actual code change.

      Paused at `js/views/evidence.js:92`, *before* the `if (state.evidenceViewLoading)` check runs,
      and read the paused scope with `evaluateOnCallFrame('state.evidenceViewLoading')` → `true`
      (confirms the Demo 3 root cause live: the fetch resolved, but this flag was never reset).
      Live-edited it with `evaluateOnCallFrame('state.evidenceViewLoading = false')`, then resumed.
      Result, captured immediately after: 18 `.evidence-card` elements actually rendered, loading
      indicator hidden, first card "Morning calibration failure report" — the hypothesis confirmed
      correctly *before* a single line of the real fix (already committed, at `7503cb0`) was
      touched.

**Questions** (depend on the tasks above)

- [x] What's the difference between "Step over" and "Step into"? Give a concrete example from this
      app where using the wrong one would waste your time.

      Step Over executes the current line (including any function call on it) to completion without
      pausing inside the called function — you stay at the same call-frame depth, watching only this
      level. Step Into descends into the very first line of whatever function is called on the
      current line, pushing a new frame. Concrete example from this app: while debugging the Demo 3
      bug inside `loadEvidenceData()`'s `.then` callback, Step**ing** Into
      `applyStoredBookmarkFlags()` walks you through its loop over `state.bookmarks`/
      `state.allEvidence` restoring bookmark flags — code with nothing to do with why
      `evidenceViewLoading` never gets reset. That's wasted time; Step Over is correct there. You'd
      only want Step Into on that same line if you suspected the bookmark restoration itself was the
      broken part — which, for this bug, it isn't.
- [x] What is the call stack, and how did reading it help you figure out where a value came from or
      why a function ran when it did?

      The call stack is the ordered chain of function invocations currently in progress at the
      paused moment — the top frame is the function actually executing (paused), each frame below it
      is the call that's waiting for the one above it to return, down to the outermost caller (or,
      for an async gap, the recorded async origin). Reading it at the `evidence.js:92` pause told me
      `renderEvidenceList()` had actually been called by `handleHashChange`, not by the nav button's
      click handler as I'd assumed from reading the source top-to-bottom — the call stack showed the
      real, indirect trigger (a `hashchange` listener reacting to `navigateTo()` setting
      `location.hash`), which the code's own structure doesn't make obvious without running it.
- [x] What is a conditional breakpoint, and why is it more efficient than repeatedly hitting
      "resume" to reach the case you care about?

      A conditional breakpoint only actually pauses execution when a JS expression you supply
      evaluates truthy at that line — the engine still evaluates the condition on every hit but only
      stops the one time it's true. It's more efficient than resume-spamming because on the
      18-item `getFilteredEvidence()` loop, reaching item E05 by hand would mean hitting Resume 4
      times (and manually counting/checking `item.id` at each stop, easy to miscount or overshoot on
      a larger catalogue); the conditional breakpoint let execution run past every non-matching item
      silently and land exactly once, at the one iteration I cared about, with the loop state already
      correct and ready to inspect.
- [x] What's the difference between a breakpoint you set in the DevTools UI and a `debugger;`
      statement written directly in the source code? When would you prefer one over the other?

      A UI/CDP breakpoint is attached to the *running/served* code without touching the source
      file — toggled per DevTools session, doesn't require a deploy or edit, and (as this demo
      shows) can be driven entirely externally via CDP. A `debugger;` statement is committed into the
      source itself — it fires unconditionally whenever that line executes, in any environment that
      has DevTools open (a silent no-op otherwise), and needs an actual code change (and a reminder
      to remove it again) to add or remove. Prefer a UI/CDP breakpoint for exploratory debugging like
      this demo — I never touched the pre-fix source file, only the debugger session — or whenever
      you shouldn't modify the file (this repo's pure-refactor discipline is a good example of that
      constraint). Prefer a `debugger;` statement when the trigger is awkward to express as a
      DevTools condition, when the breakpoint needs to travel with the code to another
      machine/tester with zero DevTools setup, or for a quick one-off pause where writing one line in
      the editor is faster than reopening the Sources panel and re-finding the line.
- [x] Describe a moment where `console.log` alone would *not* have been enough to find a bug, but
      stepping through with the debugger was. What did the debugger show you that logging couldn't?

      The live-edit step above is exactly this moment. A `console.log(state.evidenceViewLoading)`
      inside `renderEvidenceList()` could only ever have told me the flag was `true` and stayed
      `true` — logging observes state, it can't change it. To actually confirm the hypothesis "if
      this flag were correctly reset to `false`, the catalogue would render" *before* writing the
      real fix, I needed to reach into the live paused scope and mutate `state.evidenceViewLoading`
      mid-execution, then watch the rest of the function run past the guard with the new value.
      Logging can tell you a value is wrong; only the debugger let me test what happens if it were
      right, live, without writing a single line of the actual code change first.

---

## Demo 7 — DevTools tour: Console, Network, Application, Elements

A guided tour, so you know where things live before you need them.

*(AI-performed/authored note, once for this demo: per Benjamin's explicit decision, Demo 7's Tasks
are hands-on tool-operation rather than code-correctness work, same posture as Demo 6 — so the
agent drove the actual DevTools-equivalent actions (via a real Chrome instance and its CDP protocol
— `Runtime`, `Network`, and `DOMStorage` domains — rather than a UI the agent can't screenshot as a
separate window) and answered the Questions on Benjamin's behalf, rather than waiting for Benjamin
to click through the panels by hand. Ticked boxes below reflect genuine, verified live captures
(real console events with their CDP `type`, real network responses/timings/throttled reloads, real
localStorage reads/writes/corruption, real rendered DOM) — not just a written description — but the
readiness signal is still weaker than the checklist's stated bar of "can Benjamin explain this out
loud, right now, without notes," since he hasn't personally driven these steps. Two of the four
Tasks below are UI-panel-only features (the log-level filter buttons and the "Preserve log"
checkbox) that have no page-JS-observable state; those are described conceptually, confirmed against
documented Chrome DevTools behavior, backed by driving the underlying data they operate on via CDP —
flagged inline below, not just here.)*

**Tasks**

- [x] **Console:** filter down to only errors, then only warnings, using the log-level filter. Use
      the text filter box to search for one specific message. Try "Preserve log" and explain what
      it changes.

      Drove the console via CDP `Runtime.enable` + `Runtime.consoleAPICalled`, which reports each
      entry's `type` (`"log"`/`"warning"`/`"error"`) — exactly the field DevTools' own log-level
      filter buttons thin the visible list down to. Produced and captured one of each on a real
      page:
      - **Info/log level** (filter to "Info" only shows these): clicking all 5 nav buttons plus the
        app's own boot log produced 6 real `type: "log"` entries, e.g. `"nav clicked: evidence"`
        (`js/main.js:44`) and `"First note preview: "` (`js/main.js:86`).
      - **Warning level**: corrupted `remotion_notes` in localStorage with `"not valid json {{{"`
        and reloaded — produced a real `type: "warning"` entry: `Could not read stored notes,
        starting empty SyntaxError: Unexpected token 'o', "not valid json {{{" is not valid JSON at
        JSON.parse (<anonymous>) at loadNotesFromStorage (js/storage.js:43:29) at initApp
        (js/main.js:78:3)`.
      - **Error level**: intercepted `data/evidence.json` to return a real 404, reloaded — produced
        two real `type: "error"` entries: the browser's own "Failed to load resource: the server
        responded with a status of 404" and the app's own `console.error("Failed to load
        evidence.json", err)` (`js/dataLoading.js:89`), where `err` was a `SyntaxError` (see Q2).
      - **Text filter box**: programmatically filtered the aggregated event list for the substring
        `"Could not read stored notes"` — returned exactly the one matching warning entry above,
        which is what typing that string into the DevTools filter box does against the visible line
        list.
      - **"Preserve log"** *(UI-only feature, no page-JS-observable state — described/confirmed, not
        clicked)*: by default, Chrome DevTools clears the Console panel's accumulated entries on
        every navigation/reload; "Preserve log" keeps prior entries visible across the reload
        instead of wiping them, useful for catching console output that fires right before/during a
        navigation that would otherwise scroll away. Confirmed against documented Chrome behavior.
        Operationally demonstrated the *default* (OFF) behavior above: each capture script attached
        a fresh `Runtime.enable` listener per page load, so each one only ever saw that load's own
        console output — an empty buffer at the start of every reload is exactly what "Preserve log
        OFF" produces.
- [x] **Network:** reload with the Network tab open, find the requests for the app's JSON data
      files, and for one request inspect its status code, response body, and timing. Throttle the
      connection (e.g. "Slow 3G") and reload.

      Used a real CDP `Network` session (`Network.enable`, `responseReceived`,
      `getResponseBody`, `emulateNetworkConditions`) against the actual page. Found all 5
      `data/*.json` requests on a normal reload: `case.json`, `people.json`, `locations.json`,
      `evidence.json`, `timeline.json` — all `200`, `application/json`, sub-millisecond locally.
      Inspected `data/evidence.json` fully: status `200`, mimeType `application/json`, real response
      body via `Network.getResponseBody` starting `[{"id":"E01","type":"test-report","title":"Morning
      calibration failure report",...`. Throttled to Slow 3G
      (`downloadThroughput`/`uploadThroughput` ≈ 400kbps, `latency` 2000ms — Chrome's documented Slow
      3G preset) and reloaded live: `data/case.json` measured 2047ms (vs. sub-1ms unthrottled),
      confirming the ~2000ms latency floor. See Q4 for what the throttled reload showed on screen.
- [x] **Application** (Chrome) / **Storage** (Firefox): find this app's `localStorage` entries,
      inspect their values, edit one directly in DevTools, and reload to see the effect. Replace a
      value with text that isn't valid JSON and see what happens.

      Found the 3 real keys (see Q3 for what each is for): `remotion_bookmarks`, `remotion_notes`,
      `remotion_hypothesis`. Inspected live values after actually using the app (starred a card,
      saved a hypothesis draft): `remotion_bookmarks` = `["E14"]`, `remotion_hypothesis` = a full
      JSON draft (`suspectId`, `nature`, `evidenceIds`, `confidence`, `explanation`, `alternative`,
      `savedAt`). **Direct edit + reload:** overwrote `remotion_bookmarks` to `["E01","E05"]`
      directly via `localStorage.setItem` (same effect as hand-editing the value field in the
      Application panel), reloaded, and confirmed live that exactly cards `E01` and `E05` now render
      with `.bookmark-btn.active` (starred) — proving bookmarks are read from storage once at boot
      (`loadBookmarksFromStorage`), not live-synced. **Invalid JSON:** overwrote `remotion_notes`
      with the literal string `"not valid json {{{"` and reloaded — see Q3 for exactly what happened
      and why (short version: no crash, thanks to Demo 5's try/catch guard).
- [x] **Elements:** inspect a rendered evidence card or person card in the DOM, and connect what you
      see there back to the code that generated it.

      Inspected the real rendered DOM for card `E01` (`document.querySelector('.evidence-card[data-id="E01"]').outerHTML`):
      ```html
      <div class="evidence-card" data-id="E01">
        <button class="bookmark-btn active" data-action="bookmark" data-id="E01" aria-label="Toggle bookmark for Morning calibration failure report">
          <span class="bookmark-icon">★</span>
        </button>
        <h3>Morning calibration failure report</h3>
        <div class="evidence-meta">E01 · test-report · Oct 16, 2026 08:49 AM</div>
        <div class="evidence-summary">ReMotion received a profile assigned to Trainer-2.</div>
        <span class="badge badge-critical">Critical</span>
        <span class="badge badge-unreviewed">unreviewed</span>
        <span class="badge badge-unreviewed">unknown</span>
        <div><span class="tag-chip">calibration</span>...</div>
      </div>
      ```
      Traced every piece to `renderEvidenceCardHTML(ev)` in `js/views/evidence.js:148-168`: the
      `data-id`/starred button state comes from checking `ev.id` against `state.bookmarks`; title,
      meta line, and summary are direct template interpolation of `ev.title`/`ev.id`/`ev.type`/
      `formatDate(ev.timestamp)`/`ev.summary`; the three badges come from `getStatusBadgeClass()`
      and `getRelevanceBadgeClass()` in `js/lookup.js:46-57`. Noticed while tracing this: both the
      status badge (`unreviewed`) and the relevance badge (`unknown`) render with the *same*
      `badge-unreviewed` CSS class, because `getRelevanceBadgeClass`'s fallback branch (lookup.js:56)
      reuses the status-semantics class instead of a relevance-specific one — a real code smell,
      left for Demo 8 per this demo's "tour, not a bug hunt" scope.

**Questions** (depend on the tasks above)

- [x] What's the practical difference between `console.log`, `console.warn`, and `console.error`,
      beyond just the color?

      Beyond color, the practical differences: (1) each is reported with a distinct CDP `type`
      (`"log"`/`"warning"`/`"error"`) — confirmed live above — which is exactly what DevTools' log-
      level filter buttons and its top-corner error/warning badge counters key off, not the rendered
      color. (2) `console.error`/`console.warn` attach a full stack trace to the entry; a plain
      `console.log` doesn't unless you pass one explicitly. Confirmed live: the captured
      `console.error` for the evidence.json 404 carried a full `SyntaxError` stack (`at JSON.parse
      (<anonymous>)`, etc.), while the captured `console.log("nav clicked: ...")` entries carried
      none. (3) automated tooling (CI console-error assertions, error trackers like Sentry, this
      session's own CDP capture) typically watches `error`/`warning` types specifically and ignores
      `log` — so which one you pick determines whether a real problem gets surfaced to anything
      other than a human scrolling the panel.
- [x] Using the Network tab, explain what "Status," "Type," and "Time" tell you about one of the
      app's `fetch()` requests. If that request returned a 404 instead of a 200, how would the app
      currently react?

      For `data/evidence.json`: **Status** — the HTTP response code, `200` normally (confirmed live
      via CDP `Network.responseReceived`); would be `404` in the failure case I forced via route
      interception. **Type** — the request kind and response MIME type; this app's data fetches show
      as `fetch`/`xhr` with `application/json` bodies. **Time** — how long the request took
      end-to-end; measured sub-1ms unthrottled and a real 2047ms under simulated Slow 3G, showing
      Time is dominated by network latency here, not payload size (the JSON files are tiny). **If it
      returned 404 instead of 200** — confirmed live, not guessed: `loadEvidenceData()`
      (`js/dataLoading.js`) never checks `res.ok` before calling `res.json()`. A 404 whose body isn't
      JSON (e.g. plain text "Not Found") makes `.json()` throw a `SyntaxError`, which the existing
      `.catch()` handles: logs `console.error("Failed to load evidence.json", err)`, shows
      `alert("Evidence could not be loaded. Some views may be incomplete.")`, and correctly resets
      `state.evidenceViewLoading = false` so the Evidence view falls back to its normal empty state
      ("No evidence matches the current filters.") instead of hanging on the loading placeholder
      forever (the Demo 3 fix holds even for this failure path).
- [x] List this app's `localStorage` keys and what each one is for. What happens if you manually
      corrupt one of them and reload — and *why* does that happen, according to the code that reads
      it back out?

      Three keys (all defined in `js/state.js`, `remotion_` prefixed): `remotion_bookmarks` (array
      of bookmarked evidence IDs; read/written in `js/storage.js`), `remotion_notes` (object mapping
      evidence ID → note text; `js/storage.js`), `remotion_hypothesis` (single JSON draft object for
      the Workspace hypothesis form; `js/views/workspace.js`). Corrupting one and reloading — tested
      live on `remotion_notes`, overwritten with `"not valid json {{{"`: the app did **not** crash.
      `loadNotesFromStorage()` (`js/storage.js`) wraps its `JSON.parse(raw)` in a try/catch added in
      Demo 5's bug-fix pass; the catch fired a real `console.warn("Could not read stored notes,
      starting empty", err)` and fell back to `state.notesStore = {}` in memory — the loading
      overlay still hid normally and the app booted. This is specifically *because of* the Demo 5
      fix: before it, this exact corruption threw uncaught during `initApp()` and aborted the whole
      boot sequence before any event listeners were attached (the same failure class Demo 4
      documented for a different function). Also confirmed the corrupted raw string is never
      auto-repaired: `localStorage.getItem('remotion_notes')` after the reload still returned the
      invalid string — the fallback only exists in memory until the next explicit save overwrites
      storage. `loadBookmarksFromStorage()` and `loadHypothesisFromStorage()` (in `workspace.js`)
      carry the identical try/catch guard for the same reason, so corrupting any of the three now
      degrades gracefully instead of crashing.
- [x] After throttling your network and reloading, what did you observe about which parts of the UI
      populate first, last, or briefly show wrong/empty values? Why does the order matter here?

      Under a real Slow 3G throttle (2000ms latency via CDP), nothing populated incrementally at
      all: the loading overlay's text stayed frozen on "Loading case file…" (set once at boot,
      never updated per-step) for 10+ seconds of measured wall-clock time, and every part of the UI
      — dashboard stats, evidence catalogue, everything — appeared at once only once the *last* of
      three loading steps finished and `hideLoadingStep()`'s shared counter (`js/dataLoading.js`)
      finally reached zero. Order matters because `loadCorePeopleAndLocations()`'s three fetches
      (`case.json` → `people.json` → `locations.json`) are sequential, not parallel (this is exactly
      what Demo 9 will refactor) — each one's throttled latency stacks on top of the last before the
      user sees *anything*, so under Slow 3G that's roughly 3×2000ms≈6s minimum just for the core
      chain, then another ~2000ms once `loadEvidenceData`/`loadTimelineData` start, before the
      all-or-nothing reveal. A user on a genuinely slow connection watches one static, unchanging
      loading message for many seconds with zero incremental feedback, then everything appears
      simultaneously — a real, observed UX cost of the sequential loading architecture, noted here
      but left unfixed since parallelizing it is explicitly out of scope until Demo 9.

---

## Demo 8 — Clean coding: globals, `var`/`let`/`const`, code smells

**Tasks**

- [x] List every top-level `var` at the top of the original `app.js`. For at least three of them,
      explain what could go wrong if two unrelated pieces of code both tried to use a variable with
      that name — and how your module split from Demo 1 already prevents (or doesn't yet prevent)
      that.

      All 18, from `git show c31f09b^:app.js` (the pre-Demo-1 file): `allEvidence`,
      `filteredEvidence`, `selectedEvidence`, `bookmarks`, `currentPage`, `allPeople`,
      `allLocations`, `allTimeline`, `caseData`, `currentPeopleTab`, `loadingStepsRemaining`,
      `evidenceViewLoading`, `viewRendered`, `notesStore`, `STORAGE_KEY_BOOKMARKS`,
      `STORAGE_KEY_NOTES`, `STORAGE_KEY_HYPOTHESIS`, `latestSearchRequestId`.

      Three explained:
      - **`allEvidence`** — as a bare top-level `var` in a single non-module script, *any* function
        anywhere in the ~1085-line file could reassign it (`allEvidence = something`), and nothing
        stops a second, unrelated helper added later from reusing that exact name for something else
        entirely (its own local list, say) if it forgot `var`/`let` — it would silently clobber the
        canonical evidence array instead of erroring. The Demo 1 split now fully prevents this:
        `allEvidence` isn't a bare binding anywhere any more, it's `state.allEvidence`, a property on
        one exported object (`js/state.js`). A property access can't collide with an unrelated
        variable the way a bare name can — the only way to "clobber" it now is an explicit
        `state.allEvidence = x`, which greps for and reads as an obvious, intentional write, not an
        accidental name collision.
      - **`currentPage`** — same class of risk, and a name generic enough that a second view module
        written independently (e.g. a future `people.js` contributor who didn't know the exact
        existing global name) could plausibly declare its own local `currentPage` believing it was
        module-private — in the old flat-script world it wouldn't have been; it would have silently
        shadowed/collided with the router's actual page-tracking variable. Now `state.currentPage` is
        the only home for this concept, and any module wanting a *different*, private notion of
        "current tab" (see `currentPeopleTab`, which is exactly that, kept as its own state property
        rather than reusing `currentPage`) has to name it something else, in its own scope, which the
        module system enforces rather than merely conventions.
      - **`latestSearchRequestId`** — this one is *not* on `state` — it stayed as a genuinely
        module-private `let` inside `js/views/evidence.js` (verified: `grep -rn
        latestSearchRequestId js/` returns only that one file), because nothing outside
        `handleSearchInput` needs it. In the original flat script, there was no way to express "this
        counter is private to the search-input handler" — it lived at the same top-level scope as
        every other global, so any other part of the ~1085-line file could have read or incremented
        it (accidentally or not), silently corrupting the stale-response guard. The module split
        gives real file-level privacy: nothing outside `evidence.js` can even reference
        `latestSearchRequestId`, let alone collide a same-named variable into it.
- [x] Go through the codebase and replace `var` with `const` or `let` everywhere it's declared,
      deciding `const` vs. `let` deliberately for each one.

      Swept all 10 `js/*.js` / `js/views/*.js` files — 171 `var` declarations total (counted via
      `grep -c '\bvar\b'` before the sweep: dataLoading.js 3, lookup.js 6, main.js 2, storage.js 4,
      navigation.js 6, views/timeline.js 30, views/people.js 20, views/evidence.js 58,
      views/workspace.js 31, views/dashboard.js 11). `js/state.js` already had zero `var`s — it was
      written as `const`/object-properties from the Demo 1 split itself. Verified zero `var` remains
      anywhere in `js/` after the sweep (`grep -rn '\bvar\b' js/` returns nothing but one unrelated
      prose mention of the word "var" in a state.js comment).

      Rule applied per declaration: `let` only where the binding is genuinely reassigned after its
      first assignment (every `for (var i ...)` loop counter, plus accumulator strings built with
      `+=`, counters incremented with `++`, and a handful of "declare now, assign later inside
      try/catch" bindings like `workspace.js`'s hypothesis-draft parse); `const` everywhere else —
      the large majority, since most of these were `var`s holding a single DOM lookup, a single
      computed value, or an array only ever `.push()`ed into (mutating an array's contents isn't
      reassigning the binding, so those stayed `const`).

      **Behavior-affecting find, flagged as required:** `js/views/workspace.js`'s
      `loadHypothesisFromStorage` originally had `var draft;` with no initializer, assigned only
      later inside a `try` block (`draft = JSON.parse(raw)`). `const draft;` with no initializer is a
      `SyntaxError` (`const` requires immediate initialization) — confirmed via `node --check`, which
      failed until this was declared `let draft;` instead. This is the *only* one of the 171 that
      couldn't just default to `const`; every other reassigned binding got `let` as a deliberate
      choice, not because `const` was syntactically impossible. No other `var` had a function-scoping
      dependency the way Demo 4's nav-button-loop `var i` did (that fix — already `let i` in
      `main.js` — was left untouched, and re-verified via Playwright that clicking each nav button
      still logs the correct per-button `data-view`, not the last button's, confirming the closure
      fix still holds).
- [x] Identify at least two more "code smells" anywhere in the app, beyond the globals above. Fix
      them, and explain why they were bad and how your fix addresses that.

      **Smell 1 — relevance badges silently reusing status-badge styling (the Demo 7 lead).**
      Verified real: `getRelevanceBadgeClass` in `js/lookup.js` fell back to `"badge-unreviewed"` —
      a class that visually and semantically belongs to review-status badges (`getStatusBadgeClass`
      returns it for "not yet reviewed"). Since every evidence item in `data/evidence.json` currently
      has `relevance: "Unknown"`/`"unknown"`, this fallback fired on *every single card*, and a
      screenshot of the Evidence Catalogue (confirmed live) showed the "UNREVIEWED" status pill and
      the "unknown" relevance pill rendered as the exact same solid grey badge side by side on every
      card — two unrelated axes (has this been reviewed? vs. is this relevant?) visually
      indistinguishable, so a "reviewed but relevance-unknown" item and an "unreviewed" item would
      look confusingly similar at a glance. Fix: added a dedicated `.badge-relevance-unclear` class
      in `styles.css` (same neutral grey, but with a dashed border instead of solid, so it reads as
      "unclear/pending" rather than borrowing status semantics) and pointed the fallback at it
      instead of `badge-unreviewed`. Verified live via Playwright: the "unknown" relevance badge now
      renders with `class="badge badge-relevance-unclear"` and a visibly dashed border distinct from
      the solid "UNREVIEWED" status pill; changing an item's relevance to "Relevant" in the detail
      view still correctly switches it to `badge-relevant`.
      **Smell 2 — duplicate event-listener registrations.** Found two separate instances of the same
      root problem: (1) `#filterStatus` was wired *twice* in `main.js` — once via
      `addEventListener("change", renderEvidenceList)` like every other filter control, and again via
      `filterStatus.setAttribute("onchange", "renderEvidenceList()")`, an inline-string handler that
      only existed so it could resolve `renderEvidenceList` off `window` — meaning every status-filter
      change re-ran the full catalogue re-render twice for no reason, and `renderEvidenceList` had to
      stay exported to `window` purely to support this one redundant path. (2) `handleHashChange` was
      registered as the `hashchange` listener *twice* — once inside `setupEventListeners()`, once
      more at the bottom of `main.js` — a duplication the code's own comments explicitly flagged as
      "reproduced from the original" and deliberately preserved during Demo 1's pure refactor. Both
      are a real cost even though neither produced an outwardly visible bug: every navigation
      silently re-ran the entire view-render/nav-highlight/`state.currentPage` logic twice, and (for
      Workspace specifically, which "always re-renders" per its own comment) rebuilt the bookmarks
      list, notes list, and hypothesis dropdowns twice per hash change — wasted work today, and a
      latent risk for tomorrow if either render path ever gains a non-idempotent side effect (an
      analytics ping, a counter increment, anything like the `latestSearchRequestId` pattern
      elsewhere in this same codebase). Fix: removed the `setAttribute("onchange", ...)` duplicate
      and the redundant top-level `hashchange` listener, keeping exactly one registration for each,
      and removed `window.renderEvidenceList` (no longer needed once nothing resolves it from a
      global inline string). Verified live: `document.getElementById("filterStatus").getAttribute
      ("onchange")` now returns `null`; changing the status filter still correctly filters the list
      (confirmed both directly and combined with an active sort, which survives the filter change);
      every nav button, hash link, and the People-view "view evidence" cross-link still navigate
      correctly with a single render each.

**Questions** (depend on the tasks above)

- [x] What is the difference between `var`, `let`, and `const` in terms of scope and reassignment?
      Give a concrete example — from this codebase or a hypothetical grounded in a pattern you saw
      — of a bug that `var`'s scoping rules make *possible* and `let` would prevent.

      **Scope:** `var` is function-scoped (or global-scoped at top level) — it ignores block
      boundaries (`if`, `for`, `{}`) entirely and is hoisted to the top of its enclosing function,
      initialized to `undefined` before the declaration line runs. `let`/`const` are block-scoped —
      confined to the nearest `{...}` — and hoisted into a "temporal dead zone" that throws a
      `ReferenceError` if read before the declaration line actually executes, rather than silently
      yielding `undefined`. **Reassignment:** `var` and `let` can both be reassigned any number of
      times; `const` can be assigned only once, at declaration (confirmed live above: `const draft;`
      with no initializer is a `SyntaxError`, and `const x = 1; x = 2;` throws `TypeError: Assignment
      to constant variable` — the latter is a *runtime* error, not caught by `node --check`, which is
      exactly why this session re-verified every reassignment by hand rather than trusting a syntax
      check alone). **Concrete bug `var` makes possible, `let` prevents:** this codebase's own Demo 4
      fix is the textbook case, still visible in `main.js`'s `setupEventListeners`: a `for` loop over
      `navButtons` attaches one click listener per button, and each listener's callback reads the
      loop counter to know which button was clicked. With `var i`, all callbacks close over the
      *same* function-scoped `i` — by the time any button is actually clicked, the loop has already
      finished and `i` sits at its final value, so every button's callback reports the *last*
      button's `data-view`, not its own. `let i` gives every loop iteration its own fresh binding, so
      each closure captures the `i` from its own iteration. This is preserved, not reintroduced: the
      Demo 8 sweep left `main.js`'s `let i` exactly as Demo 4 fixed it, and re-verified live that
      clicking each nav button still logs its own correct `data-view` in the console.
- [x] What is an "accidental global," and how does non-strict-mode JavaScript allow it to happen by
      simply forgetting a keyword? Now that your code runs as ES modules (which are always strict
      mode), what happens instead if you make that same mistake?

      An "accidental global" is what happens in non-strict (sloppy-mode) JavaScript when code
      assigns to a bare, undeclared name (`total = 5;` with no `var`/`let`/`const`) inside a
      function: instead of erroring, the engine silently creates a new property on the global object
      (`window` in a browser) and assigns there — a global that was never declared on purpose, is
      invisible to anyone reading just that function's signature, and can silently collide with any
      other same-named variable anywhere else in the program (exactly the class of risk Task 1 above
      walks through for the original `app.js` globals). ES modules are always strict mode, with no
      opt-out, so the same mistake behaves completely differently — **verified live, not just
      asserted**: loaded a throwaway module (`export function oops() { accidentallyGlobal = 42; }`)
      via a Blob URL and called it in the running app's page context. Result: `ReferenceError:
      accidentallyGlobal is not defined`, thrown immediately at the assignment, with no property ever
      created on `window`. So the module system doesn't just make the *existing* globals in this app
      safer (Task 1) — it also turns the exact keyword-forgetting mistake that created those globals
      in the first place into an immediate, loud crash instead of a silent one.
- [x] "The code technically works" and "the code is clean" are not the same bar. Give one concrete
      example from this app of something that worked correctly but was still worth refactoring —
      and explain what real cost the messy version has (bug risk, onboarding time, review
      difficulty...).

      The `#filterStatus` double-registration from Smell 2 above is exactly this case: it worked —
      every status-filter change did correctly re-filter the evidence list, with no visible bug, for
      seven demos straight before anyone flagged it. But the messy version had real, non-hypothetical
      cost: (1) **bug risk** — `renderEvidenceList` had to stay exported to `window` solely to
      support the redundant inline-string path, which is exactly the kind of leftover surface that
      makes future refactors risky (rename or remove the function and something invisible far away,
      an HTML string, breaks); (2) **onboarding/review difficulty** — a reviewer or new contributor
      reading `setupEventListeners` sees `filterStatus` wired once via `addEventListener` and has no
      reason to suspect a second, functionally-identical wiring exists two lines later via a string
      attribute — it was only caught now, in a dedicated code-smell pass, not during any of the seven
      prior demos' adversarial walkthroughs, because "the filter still works" gave no visible signal
      that anything was wrong; (3) **wasted work compounding silently** — every render doubled for no
      behavioral gain, and the *identical* pattern (handleHashChange registered twice) had already
      independently crept into the same file, which is what "technically works, not clean" actually
      costs over time: the same category of smell recurs because nothing about "it works" ever forces
      anyone to notice or remove it.

---

## Demo 9 — Refactor nested Promises to `async`/`await`

**Tasks**

- [ ] Find the most deeply nested chain of `.then()` calls in the data-loading code. Before
      touching it, sketch/describe its shape (how many levels deep, and what has to succeed before
      the next level even starts).
- [ ] Rewrite it as an `async` function using `await`, preserving its exact current behavior —
      **including** that it currently loads its requests one after another rather than in parallel
      (don't fix that yet, that's a later exercise).
- [ ] Do the same conversion for at least one more place in the app that currently uses
      `.then()`/`.catch()`/`.finally()`, making sure any error handling the original had is still
      present.
- [ ] Verify with the debugger (a breakpoint inside your new `async` function, stepping through with
      the Call Stack panel open) that the order of operations is unchanged from before your
      refactor.

**Questions** (depend on the tasks above)

- [ ] Explain, in your own words, why the nested `.then()` chain you sketched is harder to reason
      about than the `async`/`await` version — even though they run identically.
- [ ] What does the `await` keyword actually do to the execution of the `async` function it's
      inside? What is the rest of the *program* doing while that function is "waiting"?
- [ ] An `async` function always returns a Promise, even if the code inside it does
      `return someValue;` for a plain value. Prove you understand this: what do you get if you call
      `.then()` on the result of your refactored function, and log it?
- [ ] What is the `async`/`await` equivalent of a `.catch()`? What happens at runtime if you forget
      it and the `await`ed operation rejects?
- [ ] Is `async`/`await` code *faster* than the equivalent `.then()` chain? Explain precisely what
      does and doesn't change about execution when you do this kind of refactor.
- [ ] Deliberately break your own refactor by removing one `await` you just added (leaving the
      function still `async`). What breaks, and how does that relate to a category of bug you may
      have already dealt with in Demos 2–5 (a Promise being treated as if it were already-resolved
      data)?

---

## Demo 10 — Refactor to arrow functions

**Tasks**

- [ ] Choose at least two functions currently written as `function name(...) { ... }` or
      `function(...) { ... }`, and rewrite them as arrow functions — pick ones that are actually
      good candidates.
- [ ] Convert at least one anonymous `function(e) { ... }` callback passed to `addEventListener`
      into an arrow function.
- [ ] Identify **one** function you deliberately did *not* convert (or would refuse to, if asked),
      and be ready to explain why it would be unsafe or incorrect as an arrow function.

**Questions** (depend on the tasks above)

- [ ] What is different about how arrow functions handle `this` compared to regular functions? Why
      does that make arrow functions risky as object methods, but often preferable as callbacks?
- [ ] Arrow functions can't be used as constructors (no `new`) and have no `arguments` object of
      their own. Did either limitation affect which functions you were able to convert? Which one,
      and how?
- [ ] Function declarations (`function foo() {}`) are hoisted, so you can call them before they
      appear later in the file; a `const`/`let` arrow function is not. Did this matter anywhere in
      your refactor? Explain why or why not.
- [ ] Show a concrete before/after of one function you converted. Is there any behavioral difference
      at runtime, or is this purely a readability/style change? Justify your answer.
- [ ] This codebase mixes function declarations, function expressions, and (after this exercise)
      arrow functions, with no single consistent rule. Propose one rule your team could adopt for
      "when do we use which," and justify it.

---

## What to bring to class

For each of the 10 demos: your changed code (ideally as commits you can diff live), and the ticked
checkboxes above reflecting what you can genuinely demonstrate and answer *right now*. Be ready to
open DevTools live on request, not just describe what you did.
