// ---------------------------------------------------------------------
// TIMELINE VIEW (+ its quick-view evidence modal)
// ---------------------------------------------------------------------
import { state } from "../state.ts";
import { findEvidenceById, findLocationById, formatDate } from "../lookup.ts";
import { navigateTo } from "../navigation.ts";
import { openEvidenceDetail } from "./evidence.ts";
import { el } from "../dom.ts";
import type { TimelineEvent, TimelineCertainty } from "../types.ts";

// Called from dataLoading.js's populateAllDropdowns.
export function populateTimelineDropdowns(): void {
  const personSelect = el<HTMLSelectElement>("timelinePersonFilter");
  const locationSelect = el<HTMLSelectElement>("timelineLocationFilter");
  const typeSelect = el<HTMLSelectElement>("timelineTypeFilter");
  if (!personSelect || !locationSelect || !typeSelect) return;

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const person of state.allPeople) {
    personSelect.innerHTML += '<option value="' + person.id + '">' + person.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const loc of state.allLocations) {
    locationSelect.innerHTML += '<option value="' + loc.id + '">' + loc.id + "</option>";
  }

  const types: string[] = [];
  for (const evt of state.allTimeline) {
    if (types.indexOf(evt.type) === -1) types.push(evt.type);
  }
  typeSelect.innerHTML = '<option value="">All event types</option>';
  for (const t of types) {
    typeSelect.innerHTML += '<option value="' + t + '">' + t + "</option>";
  }
}

// Called from dataLoading.js, navigation.js, and main.js's toolbar-change
// listeners — needs to be exported.
export function renderTimeline(): void {
  const container = el<HTMLElement>("timelineContainer");
  if (!container) return;

  const order = el<HTMLSelectElement>("timelineOrder")!.value;
  const personFilter = el<HTMLSelectElement>("timelinePersonFilter")!.value;
  const locationFilter = el<HTMLSelectElement>("timelineLocationFilter")!.value;
  const typeFilter = el<HTMLSelectElement>("timelineTypeFilter")!.value;

  let events: TimelineEvent[] = [];
  for (const evt of state.allTimeline) {
    if (personFilter && evt.personIds.indexOf(personFilter) === -1) continue;
    if (locationFilter && evt.locationIds.indexOf(locationFilter) === -1) continue;
    if (typeFilter && evt.type !== typeFilter) continue;
    events.push(evt);
  }

  events = events.slice().sort(function (a, b) {
    const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
    return order === "desc" ? -diff : diff;
  });

  let html = "";
  for (const item of events) {
    html += '<div class="timeline-event certainty-' + item.certainty + '">';
    html +=
      '<div class="timeline-time">' +
      formatDate(item.time) +
      '&nbsp;&middot;&nbsp;<span class="badge badge-' +
      certaintyBadgeClass(item.certainty) +
      '">' +
      item.certainty +
      "</span></div>";
    html += "<h3>" + item.title + "</h3>";
    html += "<p>" + item.description + "</p>";

    const eventLocationNames: string[] = [];
    for (const locationId of item.locationIds) {
      const evtLoc = findLocationById(locationId);
      // findLocationById returns the location object, not a display string —
      // pushing it directly and joining left join() calling toString() on
      // it, rendering "[object Object]" instead of the location's name.
      eventLocationNames.push(evtLoc ? evtLoc.id + " - " + evtLoc.name : locationId);
    }
    if (eventLocationNames.length > 0) {
      html += '<p class="evidence-meta">Location: ' + eventLocationNames.join(", ") + "</p>";
    }

    for (const evidenceId of item.evidenceIds) {
      html +=
        '<button type="button" class="evidence-link-btn" data-evidence-id="' +
        evidenceId +
        '">View ' +
        evidenceId +
        "</button>";
    }
    html += "</div>";
  }
  if (events.length === 0) {
    html = "<p>No timeline events match the current filters.</p>";
  }
  container.innerHTML = html;

  const linkButtons = container.querySelectorAll<HTMLButtonElement>(".evidence-link-btn");
  for (const button of linkButtons) {
    button.addEventListener("click", function (e) {
      openEvidenceModal((e.target as HTMLElement).getAttribute("data-evidence-id")!);
    });
  }
}

// Only called from renderTimeline in this same file — private. Converted to
// an arrow function (Demo 10): pure lookup, no `this`/`arguments`, never
// called before this line runs (only from renderTimeline, itself invoked
// later at runtime, well after the whole module has finished evaluating),
// so the lack of hoisting for a `const` binding doesn't matter here.
const certaintyBadgeClass = (certainty: TimelineCertainty): string => {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
};

// --- Quick-view modal (used from the timeline) -------------------------
// Looks like a generic reusable modal, but in the actual codebase it is
// only ever invoked from renderTimeline's own link-button handler above —
// kept module-private rather than exported speculatively (YAGNI).

// Only called from openEvidenceModal below, and only once per page (guarded
// by the isNewModal check there). A single named function reused across
// every open, rather than a fresh closure created per openEvidenceModal
// call, so re-opening the modal for a different event doesn't keep stacking
// additional listeners on the same persisted #quickViewModal element — each
// stacked listener re-ran its full body (including a second, third, ...
// openEvidenceDetail call) on every later click inside the modal.
function handleModalClick(e: MouseEvent): void {
  const modal = el<HTMLElement>("quickViewModal");
  if (!modal) return;

  const target = e.target as HTMLElement;

  if (target.classList.contains("modal-close-btn") || target.classList.contains("modal-backdrop")) {
    modal.innerHTML = "";
  }
  const openFullId = target.getAttribute && target.getAttribute("data-open-full");
  if (openFullId) {
    modal.innerHTML = "";
    navigateTo("evidence");
    setTimeout(function () {
      openEvidenceDetail(openFullId);
    }, 0);
  }
}

function openEvidenceModal(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  const existingModal = el<HTMLElement>("quickViewModal");
  const isNewModal = !existingModal;
  // `?? document.createElement(...)` (rather than reassigning a `let`
  // inside the isNewModal branch) keeps `modal` a single, non-null
  // `HTMLElement` binding throughout — TS can't otherwise tell that
  // isNewModal being false implies the earlier lookup was non-null, so a
  // reassign-in-branch version would leave every use below needing its
  // own null check despite that invariant always holding at runtime.
  const modal = existingModal ?? document.createElement("div");
  if (isNewModal) {
    modal.id = "quickViewModal";
    document.body.appendChild(modal);
  }

  modal.innerHTML =
    '<div class="modal-backdrop"><div class="modal-box">' +
    '<button type="button" class="modal-close-btn" aria-label="Close">&times;</button>' +
    "<h3>" +
    ev.title +
    "</h3>" +
    '<p class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</p>" +
    "<p>" +
    ev.summary +
    "</p>" +
    '<button type="button" class="btn btn-primary btn-small" data-open-full="' +
    ev.id +
    '">Open full evidence</button>' +
    "</div></div>";

  // The modal element itself is created once and reused (only its innerHTML
  // is replaced on each open), so the listener only needs to be attached the
  // first time it's created.
  if (isNewModal) {
    modal.addEventListener("click", handleModalClick);
  }
}
