import { useCaseData, type CaseData } from "../data/CaseDataContext.tsx";
import { PersonCard } from "../components/PersonCard.tsx";
import { LocationCard } from "../components/LocationCard.tsx";
import { evidenceMentionsPerson } from "../../js/lookup.ts";

// Demo 1 only proves the component API with ONE card of each kind; mapping
// whole collections is Demo 3.
function PeopleContent({ data }: { data: CaseData }) {
  const firstPerson = data.people[0];
  const firstLocation = data.locations[0];
  if (!firstPerson || !firstLocation) return null;

  const relatedEvidenceCount = data.evidence.filter((item) =>
    evidenceMentionsPerson(item, firstPerson),
  ).length;

  return (
    <>
      <div className="people-grid">
        <PersonCard person={firstPerson} relatedEvidenceCount={relatedEvidenceCount} />
      </div>
      <div className="locations-grid">
        <LocationCard location={firstLocation} />
      </div>
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
