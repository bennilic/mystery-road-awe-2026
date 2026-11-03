import type { EvidenceFilters, SortOrder } from "./filterEvidence.ts";

// The dropdown/text filters; the sort order has its own action.
export type FilterField = Exclude<keyof EvidenceFilters, "sortOrder">;

export type EvidenceFiltersAction =
  | { type: "SET_FILTER"; field: FilterField; value: string }
  | { type: "SET_SORT"; sortOrder: SortOrder }
  | { type: "CLEAR_FILTERS" };

export const INITIAL_EVIDENCE_FILTERS: EvidenceFilters = {
  searchTerm: "",
  type: "",
  personId: "",
  locationId: "",
  status: "",
  relevance: "",
  sortOrder: "date-desc",
};

// Pure: (state, action) -> next state. Returns new objects, never edits `state`.
export function evidenceFiltersReducer(
  state: EvidenceFilters,
  action: EvidenceFiltersAction,
): EvidenceFilters {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, [action.field]: action.value };
    case "SET_SORT":
      return { ...state, sortOrder: action.sortOrder };
    case "CLEAR_FILTERS":
      // One line resets every field, including any field added later.
      return INITIAL_EVIDENCE_FILTERS;
  }
}
