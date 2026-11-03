import type { ReactNode } from "react";
import { useCaseData, type CaseData } from "./CaseDataContext.tsx";

// The loading / error / ready switch every page used to repeat (Exercise 4
// Demo 10 Q3 flagged it). Children only run once the data exists, so the
// page content never has to handle "not loaded yet".
export function CaseDataGate({ children }: { children: (data: CaseData) => ReactNode }) {
  const caseData = useCaseData();

  if (caseData.status === "loading") return <p>Loading case file&hellip;</p>;
  if (caseData.status === "error") {
    return (
      <p role="alert">
        The case file could not be loaded ({caseData.message}). Check that the dev server is running
        and reload the page.
      </p>
    );
  }
  return <>{children(caseData.data)}</>;
}
