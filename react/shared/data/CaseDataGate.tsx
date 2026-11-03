import type { ReactNode } from "react";
import { useCaseData, useReloadCaseData, type CaseData } from "./CaseDataContext.tsx";

// The loading / error / ready switch every page used to repeat (Exercise 4
// Demo 10 Q3 flagged it). Children only run once the data exists, so the
// page content never has to handle "not loaded yet".
//
// Each state looks different on purpose (Exercise 6, Demo 6): loading is a
// spinner with role="status", error is a red box with role="alert" and a retry
// button, and "loaded but empty" is not decided here at all: it is a normal
// ready state that the page itself explains (see EvidencePage).
export function CaseDataGate({ children }: { children: (data: CaseData) => ReactNode }) {
  const caseData = useCaseData();
  const reload = useReloadCaseData();

  if (caseData.status === "loading") {
    return (
      <div className="evidence-loading" role="status" data-state="loading">
        <div className="spinner" aria-hidden="true" />
        Loading case file&hellip;
      </div>
    );
  }
  if (caseData.status === "error") {
    return (
      <div className="data-state-error" role="alert" data-state="error">
        <strong>The case file could not be loaded.</strong>
        <p>{caseData.message}</p>
        <p>Check that the backend is running (npm run server), then try again.</p>
        <button type="button" className="btn btn-primary" onClick={() => reload()}>
          Try again
        </button>
      </div>
    );
  }
  return <>{children(caseData.data)}</>;
}
