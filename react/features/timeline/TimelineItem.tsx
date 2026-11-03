import { formatDate } from "../../../js/lookup.ts";
import { Badge, type BadgeVariant } from "../../shared/components/Badge.tsx";
import type { TimelineCertainty, TimelineEvent } from "../../../js/types.ts";

// Lookup technique: certainty -> badge variant. The Record type makes the
// compiler flag any new certainty value that has no badge yet.
const CERTAINTY_BADGE_VARIANT: Record<TimelineCertainty, BadgeVariant> = {
  confirmed: "reviewed",
  contradictory: "critical",
  reported: "flagged",
};

interface TimelineItemProps {
  event: TimelineEvent;
  // Already resolved to display text by the page ("L01 - Laboratory"), so this
  // component does not need to know how locations are looked up.
  locationLabels: string[];
}

export function TimelineItem({ event, locationLabels }: TimelineItemProps) {
  return (
    <div className={`timeline-event certainty-${event.certainty}`}>
      <div className="timeline-time">
        {formatDate(event.time)}&nbsp;&middot;&nbsp;
        <Badge variant={CERTAINTY_BADGE_VARIANT[event.certainty]}>{event.certainty}</Badge>
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      {locationLabels.length > 0 && (
        <p className="evidence-meta">Location: {locationLabels.join(", ")}</p>
      )}
      {event.evidenceIds.map((evidenceId) => (
        <button key={evidenceId} type="button" className="evidence-link-btn">
          View {evidenceId}
        </button>
      ))}
    </div>
  );
}
