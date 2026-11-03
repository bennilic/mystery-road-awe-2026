import type { Evidence } from "../../../js/types.ts";

// The one rule for "which evidence is bookmarked": an item is bookmarked when
// its id is in the id list. The Dashboard count and the Workspace list both
// call this, so they cannot disagree (e.g. over an id with no evidence behind it).
export function selectBookmarkedEvidence(
  evidence: readonly Evidence[],
  bookmarkedIds: readonly string[],
): Evidence[] {
  return evidence.filter((item) => bookmarkedIds.includes(item.id));
}
