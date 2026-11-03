import { useCaseData, type CaseData } from "../data/CaseDataContext.tsx";
import { TimelineView } from "../components/TimelineView.tsx";

// Feature component: sorts the events, resolves location ids to labels and
// builds the filter options from the case data.
function TimelineContent({ data }: { data: CaseData }) {
  // Derived during render, never stored: oldest first, same as the vanilla default.
  const sortedEvents = [...data.timeline].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const eventTypes = [...new Set(data.timeline.map((event) => event.type))];

  const locationLabel = (locationId: string): string => {
    const location = data.locations.find((candidate) => candidate.id === locationId);
    return location ? `${location.id} - ${location.name}` : locationId;
  };

  return (
    <TimelineView
      entries={sortedEvents.map((event) => ({
        event,
        locationLabels: event.locationIds.map(locationLabel),
      }))}
      personOptions={data.people.map((person) => ({ value: person.id, label: person.name }))}
      locationOptions={data.locations.map((location) => ({
        value: location.id,
        label: location.id,
      }))}
      typeOptions={eventTypes.map((type) => ({ value: type, label: type }))}
    />
  );
}

export function TimelinePage() {
  const caseData = useCaseData();

  return (
    <section className="view active">
      <h2>Investigation Timeline</h2>
      {caseData.status === "loading" && <p>Loading case file&hellip;</p>}
      {caseData.status === "error" && (
        <p role="alert">
          The case file could not be loaded ({caseData.message}). Check that the dev server is
          running and reload the page.
        </p>
      )}
      {caseData.status === "ready" && <TimelineContent data={caseData.data} />}
    </section>
  );
}
