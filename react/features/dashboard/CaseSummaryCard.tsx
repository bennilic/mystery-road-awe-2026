import { Badge } from "../../shared/components/Badge.tsx";
import type { CaseInfo } from "../../../js/types.ts";

export function CaseSummaryCard({ caseInfo }: { caseInfo: CaseInfo }) {
  return (
    <div className="case-summary-card">
      <h3>{caseInfo.title || "Case"}</h3>
      <p>
        <Badge variant="flagged">{(caseInfo.status || "unknown").toUpperCase()}</Badge>
      </p>
      <p>{caseInfo.summary}</p>
    </div>
  );
}
