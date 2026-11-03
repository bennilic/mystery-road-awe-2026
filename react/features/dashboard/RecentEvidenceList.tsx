import { Badge } from "../../shared/components/Badge.tsx";
import { statusVariant } from "../../shared/components/evidenceBadges.ts";
import type { Evidence } from "../../../js/types.ts";

export function RecentEvidenceList({ items }: { items: Evidence[] }) {
  return (
    <div className="dashboard-panel">
      <h3>Recent evidence</h3>
      {items.length === 0 && <p>No evidence loaded yet.</p>}
      {items.map((item) => (
        <div className="mini-list-item" key={item.id}>
          <strong>{item.id}</strong> &mdash; {item.title}{" "}
          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
        </div>
      ))}
    </div>
  );
}
