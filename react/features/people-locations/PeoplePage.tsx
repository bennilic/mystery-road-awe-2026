import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
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
  return (
    <section className="view active">
      <h2>People &amp; Locations</h2>
      <CaseDataGate>{(data) => <PeopleContent data={data} tab={tab} />}</CaseDataGate>
    </section>
  );
}
