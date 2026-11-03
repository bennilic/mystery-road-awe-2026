import type { Location, Person, PersonId } from "../../js/types.ts";
import { LocationCard } from "./LocationCard.tsx";
import { PersonCard } from "./PersonCard.tsx";
import { TabBar, type PeopleTab } from "./TabBar.tsx";

interface PeopleLocationsViewProps {
  activeTab: PeopleTab;
  people: Person[];
  locations: Location[];
  evidenceCountByPersonId: Record<PersonId, number>;
}

// Presentational: everything arrives through props, so the same props always
// give the same output. It does not know where the data came from, which tab
// the URL asked for, or how evidence is matched to people.
export function PeopleLocationsView({
  activeTab,
  people,
  locations,
  evidenceCountByPersonId,
}: PeopleLocationsViewProps) {
  return (
    <>
      <TabBar activeTab={activeTab} />
      {activeTab === "people" ? (
        <div className="people-grid">
          {/* `.length === 0` is a boolean, so `&&` can never print a stray 0 */}
          {people.length === 0 && <p>No people are on file for this case.</p>}
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              relatedEvidenceCount={evidenceCountByPersonId[person.id] ?? 0}
            />
          ))}
        </div>
      ) : (
        <div className="locations-grid">
          {locations.length === 0 && <p>No locations are on file for this case.</p>}
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </>
  );
}
