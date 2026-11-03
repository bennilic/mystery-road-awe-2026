import { formatDate } from "../../../js/lookup.ts";
import { useBookmarks } from "../../shared/bookmarks/BookmarksContext.tsx";
import { Badge } from "../../shared/components/Badge.tsx";
import { relevanceVariant, statusVariant } from "../../shared/components/evidenceBadges.ts";
import type { Evidence } from "../../../js/types.ts";

interface EvidenceCardProps {
  item: Evidence;
  onOpen: (evidenceId: string) => void;
}

export function EvidenceCard({ item, onOpen }: EvidenceCardProps) {
  // Read straight from Context: EvidencePage and EvidenceContent no longer
  // carry the bookmark props just to hand them to this component.
  const { bookmarkedIds, toggleBookmark, canToggle } = useBookmarks();
  const isBookmarked = bookmarkedIds.includes(item.id);

  return (
    // React attaches this handler itself; there is no inline HTML attribute string
    // and no listener on a parent container to dispatch by event.target.
    <div className="evidence-card" onClick={() => onOpen(item.id)}>
      <button
        type="button"
        className={isBookmarked ? "bookmark-btn active" : "bookmark-btn"}
        aria-label={`Toggle bookmark for ${item.title}`}
        disabled={!canToggle}
        title={
          canToggle ? undefined : "Bookmarks are shared live and need a connection to the server."
        }
        onClick={(event) => {
          // The button sits inside the clickable card: without this the same
          // click would also open the detail panel.
          event.stopPropagation();
          toggleBookmark(item.id);
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
