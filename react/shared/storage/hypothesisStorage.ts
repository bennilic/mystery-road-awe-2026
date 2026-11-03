import { STORAGE_KEY_HYPOTHESIS } from "../../../js/state.ts";
import type { HypothesisDraft } from "../../../js/types.ts";

export const EMPTY_HYPOTHESIS_DRAFT: HypothesisDraft = {
  suspectId: "",
  nature: "",
  evidenceIds: [],
  confidence: "50",
  explanation: "",
  alternative: "",
  savedAt: "",
};

export function readHypothesisDraft(): HypothesisDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
    if (!raw) return EMPTY_HYPOTHESIS_DRAFT;
    const parsed = JSON.parse(raw) as Partial<HypothesisDraft>;
    return {
      suspectId: parsed.suspectId || "",
      nature: parsed.nature || "",
      evidenceIds: Array.isArray(parsed.evidenceIds) ? parsed.evidenceIds : [],
      confidence: parsed.confidence || "50",
      explanation: parsed.explanation || "",
      alternative: parsed.alternative || "",
      savedAt: parsed.savedAt || "",
    };
  } catch (error) {
    console.warn("Could not read stored hypothesis draft, starting with an empty form", error);
    return EMPTY_HYPOTHESIS_DRAFT;
  }
}

// Throws if the browser refuses the write; the form shows the reason.
export function writeHypothesisDraft(draft: HypothesisDraft): void {
  localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(draft));
}
