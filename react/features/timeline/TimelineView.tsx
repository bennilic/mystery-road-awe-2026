import type { TimelineEvent } from "../../../js/types.ts";
import { TimelineItem } from "./TimelineItem.tsx";
import { TimelineToolbar, type FilterOption } from "./TimelineToolbar.tsx";

export interface TimelineEntry {
  event: TimelineEvent;
  locationLabels: string[];
}

interface TimelineViewProps {
  initialPersonId: string;
  notice: string | undefined;
  entries: TimelineEntry[];
  personOptions: FilterOption[];
  locationOptions: FilterOption[];
  typeOptions: FilterOption[];
}

// Presentational: receives already sorted entries and ready-made option lists.
export function TimelineView({
  initialPersonId,
  notice,
  entries,
  personOptions,
  locationOptions,
  typeOptions,
}: TimelineViewProps) {
  return (
    <>
      <TimelineToolbar
        initialPersonId={initialPersonId}
        personOptions={personOptions}
        locationOptions={locationOptions}
        typeOptions={typeOptions}
      />
      {notice && <p role="status">{notice}</p>}
      <div className="timeline-container">
        {entries.length === 0 && <p>No timeline events match the current filters.</p>}
        {entries.map((entry) => (
          <TimelineItem
            key={entry.event.id}
            event={entry.event}
            locationLabels={entry.locationLabels}
          />
        ))}
      </div>
    </>
  );
}
