// ---------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------
// Only `loadAllData` is ever called from outside this module (main.js's
// initApp) — every other function here is an internal step of that one
// loading sequence. One real "public" thing to offer justifies a default
// export rather than a named one; everything else stays unexported.
import { state } from "./state.ts";
import { renderDashboard } from "./views/dashboard.ts";
import {
  populateEvidenceDropdowns,
  renderEvidenceList,
  applyStoredBookmarkFlags,
} from "./views/evidence.ts";
import { populateTimelineDropdowns, renderTimeline } from "./views/timeline.ts";
import { populateHypothesisDropdowns } from "./views/workspace.ts";
import type { CaseInfo, Person, Location, Evidence, TimelineEvent } from "./types.ts";

function showLoadingOverlay(msg: string): void {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep(): void {
  state.loadingStepsRemaining--;
  if (state.loadingStepsRemaining <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

function populateAllDropdowns(): void {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}

// Demo 6: fetch()/.json() return `Promise<any>` — TypeScript has no way to
// know what shape actually comes back over the network, so every one of
// these `as <Type>` casts is a trust boundary: the compiler doesn't verify
// the real JSON matches, it only stops treating the value as `any` from
// this point on. That's the honest scope of what static types buy here —
// see lookup.ts's getStatusBadgeClass comment for a concrete case where a
// real record doesn't actually match its declared type.

// Demo 9: was a 6-level-deep nested .then() chain — fetch(case.json) → .then
// → .json() → .then → fetch(people.json) → .then → .json() → .then →
// fetch(locations.json) → .then → .json() → .then, each level only starting
// once the previous one's callback ran. None of case/people/locations
// actually depend on each other's *data* — they're independent resources —
// but the chain still forced them to load strictly one after another because
// that's the only shape a nested `.then()` chain has to offer without extra
// machinery. Converted to async/await: each `await` below is exactly one
// rung of that old chain, in the same order, so the three fetches still run
// sequentially, not in parallel (that stays out of scope until a later
// exercise). No try/catch here because the original chain had none either —
// a rejection still propagates out as a rejected Promise, same as before.
async function loadCorePeopleAndLocations(): Promise<void> {
  const caseRes = await fetch("data/case.json");
  state.caseData = (await caseRes.json()) as CaseInfo;

  const peopleRes = await fetch("data/people.json");
  state.allPeople = (await peopleRes.json()) as Person[];

  const locationsRes = await fetch("data/locations.json");
  state.allLocations = (await locationsRes.json()) as Location[];

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

// Demo 6's ambiguous-field fix (see lookup.ts's evidenceMentionsPerson
// comment for the full story): public/data/evidence.json's personIds is
// supposed to be Person ids, but E04 holds "Nova Byte" — a display name —
// instead of "nova-byte". Rather than have every consumer of
// state.allEvidence carry a defensive "match by id OR name" fallback,
// this normalizes personIds once, right after both evidence and the
// (already-loaded, by the time this runs) people list exist, so
// everything downstream can trust personIds is really PersonId[].
function normalizePersonIds(evidence: Evidence[], people: Person[]): void {
  const nameToId = new Map(people.map((person) => [person.name, person.id]));
  for (const item of evidence) {
    item.personIds = item.personIds.map((ref) => nameToId.get(ref) ?? ref);
  }
}

// Demo 9: converted from .then()/.catch()/.finally() to async/await with
// try/catch/finally — same error handling as before, just spelled with
// try/catch instead of .catch(): log it, tell the user, and still clear
// evidenceViewLoading so the catalogue doesn't strand on "Loading
// evidence…" forever. Being `async` also gives this function a real return
// value (a Promise that settles once the try/catch/finally body has run) —
// previously it had no `return` at all, so callers had no way to wait for
// it (see loadAllData below, which now does).
async function loadEvidenceData(): Promise<void> {
  try {
    const res = await fetch("data/evidence.json");
    const data = (await res.json()) as Evidence[];
    normalizePersonIds(data, state.allPeople);
    state.allEvidence = data;
    applyStoredBookmarkFlags();
    // A copy, not the same array: allEvidence is the canonical, stable
    // list (order relied on by the Dashboard, Workspace notes list,
    // hypothesis evidence picker, etc.), while filteredEvidence is a
    // disposable "current view" of it that the Evidence catalogue filters
    // and sorts in place (see handleSortChange in views/evidence.js,
    // which calls state.filteredEvidence.sort(...)). Assigning the same
    // array reference to both meant sorting the catalogue's view
    // silently reordered the canonical list too.
    state.filteredEvidence = state.allEvidence.slice();
    // The catalogue's own loading placeholder (see renderEvidenceList in
    // views/evidence.js) is gated on this flag, not on state.allEvidence
    // being populated. It starts true so the placeholder shows before
    // this fetch resolves; it must flip false here, once the data this
    // fetch promised has actually landed in state, or renderEvidenceList
    // keeps early-returning the placeholder forever, even after the data
    // it's waiting for has arrived.
    state.evidenceViewLoading = false;
    renderDashboard();
    populateAllDropdowns();
    if (state.currentPage === "evidence") renderEvidenceList();
  } catch (err) {
    console.error("Failed to load evidence.json", err);
    alert("Evidence could not be loaded. Some views may be incomplete.");
    // Also clear on failure: the fetch has settled either way, and
    // leaving this true would strand the catalogue on "Loading evidence…"
    // forever instead of showing the (empty) result of the failed load.
    state.evidenceViewLoading = false;
    if (state.currentPage === "evidence") renderEvidenceList();
  } finally {
    // Budgeted in loadAllData's loadingStepsRemaining (3) — without this
    // the "Loading case file…" overlay could hide as soon as the other two
    // steps settled, regardless of whether evidence.json had actually
    // finished loading yet.
    hideLoadingStep();
  }
}

function loadTimelineData(): Promise<void> {
  return fetch("data/timeline.json")
    .then(function (res) {
      return res.json() as Promise<TimelineEvent[]>;
    })
    .then(function (data) {
      state.allTimeline = data;
      renderDashboard();
      if (state.currentPage === "timeline") renderTimeline();
      populateAllDropdowns();
    })
    .catch(function (err) {
      console.log("timeline load error", err);
    })
    .finally(function () {
      hideLoadingStep();
    });
}

// Demo 9: now properly `await`s every step, instead of firing
// loadEvidenceData()/loadTimelineData() and moving on without waiting for
// them. Previously loadEvidenceData() was called with no `return`/`await` at
// all, so this function's own returned Promise resolved right after
// loadCorePeopleAndLocations — before evidence.json (and sometimes
// timeline.json) had actually finished loading. That gap was flagged back in
// Demo 3/5 and explicitly left for this refactor. Fixing it is a natural
// consequence of converting to async/await properly, not a separate bug fix
// — an async function that doesn't await its own steps isn't really using
// async/await. evidence and timeline still start at the same time as before
// (neither depends on the other's data, and nothing here forces one to
// finish before the other starts) — Promise.all waits for both without
// serializing them, which preserves that pre-existing concurrency rather
// than changing it.
export default async function loadAllData(): Promise<void> {
  showLoadingOverlay("Loading case file…");
  // Three independent steps hide the overlay: core (people/locations),
  // evidence, and timeline.
  state.loadingStepsRemaining = 3;
  await loadCorePeopleAndLocations();
  await Promise.all([loadEvidenceData(), loadTimelineData()]);
}
