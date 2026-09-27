// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE + EVIDENCE DETAIL
// ---------------------------------------------------------------------
// The catalogue (list/search/filter/sort/bookmark) and the detail panel
// (opened from a card, edited in place, has its own note field) are kept in
// one module: the detail view only ever gets opened from the list's click
// handler, they share the exact same "current evidence" concerns, and
// splitting them further would just add an extra import cycle between two
// files that are really one feature, not two.
import { state } from "../state.js";
import {
  findEvidenceById,
  findPersonById,
  findLocationById,
  evidenceMentionsPerson,
  formatDate,
  getStatusBadgeClass,
  getRelevanceBadgeClass,
} from "../lookup.ts";
import { saveBookmarksToStorage, loadNoteForEvidence, saveNoteForEvidence } from "../storage.ts";

// ---- Evidence Catalogue -----------------------------------------------

// Called from dataLoading.js's populateAllDropdowns.
export function populateEvidenceDropdowns() {
  const typeSelect = document.getElementById("filterType");
  const personSelect = document.getElementById("filterPerson");
  const locationSelect = document.getElementById("filterLocation");
  if (!typeSelect || !personSelect || !locationSelect) return;

  const types = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const t = state.allEvidence[i].type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (let ti = 0; ti < types.length; ti++) {
    typeSelect.innerHTML += '<option value="' + types[ti] + '">' + types[ti] + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (let p = 0; p < state.allPeople.length; p++) {
    personSelect.innerHTML +=
      '<option value="' + state.allPeople[p].id + '">' + state.allPeople[p].name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (let l = 0; l < state.allLocations.length; l++) {
    locationSelect.innerHTML +=
      '<option value="' +
      state.allLocations[l].id +
      '">' +
      state.allLocations[l].id +
      " - " +
      state.allLocations[l].name +
      "</option>";
  }
}

// Only used by renderEvidenceList and handleSortChange, both in this same
// module — module-private.
function getFilteredEvidence() {
  const searchBox = document.getElementById("evidenceSearch");
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = document.getElementById("filterType").value;
  const personVal = document.getElementById("filterPerson").value;
  const locationVal = document.getElementById("filterLocation").value;
  const statusVal = document.getElementById("filterStatus").value;
  const relevanceVal = document.getElementById("filterRelevance").value;

  const results = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const item = state.allEvidence[i];
    let matches = true;

    if (searchTerm) {
      const haystack = (item.title + " " + item.summary + " " + item.tags.join(" ")).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal) matches = false;
    if (matches && personVal) {
      const person = findPersonById(personVal);
      if (!person || !evidenceMentionsPerson(item, person)) matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1) matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal) matches = false;
    if (matches && relevanceVal && (item.relevance || "").toLowerCase() !== relevanceVal)
      matches = false;

    if (matches) results.push(item);
  }

  state.filteredEvidence = results;
  applyCurrentSortOrder(results);
  return results;
}

// Only used by getFilteredEvidence in this same module — private. Re-applies
// the current #sortEvidence selection to `list` in place. getFilteredEvidence
// rebuilds state.filteredEvidence from state.allEvidence on every
// filter/search-triggered render, which was silently discarding whatever
// order handleSortChange had just applied (the very next render — including
// the one handleSortChange itself triggers — put the list straight back into
// unsorted, allEvidence-insertion order). Sorting here, as the last step of
// every filter rebuild, makes the current sort selection survive filtering
// instead of being a one-render-only effect.
function applyCurrentSortOrder(list) {
  const sortValue = document.getElementById("sortEvidence").value;

  if (sortValue === "title-asc") {
    list.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
  } else if (sortValue === "title-desc") {
    list.sort(function (a, b) {
      return b.title.localeCompare(a.title);
    });
  } else if (sortValue === "date-asc") {
    list.sort(function (a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  } else {
    list.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }
  return list;
}

// Used by dataLoading.js, navigation.js, and main.js's filter-change
// listeners. Demo 8 removed a second, redundant wiring path that used to
// exist for this on #filterStatus specifically (an addEventListener("change",
// ...) alongside an inline setAttribute("onchange", "renderEvidenceList()")
// string, which required exporting this to `window` too, purely so that
// inline string could resolve it in global scope) — one listener now covers
// #filterStatus the same way as every other filter control.
export function renderEvidenceList() {
  const container = document.getElementById("evidenceList");
  if (!container) return;

  const loadingIndicator = document.getElementById("evidenceLoadingIndicator");
  if (state.evidenceViewLoading) {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  const results = getFilteredEvidence();

  let html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (let i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]);
  }
  container.innerHTML = html;

  // Event delegation for card clicks / bookmark button.
  container.addEventListener("click", handleEvidenceListClick);
}

// Only ever called from renderEvidenceList in this same file — private.
function renderEvidenceCardHTML(ev) {
  const isBookmarked = state.bookmarks.indexOf(ev.id) !== -1;
  let html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html +=
    '<button class="bookmark-btn ' +
    (isBookmarked ? "active" : "") +
    '" data-action="bookmark" data-id="' +
    ev.id +
    '" aria-label="Toggle bookmark for ' +
    ev.title +
    '"><span class="bookmark-icon">' +
    (isBookmarked ? "★" : "☆") +
    "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
  html +=
    '<span class="badge ' + getRelevanceBadgeClass(ev.relevance) + '">' + ev.relevance + "</span>";
  html += "<div>";
  for (let t = 0; t < ev.tags.length; t++) {
    html += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

// Only attached from within renderEvidenceList in this same file — private.
// Demo 10: deliberately NOT converted to an arrow function. It's registered
// directly by reference as a DOM event listener (`container.addEventListener
// ("click", handleEvidenceListClick)` below, not wrapped in another
// callback), which is exactly the case where a regular `function` is the
// safer form to keep — the DOM calls it with `this` bound to the element the
// listener is attached to (`container`), which is the whole point of the
// delegated-click pattern this function implements. This version reads
// `event.target` rather than `this`, but converting it to an arrow function
// would permanently foreclose that binding: an arrow function ignores the
// caller-supplied `this` entirely and captures whatever `this` is in the
// enclosing module scope instead (`undefined`, since ES modules are strict
// mode) regardless of which element the listener is attached to. That's a
// silent, easy-to-miss behavior change for a function whose entire job is
// being a DOM event handler.
function handleEvidenceListClick(event) {
  const target = event.target;

  if (target.dataset && target.dataset.action === "bookmark") {
    event.stopPropagation();
    handleBookmarkClick(target.dataset.id);
    return;
  }

  const card = target.closest(".evidence-card");
  if (card) {
    openEvidenceDetail(card.getAttribute("data-id"));
  }
}

// Only called from handleEvidenceListClick in this same file — private.
function handleBookmarkClick(evidenceId) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  if (state.bookmarks.indexOf(evidenceId) === -1) {
    state.bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    state.bookmarks = state.bookmarks.filter(function (id) {
      return id !== evidenceId;
    });
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (state.currentPage === "evidence") renderEvidenceList();
}

// Called from dataLoading.js right after evidence.json loads.
export function applyStoredBookmarkFlags() {
  for (let i = 0; i < state.allEvidence.length; i++) {
    state.allEvidence[i].bookmarked = state.bookmarks.indexOf(state.allEvidence[i].id) !== -1;
  }
}

// Reached only through the inline onchange="handleSortChange()" on
// #sortEvidence in index.html, so — like closeEvidenceDetail and
// saveCurrentNote below — it must be exported purely so main.js can attach
// it to `window`; no other module calls it directly. The actual sort is now
// applied inside getFilteredEvidence (see applyCurrentSortOrder above) so it
// survives subsequent filter/search renders too — this just needs to trigger
// one of those renders.
export function handleSortChange() {
  renderEvidenceList();
}

// Attached directly via addEventListener in main.js's setupEventListeners.
export function clearFilters() {
  document.getElementById("evidenceSearch").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterPerson").value = "";
  document.getElementById("filterLocation").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterRelevance").value = "";
  renderEvidenceList();
}

// Only used by handleSearchInput in this same file — private.
function simulateAsyncSearch(term) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(term);
    }, 300);
  });
}

// Module-private request counter, only read/written inside handleSearchInput.
let latestSearchRequestId = 0;

// Attached directly via addEventListener in main.js's setupEventListeners.
export function handleSearchInput(event) {
  const term = event.target.value;
  const requestId = ++latestSearchRequestId;

  simulateAsyncSearch(term).then(function (_resolvedTerm) {
    // Only apply this response if nothing newer has been typed meanwhile.
    // The resolved term itself isn't needed here — renderEvidenceList()
    // re-reads the live input value — but it documents what the simulated
    // async lookup actually returns.
    if (requestId !== latestSearchRequestId) return;
    renderEvidenceList();
  });
}

// ---- Evidence Detail ----------------------------------------------------

// Called from this module's own click handler, and from timeline.js's
// quick-view modal and workspace.js's bookmarks list — needs to be exported.
export function openEvidenceDetail(evidenceId) {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;
  state.selectedEvidence = ev;

  const section = document.getElementById("evidenceDetailSection");
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Reached only through the inline onclick="closeEvidenceDetail()" generated
// by renderEvidenceDetail below, so — like handleSortChange above — it's
// exported purely for main.js to attach to `window`, not for module-to-module
// calls.
export function closeEvidenceDetail() {
  const section = document.getElementById("evidenceDetailSection");
  section.classList.add("hidden");
  section.innerHTML = "";
  state.selectedEvidence = null;
}

// Only called from openEvidenceDetail and its own change handlers in this
// same file — private.
function renderEvidenceDetail(ev) {
  const section = document.getElementById("evidenceDetailSection");

  const personNames = [];
  for (let p = 0; p < ev.personIds.length; p++) {
    const person = findPersonById(ev.personIds[p]);
    personNames.push(person ? person.name : ev.personIds[p]);
  }

  const locationNames = [];
  for (let l = 0; l < ev.locationIds.length; l++) {
    const loc = findLocationById(ev.locationIds[l]);
    locationNames.push(loc ? loc.id + " - " + loc.name : ev.locationIds[l]);
  }

  let tagsHtml = "";
  for (let t = 0; t < ev.tags.length; t++) {
    tagsHtml += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }

  const storedNote = loadNoteForEvidence(ev.id);

  let html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div></div>";
  html +=
    '<button type="button" class="btn btn-secondary btn-small" onclick="closeEvidenceDetail()">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html += '<div class="detail-field"><strong>Summary</strong>' + ev.summary + "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html +=
    '<div class="detail-field"><strong>Related people</strong>' + personNames.join(", ") + "</div>";
  html +=
    '<div class="detail-field"><strong>Related locations</strong>' +
    locationNames.join(", ") +
    "</div>";
  html += '<div class="detail-field"><strong>Tags</strong>' + tagsHtml + "</div>";

  html += '<div class="detail-field"><strong>Review status</strong>';
  html += '<select id="detailStatusSelect">';
  html += statusOptionHTML(ev.status, "unreviewed", "Unreviewed");
  html += statusOptionHTML(ev.status, "reviewed", "Reviewed");
  html += statusOptionHTML(ev.status, "flagged", "Flagged");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Relevance</strong>';
  html += '<select id="detailRelevanceSelect">';
  html += statusOptionHTML(ev.relevance, "unknown", "Unknown");
  html += statusOptionHTML(ev.relevance, "relevant", "Relevant");
  html += statusOptionHTML(ev.relevance, "irrelevant", "Irrelevant");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Investigator note</strong>';
  html +=
    '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' +
    ev.id +
    '" placeholder="Add a private note about this evidence...">' +
    storedNote +
    "</textarea>";
  html +=
    '<button type="button" class="btn btn-primary btn-small" style="margin-top:6px;" onclick="saveCurrentNote()">Save note</button>';
  html += "</div>";

  html +=
    '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' +
    storedNote +
    "</div></div>";

  section.innerHTML = html;

  document.getElementById("detailStatusSelect").addEventListener("change", function (e) {
    ev.status = e.target.value; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
  document.getElementById("detailRelevanceSelect").addEventListener("change", function (e) {
    ev.relevance = e.target.value;
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
}

// Only called from renderEvidenceDetail in this same file — private.
function statusOptionHTML(current, value, label) {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

// Reached only through the inline onclick="saveCurrentNote()" generated by
// renderEvidenceDetail above — exported purely for main.js's window wiring.
export function saveCurrentNote() {
  const textarea = document.getElementById("evidenceNoteInput");
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id"); // note id is read back off the DOM
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = document.getElementById("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}
