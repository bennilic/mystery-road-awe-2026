import { useSearchParams } from "react-router";
import { TIMELINE_PERSON_PARAM } from "../../shared/routing/paths.ts";
import { useCaseData, type CaseData } from "../../shared/data/CaseDataContext.tsx";
import { TimelineView } from "./TimelineView.tsx";

// Feature component: sorts the events, resolves location ids to labels and
// builds the filter options from the case data.
function TimelineContent({ data }: { data: CaseData }) {
  // Read from the URL on render (no useState): /timeline?person=nova-byte opens
  // the page already narrowed to that person. An id that matches nobody is
  // reported, not silently ignored.
  const [searchParams] = useSearchParams();
  const requestedPersonId = searchParams.get(TIMELINE_PERSON_PARAM) ?? "";
  const isKnownPerson = data.people.some((person) => person.id === requestedPersonId);
  const activePersonId = isKnownPerson ? requestedPersonId : "";
  const unknownPersonNotice =
    requestedPersonId !== "" && !isKnownPerson
      ? `There is no person with the id "${requestedPersonId}", so all events are shown. Pick a person from the filter or from the People page.`
      : undefined;

  // Derived during render, never stored: filtered, then oldest first, same as the vanilla default.
  const visibleEvents = data.timeline.filter(
    (event) => activePersonId === "" || event.personIds.includes(activePersonId),
  );
  const sortedEvents = [...visibleEvents].sort(
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
      initialPersonId={activePersonId}
      notice={unknownPersonNotice}
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
