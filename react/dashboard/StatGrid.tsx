interface StatCardProps {
  value: number;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

interface StatGridProps {
  evidenceCount: number;
  peopleCount: number;
  locationCount: number;
  bookmarkCount: number;
  reviewedCount: number;
}

export function StatGrid(props: StatGridProps) {
  return (
    <div className="stat-grid">
      <StatCard value={props.evidenceCount} label="Evidence items" />
      <StatCard value={props.peopleCount} label="People" />
      <StatCard value={props.locationCount} label="Locations" />
      <StatCard value={props.bookmarkCount} label="Bookmarked" />
      <StatCard value={props.reviewedCount} label="Reviewed" />
    </div>
  );
}
