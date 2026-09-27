// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE + EVIDENCE DETAIL
// ---------------------------------------------------------------------
// The catalogue (list/search/filter/sort/bookmark) and the detail panel
// (opened from a card, edited in place, has its own note field) are kept in
// one module: the detail view only ever gets opened from the list's click
// handler, they share the exact same "current evidence" concerns, and
// splitting them further would just add an extra import cycle between two
// files that are really one feature, not two.
import { state } from "../state.ts";
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
import { el } from "../dom.ts";
import type { Evidence, EvidenceStatus, EvidenceRelevance } from "../types.ts";

// ---- Evidence Catalogue -----------------------------------------------

// Called from dataLoading.js's populateAllDropdowns.
export function populateEvidenceDropdowns(): void {
  const typeSelect = el<HTMLSelectElement>("filterType");
  const personSelect = el<HTMLSelectElement>("filterPerson");
  const locationSelect = el<HTMLSelectElement>("filterLocation");
  if (!typeSelect || !personSelect || !locationSelect) return;

  const types: string[] = [];
  for (const item of state.allEvidence) {
    const t = item.type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (const t of types) {
    typeSelect.innerHTML += '<option value="' + t + '">' + t + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const person of state.allPeople) {
    personSelect.innerHTML += '<option value="' + person.id + '">' + person.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const loc of state.allLocations) {
    locationSelect.innerHTML +=
      '<option value="' + loc.id + '">' + loc.id + " - " + loc.name + "</option>";
  }
}

// Only used by renderEvidenceList and handleSortChange, both in this same
// module — module-private.
function getFilteredEvidence(): Evidence[] {
  const searchBox = el<HTMLInputElement>("evidenceSearch");
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = el<HTMLSelectElement>("filterType")!.value;
  const personVal = el<HTMLSelectElement>("filterPerson")!.value;
  const locationVal = el<HTMLSelectElement>("filterLocation")!.value;
  const statusVal = el<HTMLSelectElement>("filterStatus")!.value;
  const relevanceVal = el<HTMLSelectElement>("filterRelevance")!.value;

  const results: Evidence[] = [];
  for (const item of state.allEvidence) {
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
function applyCurrentSortOrder(list: Evidence[]): Evidence[] {
  const sortValue = el<HTMLSelectElement>("sortEvidence")!.value;

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
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  } else {
    list.sort(function (a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
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
export function renderEvidenceList(): void {
  const container = el<HTMLDivElement>("evidenceList");
  if (!container) return;

  const loadingIndicator = el("evidenceLoadingIndicator");
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
  for (const ev of results) {
    html += renderEvidenceCardHTML(ev);
  }
  container.innerHTML = html;

  // Event delegation for card clicks / bookmark button.
  container.addEventListener("click", handleEvidenceListClick);
}

// Only ever called from renderEvidenceList in this same file — private.
function renderEvidenceCardHTML(ev: Evidence): string {
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
  for (const tag of ev.tags) {
    html += '<span class="tag-chip">' + tag + "</span>";
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
function handleEvidenceListClick(event: Event): void {
  const target = event.target as HTMLElement;

  if (target.dataset && target.dataset.action === "bookmark") {
    event.stopPropagation();
    handleBookmarkClick(target.dataset.id!);
    return;
  }

  const card = target.closest<HTMLElement>(".evidence-card");
  if (card) {
    openEvidenceDetail(card.getAttribute("data-id")!);
  }
}

// Only called from handleEvidenceListClick in this same file — private.
function handleBookmarkClick(evidenceId: string): void {
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
export function applyStoredBookmarkFlags(): void {
  for (const item of state.allEvidence) {
    item.bookmarked = state.bookmarks.indexOf(item.id) !== -1;
  }
}

// Reached only through the inline onchange="handleSortChange()" on
// #sortEvidence in index.html, so — like closeEvidenceDetail and
// saveCurrentNote below — it must be exported purely so main.js can attach
// it to `window`; no other module calls it directly. The actual sort is now
// applied inside getFilteredEvidence (see applyCurrentSortOrder above) so it
// survives subsequent filter/search renders too — this just needs to trigger
// one of those renders.
export function handleSortChange(): void {
  renderEvidenceList();
}

// Attached directly via addEventListener in main.js's setupEventListeners.
export function clearFilters(): void {
  el<HTMLInputElement>("evidenceSearch")!.value = "";
  el<HTMLSelectElement>("filterType")!.value = "";
  el<HTMLSelectElement>("filterPerson")!.value = "";
  el<HTMLSelectElement>("filterLocation")!.value = "";
  el<HTMLSelectElement>("filterStatus")!.value = "";
  el<HTMLSelectElement>("filterRelevance")!.value = "";
  renderEvidenceList();
}

// Only used by handleSearchInput in this same file — private.
function simulateAsyncSearch(term: string): Promise<string> {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(term);
    }, 300);
  });
}

// Module-private request counter, only read/written inside handleSearchInput.
let latestSearchRequestId = 0;

// Attached directly via addEventListener in main.js's setupEventListeners.
export function handleSearchInput(event: Event): void {
  const term = (event.target as HTMLInputElement).value;
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
export function openEvidenceDetail(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;
  state.selectedEvidence = ev;

  const section = el<HTMLElement>("evidenceDetailSection")!;
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Reached only through the inline onclick="closeEvidenceDetail()" generated
// by renderEvidenceDetail below, so — like handleSortChange above — it's
// exported purely for main.js to attach to `window`, not for module-to-module
// calls.
export function closeEvidenceDetail(): void {
  const section = el<HTMLElement>("evidenceDetailSection")!;
  section.classList.add("hidden");
  section.innerHTML = "";
  state.selectedEvidence = null;
}

// Only called from openEvidenceDetail and its own change handlers in this
// same file — private.
function renderEvidenceDetail(ev: Evidence): void {
  const section = el<HTMLElement>("evidenceDetailSection")!;

  const personNames: string[] = [];
  for (const personId of ev.personIds) {
    const person = findPersonById(personId);
    personNames.push(person ? person.name : personId);
  }

  const locationNames: string[] = [];
  for (const locationId of ev.locationIds) {
    const loc = findLocationById(locationId);
    locationNames.push(loc ? loc.id + " - " + loc.name : locationId);
  }

  let tagsHtml = "";
  for (const tag of ev.tags) {
    tagsHtml += '<span class="tag-chip">' + tag + "</span>";
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

  el<HTMLSelectElement>("detailStatusSelect")!.addEventListener("change", function (e) {
    ev.status = (e.target as HTMLSelectElement).value as EvidenceStatus; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
  el<HTMLSelectElement>("detailRelevanceSelect")!.addEventListener("change", function (e) {
    ev.relevance = (e.target as HTMLSelectElement).value as EvidenceRelevance;
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
}

// Only called from renderEvidenceDetail in this same file — private.
function statusOptionHTML(
  current: string | null | undefined,
  value: string,
  label: string,
): string {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

// Reached only through the inline onclick="saveCurrentNote()" generated by
// renderEvidenceDetail above — exported purely for main.js's window wiring.
export function saveCurrentNote(): void {
  const textarea = el<HTMLTextAreaElement>("evidenceNoteInput");
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id")!; // note id is read back off the DOM
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = el("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}
