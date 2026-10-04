import { formatDate } from "../../js/lookup.ts";
import type { TimelineEvent } from "../../js/types.ts";

export function RecentTimelineList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="dashboard-panel">
      <h3>Recent timeline events</h3>
      {events.length === 0 && <p>No timeline events loaded yet.</p>}
      {events.map((event) => (
        <div className="mini-list-item" key={event.id}>
          <strong>{formatDate(event.time)}</strong>
          <br />
          {event.title}
        </div>
      ))}
    </div>
  );
}
