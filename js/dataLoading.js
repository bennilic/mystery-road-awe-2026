// ---------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------
// Only `loadAllData` is ever called from outside this module (main.js's
// initApp) — every other function here is an internal step of that one
// loading sequence. One real "public" thing to offer justifies a default
// export rather than a named one; everything else stays unexported.
import { state } from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { populateEvidenceDropdowns, renderEvidenceList, applyStoredBookmarkFlags } from "./views/evidence.js";
import { populateTimelineDropdowns, renderTimeline } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";

function showLoadingOverlay(msg) {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep() {
  state.loadingStepsRemaining--;
  if (state.loadingStepsRemaining <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

function populateAllDropdowns() {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}

function loadCorePeopleAndLocations() {
  return fetch("data/case.json").then(function (caseRes) {
    return caseRes.json().then(function (caseJson) {
      state.caseData = caseJson;

      return fetch("data/people.json").then(function (peopleRes) {
        return peopleRes.json().then(function (peopleJson) {
          state.allPeople = peopleJson;

          return fetch("data/locations.json").then(function (locationsRes) {
            return locationsRes.json().then(function (locationsJson) {
              state.allLocations = locationsJson;

              hideLoadingStep();
              renderDashboard();
              populateAllDropdowns();
            });
          });
        });
      });
    });
  });
}

function loadEvidenceData() {
  fetch("data/evidence.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
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
    })
    .catch(function (err) {
      console.error("Failed to load evidence.json", err);
      alert("Evidence could not be loaded. Some views may be incomplete.");
      // Also clear on failure: the fetch has settled either way, and
      // leaving this true would strand the catalogue on "Loading evidence…"
      // forever instead of showing the (empty) result of the failed load.
      state.evidenceViewLoading = false;
      if (state.currentPage === "evidence") renderEvidenceList();
    })
    .finally(function () {
      // Budgeted in loadAllData's loadingStepsRemaining (now 3, not 2) —
      // without this the "Loading case file…" overlay could hide as soon as
      // the other two steps settled, regardless of whether evidence.json had
      // actually finished loading yet.
      hideLoadingStep();
    });
}

function loadTimelineData() {
  return fetch("data/timeline.json")
    .then(function (res) {
      return res.json();
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

export default function loadAllData() {
  showLoadingOverlay("Loading case file…");
  // Three independent steps hide the overlay: core (people/locations),
  // evidence, and timeline. This was previously budgeted for 2 — evidence's
  // own step never called hideLoadingStep() at all — so the overlay could
  // dismiss once core+timeline settled even if evidence.json was still
  // in flight. Note: loadEvidenceData()/loadTimelineData() below still run
  // un-awaited (loadAllData's own returned promise resolves right after
  // loadCorePeopleAndLocations, not after all three) — that's the Demo 9
  // .then()-to-async/await scope, left as-is here; this fix only corrects
  // the loading-step count so the overlay's own timing is right regardless.
  state.loadingStepsRemaining = 3;
  return loadCorePeopleAndLocations().then(function () {
    loadEvidenceData();
    loadTimelineData();
  });
}
