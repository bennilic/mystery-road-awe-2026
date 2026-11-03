import { formatDate } from "../../../js/lookup.ts";
import { Badge } from "../../shared/components/Badge.tsx";
import { relevanceVariant, statusVariant } from "../../shared/components/evidenceBadges.ts";
import type { Evidence } from "../../../js/types.ts";

interface EvidenceCardProps {
  item: Evidence;
  isBookmarked: boolean;
  onOpen: (evidenceId: string) => void;
  onToggleBookmark: (evidenceId: string) => void;
}

export function EvidenceCard({ item, isBookmarked, onOpen, onToggleBookmark }: EvidenceCardProps) {
  return (
    // React attaches this handler itself; there is no inline HTML attribute string
    // and no listener on a parent container to dispatch by event.target.
    <div className="evidence-card" onClick={() => onOpen(item.id)}>
      <button
        type="button"
        className={isBookmarked ? "bookmark-btn active" : "bookmark-btn"}
        aria-label={`Toggle bookmark for ${item.title}`}
        onClick={(event) => {
          // The button sits inside the clickable card: without this the same
          // click would also open the detail panel.
          event.stopPropagation();
          onToggleBookmark(item.id);
        }}
      >
        <span className="bookmark-icon">{isBookmarked ? "★" : "☆"}</span>
      </button>
      <h3>{item.title}</h3>
      <div className="evidence-meta">
        {item.id} &middot; {item.type} &middot; {formatDate(item.timestamp)}
      </div>
      <div className="evidence-summary">{item.summary}</div>
      {item.tags.includes("critical") && <Badge variant="critical">Critical</Badge>}
      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
      <Badge variant={relevanceVariant(item.relevance)}>{item.relevance}</Badge>
      <div>
        {item.tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
