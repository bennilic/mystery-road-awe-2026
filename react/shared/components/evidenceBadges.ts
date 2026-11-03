import type { BadgeVariant } from "./Badge.tsx";

// evidence.json has capitalised "Reviewed" / "Unknown" once each, so compare
// case-insensitively (same defence as the vanilla getStatusBadgeClass).
export function statusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase();
  if (normalized === "reviewed") return "reviewed";
  if (normalized === "flagged") return "flagged";
  return "unreviewed";
}

export function relevanceVariant(relevance: string): BadgeVariant {
  return relevance.toLowerCase() === "relevant" ? "relevant" : "relevance-unclear";
}
