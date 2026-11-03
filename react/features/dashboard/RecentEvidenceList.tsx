import { Badge, type BadgeVariant } from "../../shared/components/Badge.tsx";
import type { Evidence } from "../../../js/types.ts";

// evidence.json has one capitalised "Reviewed", so compare case-insensitively
// (same defence as the vanilla getStatusBadgeClass).
function statusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase();
  if (normalized === "reviewed") return "reviewed";
  if (normalized === "flagged") return "flagged";
  return "unreviewed";
}

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
