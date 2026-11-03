import { Link } from "react-router";
import { openEvidencePath } from "../../shared/routing/paths.ts";
import type { Evidence } from "../../../js/types.ts";

export function BookmarkedEvidenceList({ items }: { items: Evidence[] }) {
  return (
    <div id="bookmarksList" className="bookmarks-list">
      {items.length === 0 && (
        <p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>
      )}
      {items.map((item) => (
        <div className="mini-list-item" key={item.id}>
          <strong>{item.id}</strong> &mdash; {item.title}{" "}
          <Link className="btn btn-small btn-secondary" to={openEvidencePath(item.id)}>
            Open
          </Link>
        </div>
      ))}
    </div>
  );
}
