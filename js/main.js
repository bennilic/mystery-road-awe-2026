// ---------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------
// Loaded via <script type="module" src="js/main.js"> in index.html. This is
// the one place in the app that bridges the module world back to the
// classic global-script world: index.html (and a few HTML strings rendered
// by the views) still call functions via inline onclick="..."/onchange="..."
// attributes, and those always run in global scope, never in module scope
// — a module-scoped function is invisible to them unless explicitly hung
// off `window`. Centralizing that wiring here (rather than scattering
// `window.foo = foo` across each view module) keeps the "this is where
// module-land meets legacy inline-handler-land" boundary in one obvious
// place.
import { loadBookmarksFromStorage, loadNotesFromStorage, loadNoteAsync } from "./storage.js";
import { navigateTo, handleHashChange } from "./navigation.js";
import loadAllData from "./dataLoading.js";
import { clearFilters, handleSearchInput, handleSortChange, closeEvidenceDetail, saveCurrentNote, renderEvidenceList } from "./views/evidence.js";
import { switchPeopleTab } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import { saveHypothesis } from "./views/workspace.js";

// Functions reached only through inline HTML attributes (onclick="...",
// onchange="...", or the onchange string set via setAttribute below) must
// exist as globals — inline handler attributes are evaluated in the global
// scope, not in this module's scope.
window.navigateTo = navigateTo;
window.switchPeopleTab = switchPeopleTab;
window.handleSortChange = handleSortChange;
window.saveHypothesis = saveHypothesis;
window.closeEvidenceDetail = closeEvidenceDetail;
window.saveCurrentNote = saveCurrentNote;

// ---------------------------------------------------------------------
// EVENT LISTENER SETUP
// ---------------------------------------------------------------------

function setupEventListeners() {
  window.addEventListener("hashchange", handleHashChange);

  const navButtons = document.querySelectorAll(".nav-btn");
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () {
      const targetView = navButtons[i].getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  document.getElementById("evidenceSearch").addEventListener("input", handleSearchInput);

  document.getElementById("filterType").addEventListener("change", renderEvidenceList);
  document.getElementById("filterPerson").addEventListener("change", renderEvidenceList);
  document.getElementById("filterLocation").addEventListener("change", renderEvidenceList);

  document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);

  document.getElementById("filterRelevance").addEventListener("change", renderEvidenceList);

  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

  document.getElementById("timelineOrder").addEventListener("change", renderTimeline);
  document.getElementById("timelinePersonFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineLocationFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineTypeFilter").addEventListener("change", renderTimeline);

  document.getElementById("hypConfidence").addEventListener("input", (e) => {
    document.getElementById("hypConfidenceValue").textContent = e.target.value;
  });
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------

function initApp() {
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
