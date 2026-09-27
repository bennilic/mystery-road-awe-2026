// ---------------------------------------------------------------------
// GENERIC LOOKUP & FORMATTING HELPERS
// ---------------------------------------------------------------------
// Small, stateless helpers used from several view modules. None of them
// belongs conceptually to a single view, so they get their own module
// instead of being duplicated or attached arbitrarily to one view's file.
// All are exported as named exports — there are seven equally-weighted
// utilities here, with no single "primary" one that would justify a
// default export.
import { state } from "./state.ts";
import type { Evidence, Person, Location, EvidenceStatus, EvidenceRelevance } from "./types.ts";

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

// Demo 6: these three now return the real domain type (Evidence | null,
// etc.) instead of Demo 5's minimal `Identifiable | null` — every caller
// that reads .title, .avatar, .contains and so on off the result is now
// actually type-checked against the real shape, not just "has an id".
export function findEvidenceById(id: string): Evidence | null {
  return findById(state.allEvidence, id);
}

export function findPersonById(id: string): Person | null {
  return findById(state.allPeople, id);
}

export function findLocationById(id: string): Location | null {
  return findById(state.allLocations, id);
}

// Demo 6's ambiguous field: public/data/evidence.json's personIds is
// documented (see types.ts) as an array of Person ids, but E04 actually
// holds "Nova Byte" — a display name — instead of "nova-byte". The
// original JS quietly worked around this by matching against *both*
// person.id and person.name (see git history). Typing personIds as
// `PersonId[]` forced an explicit choice instead of leaving it implicit:
// either (a) keep the type loose enough to admit "id or name" and keep
// matching both here, or (b) normalize the data once, at the load
// boundary, so every consumer downstream can trust personIds actually
// contains ids. Chose (b) — dataLoading.ts's normalizePersonIds fixes this
// up right after both evidence.json and people.json have loaded — so this
// function only needs to compare ids, and no longer needs to know Person
// has a `name` field at all.
export function evidenceMentionsPerson(ev: Evidence, person: Person): boolean {
  return ev.personIds.includes(person.id);
}

export function formatDate(ts: string | number | null | undefined): number {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

// Demo 6 / Question 2 (types can't catch bad runtime JSON): the parameter
// here is typed as the closed `EvidenceStatus` union, but the actual
// public/data/evidence.json has one record with "Reviewed" (capitalized)
// instead of "reviewed" — a value the type says can't happen. Casting the
// fetch result `as Evidence[]` in dataLoading.ts doesn't validate
// anything at runtime, so that bad value sails straight through the type
// system. The .toLowerCase() below is the only actual defense against it;
// catching this for real would need runtime validation (e.g. a schema
// check on the parsed JSON), which is outside what static types alone do.
export function getStatusBadgeClass(status: EvidenceStatus | null | undefined): string {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
}

export function getRelevanceBadgeClass(relevance: EvidenceRelevance | null | undefined): string {
  // Relevance and review status are unrelated axes (an item can be
  // "unreviewed" and later turn out "relevant", or "reviewed" and
  // "irrelevant") — this must not fall back to a status-badge class. See
  // badge-relevance-unclear in styles.css, added specifically for this.
  // Same real-data caveat as getStatusBadgeClass above: evidence.json also
  // has a capitalized "Unknown", hence the .toLowerCase() staying in place
  // even though the type says relevance is already lowercase.
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-relevance-unclear";
}
