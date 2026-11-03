import { useCaseData, type CaseData } from "../../shared/data/CaseDataContext.tsx";
import { PeopleLocationsView } from "./PeopleLocationsView.tsx";
import type { PeopleTab } from "./TabBar.tsx";
import { countEvidenceForPerson } from "./countEvidenceForPerson.ts";

// Feature component: knows where the data lives (case-data context), how the
// URL picks the tab, and how evidence is matched to people.
function PeopleContent({ data, tab }: { data: CaseData; tab: PeopleTab }) {
  const evidenceCountByPersonId = Object.fromEntries(
    data.people.map((person) => [person.id, countEvidenceForPerson(data.evidence, person)]),
  );

  return (
    <PeopleLocationsView
      activeTab={tab}
      people={data.people}
      locations={data.locations}
      evidenceCountByPersonId={evidenceCountByPersonId}
    />
  );
}

interface PeoplePageProps {
  tab: PeopleTab;
}

export function PeoplePage({ tab }: PeoplePageProps) {
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
      {caseData.status === "ready" && <PeopleContent data={caseData.data} tab={tab} />}
    </section>
  );
}
