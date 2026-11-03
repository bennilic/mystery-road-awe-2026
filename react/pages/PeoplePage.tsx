import { useCaseData, type CaseData } from "../data/CaseDataContext.tsx";
import { PersonCard } from "../components/PersonCard.tsx";
import { LocationCard } from "../components/LocationCard.tsx";
import { TabBar, type PeopleTab } from "../components/TabBar.tsx";
import type { Evidence, Person } from "../../js/types.ts";
import { evidenceMentionsPerson } from "../../js/lookup.ts";

// Reading a query parameter ONCE to decide what to show initially is allowed
// in this exercise; the tab becomes a real route in Demo 8.
function readInitialTab(): PeopleTab {
  const requested = new URLSearchParams(window.location.search).get("tab");
  return requested === "locations" ? "locations" : "people";
}

// E04 stores "Nova Byte" (a display name) in personIds instead of the id; the
// vanilla app repairs that once at load time (normalizePersonIds). The React
// provider does not, so the count accepts either to stay identical.
function countEvidenceForPerson(evidence: Evidence[], person: Person): number {
  return evidence.filter(
    (item) => evidenceMentionsPerson(item, person) || item.personIds.includes(person.name),
  ).length;
}

function PeopleContent({ data }: { data: CaseData }) {
  const activeTab = readInitialTab();

  return (
    <>
      <TabBar activeTab={activeTab} />
      {activeTab === "people" ? (
        <div className="people-grid">
          {/* `.length === 0` is a boolean, so `&&` can never print a stray 0 */}
          {data.people.length === 0 && <p>No people are on file for this case.</p>}
          {data.people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              relatedEvidenceCount={countEvidenceForPerson(data.evidence, person)}
            />
          ))}
        </div>
      ) : (
        <div className="locations-grid">
          {data.locations.length === 0 && <p>No locations are on file for this case.</p>}
          {data.locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </>
  );
}

export function PeoplePage() {
  const caseData = useCaseData();

  return (
    <section className="view active">
      <h2>People &amp; Locations</h2>
      {caseData.status === "loading" && <p>Loading case file&hellip;</p>}
      {caseData.status === "error" && (
        <p role="alert">
          The case file could not be loaded ({caseData.message}). Check that the dev server is
          running and reload the page.
        </p>
      )}
      {caseData.status === "ready" && <PeopleContent data={caseData.data} />}
    </section>
  );
}
