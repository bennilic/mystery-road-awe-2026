import type { Evidence } from "../../../js/types.ts";

export type SortOrder = "date-desc" | "date-asc" | "title-asc" | "title-desc";

export interface EvidenceFilters {
  searchTerm: string;
  type: string;
  personId: string;
  locationId: string;
  status: string;
  relevance: string;
  sortOrder: SortOrder;
}

function timestampOf(item: Evidence): number {
  return new Date(item.timestamp).getTime();
}

const COMPARE_BY_SORT_ORDER: Record<SortOrder, (a: Evidence, b: Evidence) => number> = {
  "date-desc": (a, b) => timestampOf(b) - timestampOf(a),
  "date-asc": (a, b) => timestampOf(a) - timestampOf(b),
  "title-asc": (a, b) => a.title.localeCompare(b.title),
  "title-desc": (a, b) => b.title.localeCompare(a.title),
};

function matchesFilters(item: Evidence, filters: EvidenceFilters): boolean {
  const searchTerm = filters.searchTerm.toLowerCase().trim();
  const haystack = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
  // "" means "All" for every dropdown. evidence.json mixes letter case in
  // type/status/relevance, so those three compare lower-cased.
  return (
    haystack.includes(searchTerm) &&
    (filters.type === "" || item.type.toLowerCase() === filters.type) &&
    (filters.personId === "" || item.personIds.includes(filters.personId)) &&
    (filters.locationId === "" || item.locationIds.includes(filters.locationId)) &&
    (filters.status === "" || item.status.toLowerCase() === filters.status) &&
    (filters.relevance === "" || item.relevance.toLowerCase() === filters.relevance)
  );
}

// Pure: the list the page shows is computed from the full list and the
// filters. filter() returns a fresh array, so sorting it in place cannot
// reorder the master list (the Exercise 1 shared-array bug).
export function filterAndSortEvidence(
  evidence: readonly Evidence[],
  filters: EvidenceFilters,
): Evidence[] {
  return evidence
    .filter((item) => matchesFilters(item, filters))
    .sort(COMPARE_BY_SORT_ORDER[filters.sortOrder]);
}
