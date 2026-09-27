// ---------------------------------------------------------------------
// DOMAIN DATA MODEL
// ---------------------------------------------------------------------
// Mirrors the shape of public/data/*.json exactly (verified against every
// record in each file, not just the first one — see the git history for
// Demo 6). `interface` rather than `type` for these four object shapes:
// they're plain, non-union object records that nothing here needs to
// intersect or map over, so either would work, but `interface` reads as
// the more conventional choice for "this is a named domain entity" and
// keeps every declaration in this file visually consistent. It doesn't
// materially matter for these specific shapes (see Demo 6's Q3 answer in
// the presentation notes).

export type PersonId = string;
export type LocationId = string;
export type EvidenceId = string;
export type TimelineEventId = string;

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  speciality: string;
  responsibilities: string[];
  statement: string;
  background: string;
  avatar: string;
}

export interface Location {
  id: LocationId;
  name: string;
  description: string;
  contains: string[];
}

// Evidence.status and .relevance are typed as closed literal unions
// because the app actually branches on them (lookup.ts's
// getStatusBadgeClass/getRelevanceBadgeClass) — a typo or a new status
// value should be a compile error at every call site, not a value that
// silently falls through to a default CSS class. Evidence.type stays a
// plain `string`: nothing in the app switches on it, it's only ever
// displayed as a tag, so a closed union would add ceremony without
// catching any real bug — and the real data already has a case-varying
// outlier ("Test-Report" vs "test-report") that a union would just be
// wrong about.
export type EvidenceStatus = "unreviewed" | "reviewed" | "flagged";
export type EvidenceRelevance = "unknown" | "relevant" | "irrelevant";

export interface Evidence {
  id: EvidenceId;
  type: string;
  title: string;
  timestamp: string;
  summary: string;
  content: string;
  // Every item in public/data/evidence.json actually holds a Person id
  // here EXCEPT E04, which holds "Nova Byte" — a display name — instead
  // of "nova-byte". See dataLoading.ts's normalizePersonIds, and Demo 6's
  // presentation notes for the decision this forced.
  personIds: PersonId[];
  locationIds: LocationId[];
  tags: string[];
  status: EvidenceStatus;
  relevance: EvidenceRelevance;
  // Not present in evidence.json — set by applyStoredBookmarkFlags right
  // after load (from the separate state.bookmarks id list) and flipped by
  // evidence.ts's handleBookmarkClick. Optional because it doesn't exist
  // on a freshly-fetched record until that first pass runs.
  bookmarked?: boolean;
}

export type TimelineEventType =
  | "access"
  | "communication"
  | "decision"
  | "incident"
  | "infrastructure"
  | "maintenance"
  | "observation"
  | "release"
  | "report"
  | "software-change"
  | "system";

export type TimelineCertainty = "confirmed" | "contradictory" | "reported";

export interface TimelineEvent {
  id: TimelineEventId;
  time: string;
  title: string;
  description: string;
  type: TimelineEventType;
  certainty: TimelineCertainty;
  personIds: PersonId[];
  locationIds: LocationId[];
  evidenceIds: EvidenceId[];
}

export interface CaseInfo {
  caseId: string;
  title: string;
  subtitle: string;
  status: string;
  opened: string;
  summary: string;
  location: string;
  leadInvestigator: string;
  notes: string;
}

// Not fetched from public/data/ — this is the shape workspace.ts
// serializes to/from localStorage (STORAGE_KEY_HYPOTHESIS). `confidence`
// is a string because it round-trips through an <input type="range">'s
// .value, which is always a string.
export interface HypothesisDraft {
  suspectId: string;
  nature: string;
  evidenceIds: EvidenceId[];
  confidence: string;
  explanation: string;
  alternative: string;
  savedAt: string;
}
