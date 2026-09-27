// ---------------------------------------------------------------------
// NAVIGATION / HASH ROUTING
// ---------------------------------------------------------------------
// This module and several view modules (people.js, timeline.js,
// workspace.js) import from each other in both directions: the views call
// navigateTo() to jump to another view, and this router calls back into
// each view's render function to draw it. That's a real circular import
// between ES modules — legal here because none of these bindings are used
// at module-evaluation time, only later inside event handlers, by which
// point every module involved has already finished initializing. Left as-is
// for this pure refactor; a cleaner dependency direction (e.g. views only
// ever going through the router, never each other) is a good candidate for
// a later cleanup pass, not this one.
import { state } from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderEvidenceList } from "./views/evidence.js";
import { renderPeople, renderLocations } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import { renderWorkspace } from "./views/workspace.js";

export type ViewName = "dashboard" | "evidence" | "people" | "timeline" | "workspace";

const VALID_VIEWS: ViewName[] = ["dashboard", "evidence", "people", "timeline", "workspace"];

// Reached only through the inline onclick="navigateTo(...)" buttons in
// index.html (and the same string generated dynamically in a few rendered
// views) — exported so main.js can attach it to `window`. It is also
// imported directly (module-to-module) by people.js, timeline.js and
// workspace.js, so it needs the export either way.
export function navigateTo(viewName: ViewName): void {
  window.location.hash = viewName;
  // handleHashChange() will pick this up via the hashchange listener
}

function isViewName(value: string): value is ViewName {
  return (VALID_VIEWS as string[]).includes(value);
}

// Attached as the hashchange listener (see main.js's setupEventListeners —
// Demo 8 removed a second, redundant registration that used to exist there
// too) and called once directly after the initial data load — needs to be
// exported.
export function handleHashChange(): void {
  const rawHash = window.location.hash.replace("#", "");
  const hash: ViewName = isViewName(rawHash) ? rawHash : "dashboard";
  state.currentPage = hash;

  // for-of instead of an index-based for: under noUncheckedIndexedAccess,
  // `sections[i]`/`navButtons[n]` would type as `Element | undefined` and
  // need a null check on every access — a for-of avoids that entirely by
  // binding each element directly, with identical runtime behavior.
  const sections = document.querySelectorAll(".view");
  for (const section of sections) {
    section.classList.remove("active");
  }
  document.getElementById("view-" + hash)?.classList.add("active");

  const navButtons = document.querySelectorAll(".nav-btn");
  for (const navButton of navButtons) {
    navButton.classList.remove("active");
    if (navButton.getAttribute("data-view") === hash) {
      navButton.classList.add("active");
    }
  }

  if (hash === "dashboard" && !state.viewRendered.dashboard) {
    renderDashboard();
    state.viewRendered.dashboard = true;
  } else if (hash === "evidence" && !state.viewRendered.evidence) {
    renderEvidenceList();
    state.viewRendered.evidence = true;
  } else if (hash === "people" && !state.viewRendered.people) {
    renderPeople();
    renderLocations();
    state.viewRendered.people = true;
  } else if (hash === "timeline" && !state.viewRendered.timeline) {
    renderTimeline();
    state.viewRendered.timeline = true;
  } else if (hash === "workspace") {
    // workspace is cheap enough that it always re-renders
    renderWorkspace();
  }
}
