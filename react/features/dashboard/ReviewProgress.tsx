export function ReviewProgress({ progressPercent }: { progressPercent: number }) {
  return (
    <div className="dashboard-panel">
      <h3>Review progress</h3>
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: `${progressPercent}%` }} />
      </div>
      <p>{progressPercent}% of evidence reviewed</p>
    </div>
  );
}
