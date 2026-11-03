import { getStatusBadgeClass } from "../../../js/lookup.ts";
import type { Evidence } from "../../../js/types.ts";

export function RecentEvidenceList({ items }: { items: Evidence[] }) {
  return (
    <div className="dashboard-panel">
      <h3>Recent evidence</h3>
      {items.length === 0 && <p>No evidence loaded yet.</p>}
      {items.map((item) => (
        <div className="mini-list-item" key={item.id}>
          <strong>{item.id}</strong> &mdash; {item.title}{" "}
          <span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span>
        </div>
      ))}
    </div>
  );
}
