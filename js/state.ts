// ---------------------------------------------------------------------
// SHARED STATE
// ---------------------------------------------------------------------
// All the values that used to be top-level `var`s in app.js live here as
// properties on a single mutable object instead of as separate module-level
// `let` bindings. Reason: an ES module import binding is read-only in the
// importing module (`import { allEvidence } from "./state.ts"; allEvidence = x`
// throws "Assignment to constant variable" style errors) — only the module
// that *declared* a binding may reassign it. Every other view/feature module
// in this app needs to reassign these values (e.g. evidence.js does
// `state.allEvidence = data`), not just read them, so a single exported
// object whose *properties* get mutated is the natural fit: mutating a
// property of an imported object is fine, only rebinding the imported name
// itself is not.
//
// This is a structural consequence of the module split (see EXERCISE_1.md
// Demo 1's question about `allEvidence`), not a stylistic cleanup — the
// values, shape, and semantics are identical to the old globals.
//
// Demo 6: every collection now carries its real domain type from
// js/types.ts, instead of the empty-literal `[]`/`{}` that TypeScript could
// only infer as `never[]`/`{}` (see lookup.ts's and storage.ts's Demo 5
// workarounds, both removed in this same pass now that the real types
// exist).
import type { Evidence, Person, Location, TimelineEvent, CaseInfo } from "./types.ts";

export type ViewId = "dashboard" | "evidence" | "people" | "timeline" | "workspace";

interface AppState {
  allEvidence: Evidence[];
  filteredEvidence: Evidence[];
  selectedEvidence: Evidence | null;
  bookmarks: string[];
  currentPage: ViewId;

  allPeople: Person[];
  allLocations: Location[];
  allTimeline: TimelineEvent[];
  // null, not `CaseInfo | {}`: case.json genuinely hasn't loaded yet
  // during the brief window before loadCorePeopleAndLocations resolves,
  // and null makes every consumer (dashboard.ts) say so explicitly via
  // `state.caseData?.title`, instead of a `{}` that quietly satisfied the
  // type checker without ever satisfying CaseInfo's actual shape.
  caseData: CaseInfo | null;

  currentPeopleTab: "people" | "locations";
  loadingStepsRemaining: number;

  evidenceViewLoading: boolean;

  viewRendered: Record<ViewId, boolean>;

  notesStore: Record<string, string>;
}

export const state: AppState = {
  allEvidence: [],
  filteredEvidence: [],
  selectedEvidence: null,
  bookmarks: [],
  currentPage: "dashboard",

  allPeople: [],
  allLocations: [],
  allTimeline: [],
  caseData: null,

  currentPeopleTab: "people",
  loadingStepsRemaining: 2,

  evidenceViewLoading: true,

  viewRendered: {
    dashboard: false,
    evidence: false,
    people: false,
    timeline: false,
    workspace: false,
  },

  notesStore: {},
};

// Pure constants (never reassigned anywhere in the original app) — plain
// named exports rather than object properties, since nothing ever needs to
// treat these as part of the mutable state singleton.
export const STORAGE_KEY_BOOKMARKS = "remotion_bookmarks";
export const STORAGE_KEY_NOTES = "remotion_notes";
export const STORAGE_KEY_HYPOTHESIS = "remotion_hypothesis";
