// ---------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------
// Loaded via <script type="module" src="js/main.ts"> in index.html. This is
// the one place in the app that bridges the module world back to the
// classic global-script world: index.html (and a few HTML strings rendered
// by the views) still call functions via inline onclick="..."/onchange="..."
// attributes, and those always run in global scope, never in module scope
// — a module-scoped function is invisible to them unless explicitly hung
// off `window`. Centralizing that wiring here (rather than scattering
// `window.foo = foo` across each view module) keeps the "this is where
// module-land meets legacy inline-handler-land" boundary in one obvious
// place.
import { loadBookmarksFromStorage, loadNotesFromStorage, loadNoteAsync } from "./storage.ts";
import { navigateTo, handleHashChange } from "./navigation.ts";
import loadAllData from "./dataLoading.ts";
import {
  clearFilters,
  handleSearchInput,
  handleSortChange,
  closeEvidenceDetail,
  saveCurrentNote,
  renderEvidenceList,
} from "./views/evidence.ts";
import { switchPeopleTab } from "./views/people.ts";
import { renderTimeline } from "./views/timeline.ts";
import { saveHypothesis } from "./views/workspace.ts";
import { el } from "./dom.ts";

// Functions reached only through inline HTML attributes (onclick="...",
// onchange="...", or the onchange string set via setAttribute below) must
// exist as globals — inline handler attributes are evaluated in the global
// scope, not in this module's scope. `window` isn't declared to have these
// properties by lib.dom.d.ts, so each assignment goes through the same
// widened-view cast dom.ts's `el()` uses for element casts, for the same
// reason: this is deliberately extending a browser global the type system
// doesn't otherwise know about, not working around a type this file itself
// got wrong.
const globalWindow = window as typeof window & {
  navigateTo: typeof navigateTo;
  switchPeopleTab: typeof switchPeopleTab;
  handleSortChange: typeof handleSortChange;
  saveHypothesis: typeof saveHypothesis;
  closeEvidenceDetail: typeof closeEvidenceDetail;
  saveCurrentNote: typeof saveCurrentNote;
};
globalWindow.navigateTo = navigateTo;
globalWindow.switchPeopleTab = switchPeopleTab;
globalWindow.handleSortChange = handleSortChange;
globalWindow.saveHypothesis = saveHypothesis;
globalWindow.closeEvidenceDetail = closeEvidenceDetail;
globalWindow.saveCurrentNote = saveCurrentNote;

// ---------------------------------------------------------------------
// EVENT LISTENER SETUP
// ---------------------------------------------------------------------

function setupEventListeners(): void {
  window.addEventListener("hashchange", handleHashChange);

  const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-btn");
  for (const navButton of navButtons) {
    navButton.addEventListener("click", function () {
      const targetView = navButton.getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  el<HTMLInputElement>("evidenceSearch")!.addEventListener("input", handleSearchInput);

  el("filterType")!.addEventListener("change", renderEvidenceList);
  el("filterPerson")!.addEventListener("change", renderEvidenceList);
  el("filterLocation")!.addEventListener("change", renderEvidenceList);

  el("filterStatus")!.addEventListener("change", renderEvidenceList);

  el("filterRelevance")!.addEventListener("change", renderEvidenceList);

  el("clearFiltersBtn")!.addEventListener("click", clearFilters);

  el("timelineOrder")!.addEventListener("change", renderTimeline);
  el("timelinePersonFilter")!.addEventListener("change", renderTimeline);
  el("timelineLocationFilter")!.addEventListener("change", renderTimeline);
  el("timelineTypeFilter")!.addEventListener("change", renderTimeline);

  el<HTMLInputElement>("hypConfidence")!.addEventListener("input", (e) => {
    el<HTMLOutputElement>("hypConfidenceValue")!.textContent = (e.target as HTMLInputElement).value;
  });
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------

function initApp(): void {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  loadAllData().then(function () {
    handleHashChange();
    // loadNoteAsync returns a Promise, not the note text itself — it must be
    // resolved before logging, or this logs a pending Promise object on
    // every load instead of the actual stored note preview.
    loadNoteAsync("E01").then(function (firstNote) {
      console.log("First note preview:", firstNote);
    });
  });
}

window.addEventListener("DOMContentLoaded", initApp);
// The hashchange listener lives only in setupEventListeners() above — see
// navigation.js's handleHashChange comment, which used to document this as
// a deliberately-preserved duplicate registration (fixed as a Demo 8 code
// smell: it made every navigation re-run the full view-render/nav-highlight
// logic twice for no benefit).
