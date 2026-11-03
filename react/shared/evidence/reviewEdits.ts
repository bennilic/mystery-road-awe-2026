import type { Evidence, EvidenceRelevance, EvidenceStatus } from "../../../js/types.ts";

// What the investigator changed in the detail panel, keyed by evidence id.
// The loaded evidence list is never modified; edits are layered on top.
export type ReviewEdit = { status?: EvidenceStatus; relevance?: EvidenceRelevance };
export type ReviewEditsByEvidenceId = Record<string, ReviewEdit>;

// Returns new objects for edited items and the original objects for the rest.
export function applyReviewEdits(
  evidence: readonly Evidence[],
  edits: ReviewEditsByEvidenceId,
): Evidence[] {
  return evidence.map((item) => {
    const edit = edits[item.id];
    return edit ? { ...item, ...edit } : item;
  });
}
