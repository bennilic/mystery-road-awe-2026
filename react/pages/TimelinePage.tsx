import { useCaseData, type CaseData } from "../data/CaseDataContext.tsx";
import { TimelineItem } from "../components/TimelineItem.tsx";
import { TimelineToolbar } from "../components/TimelineToolbar.tsx";

function TimelineContent({ data }: { data: CaseData }) {
  // Derived during render, never stored: oldest first, same as the vanilla default.
  const events = [...data.timeline].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const eventTypes = [...new Set(data.timeline.map((event) => event.type))];

  const locationLabel = (locationId: string): string => {
    const location = data.locations.find((candidate) => candidate.id === locationId);
    return location ? `${location.id} - ${location.name}` : locationId;
  };

  return (
    <>
      <TimelineToolbar
        personOptions={data.people.map((person) => ({ value: person.id, label: person.name }))}
        locationOptions={data.locations.map((location) => ({
          value: location.id,
          label: location.id,
        }))}
        typeOptions={eventTypes.map((type) => ({ value: type, label: type }))}
      />
      <div className="timeline-container">
        {events.length === 0 && <p>No timeline events match the current filters.</p>}
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            event={event}
            locationLabels={event.locationIds.map(locationLabel)}
          />
        ))}
      </div>
    </>
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
