import type { Evidence, Person } from "../../../js/types.ts";
import { evidenceMentionsPerson } from "../../../js/lookup.ts";

// E04 stores "Nova Byte" (a display name) in personIds instead of the id; the
// vanilla app repairs that once at load time (normalizePersonIds). The React
// provider does not, so the count accepts either to stay identical.
export function countEvidenceForPerson(evidence: Evidence[], person: Person): number {
  return evidence.filter(
    (item) => evidenceMentionsPerson(item, person) || item.personIds.includes(person.name),
  ).length;
}
