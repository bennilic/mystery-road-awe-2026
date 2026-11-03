import type { CaseInfo } from "../../../js/types.ts";

export function CaseSummaryCard({ caseInfo }: { caseInfo: CaseInfo }) {
  return (
    <div className="case-summary-card">
      <h3>{caseInfo.title || "Case"}</h3>
      <p>
        <span className="badge badge-flagged">{(caseInfo.status || "unknown").toUpperCase()}</span>
      </p>
      <p>{caseInfo.summary}</p>
    </div>
  );
}
