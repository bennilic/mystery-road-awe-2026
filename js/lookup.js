// ---------------------------------------------------------------------
// GENERIC LOOKUP & FORMATTING HELPERS
// ---------------------------------------------------------------------
// Small, stateless helpers used from several view modules. None of them
// belongs conceptually to a single view, so they get their own module
// instead of being duplicated or attached arbitrarily to one view's file.
// All are exported as named exports — there are seven equally-weighted
// utilities here, with no single "primary" one that would justify a
// default export.
import { state } from "./state.js";

export function findEvidenceById(id) {
  for (let i = 0; i < state.allEvidence.length; i++) {
    if (state.allEvidence[i].id === id) return state.allEvidence[i];
  }
  return null;
}

export function findPersonById(id) {
  for (let i = 0; i < state.allPeople.length; i++) {
    if (state.allPeople[i].id === id) return state.allPeople[i];
  }
  return null;
}

export function findLocationById(id) {
  for (let i = 0; i < state.allLocations.length; i++) {
    if (state.allLocations[i].id === id) return state.allLocations[i];
  }
  return null;
}

export function evidenceMentionsPerson(ev, person) {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
}

export function formatDate(ts) {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

export function getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
}

export function getRelevanceBadgeClass(relevance) {
  // Relevance and review status are unrelated axes (an item can be
  // "unreviewed" and later turn out "relevant", or "reviewed" and
  // "irrelevant") — this must not fall back to a status-badge class. See
  // badge-relevance-unclear in styles.css, added specifically for this.
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-relevance-unclear";
}
