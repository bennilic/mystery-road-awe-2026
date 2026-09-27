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

// state.js (Demo 6 converts it) still exports its collections without
// domain types, so state.allEvidence etc. resolve to `any[]` — casting
// through this minimal structural type instead of leaving that `any` in
// place is the whole point of avoiding `any` in *this* module: it commits
// to the one fact these finder functions actually rely on (every item has
// a string `id`) without pretending to know the full Evidence/Person/
// Location shape, which is Demo 6's job.
interface Identifiable {
  id: string;
}

function findById<T extends Identifiable>(list: T[], id: string): T | null {
  // A for-of loop (rather than the original index-based for) sidesteps
  // noUncheckedIndexedAccess entirely: `list[i]` under that flag types as
  // `T | undefined` (TS can't prove the index is in range), while a for-of
  // binds each element as plain `T` since iteration can't run past the end.
  for (const item of list) {
    if (item.id === id) return item;
  }
  return null;
}

export function findEvidenceById(id: string): Identifiable | null {
  return findById(state.allEvidence as Identifiable[], id);
}

export function findPersonById(id: string): Identifiable | null {
  return findById(state.allPeople as Identifiable[], id);
}

export function findLocationById(id: string): Identifiable | null {
  return findById(state.allLocations as Identifiable[], id);
}

interface EvidenceLike {
  personIds?: string[];
}

interface PersonLike {
  id: string;
  name: string;
}

export function evidenceMentionsPerson(ev: EvidenceLike, person: PersonLike): boolean {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
}

export function formatDate(ts: string | number | null | undefined): string {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
}

export function getRelevanceBadgeClass(relevance: string | null | undefined): string {
  // Relevance and review status are unrelated axes (an item can be
  // "unreviewed" and later turn out "relevant", or "reviewed" and
  // "irrelevant") — this must not fall back to a status-badge class. See
  // badge-relevance-unclear in styles.css, added specifically for this.
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-relevance-unclear";
}
