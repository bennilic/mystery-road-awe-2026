import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Header } from "../shell/Header.tsx";
import { Footer } from "../shell/Footer.tsx";
import { DevPanel } from "../shell/DevPanel.tsx";
import { CaseDataProvider } from "../shared/data/CaseDataContext.tsx";
import { LiveWorkspaceProvider } from "../shared/live/LiveWorkspaceContext.tsx";
import { readNotes, writeNotes } from "../shared/storage/noteStorage.ts";
import type { ReviewEdit, ReviewEditsByEvidenceId } from "../shared/evidence/reviewEdits.ts";
import { describeStorageFailure } from "../shared/storage/describeStorageFailure.ts";
import { PATHS } from "../shared/routing/paths.ts";
import { titleForPath, useDocumentTitle } from "../shared/routing/useDocumentTitle.ts";
import { DashboardPage } from "../features/dashboard/DashboardPage.tsx";
import { PeoplePage } from "../features/people-locations/PeoplePage.tsx";
import { PersonDetailPage } from "../features/people-locations/PersonDetailPage.tsx";
import { EvidencePage } from "../features/evidence/EvidencePage.tsx";
import { WorkspacePage } from "../features/workspace/WorkspacePage.tsx";
import { TimelinePage } from "../features/timeline/TimelinePage.tsx";

export function App() {
  return (
    <CaseDataProvider>
      <LiveWorkspaceProvider>
        <AppBody />
      </LiveWorkspaceProvider>
    </CaseDataProvider>
  );
}

// Owns the state that is still passed down as props: notes and review edits.
// Bookmarks are shared live state from the server (Exercise 7).
function AppBody() {
  const [notes, setNotes] = useState(readNotes);
  // In memory only, like the vanilla app: review edits are lost on reload.
  const [reviewEdits, setReviewEdits] = useState<ReviewEditsByEvidenceId>({});
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  useDocumentTitle(titleForPath(useLocation().pathname));

  function handleSaveNote(evidenceId: string, text: string) {
    const nextNotes = { ...notes, [evidenceId]: text };
    setNotes(nextNotes);
    try {
      writeNotes(nextNotes);
      setStorageNotice(null);
    } catch (error) {
      setStorageNotice(describeStorageFailure("Your note", error));
    }
  }

  function handleChangeReview(evidenceId: string, change: ReviewEdit) {
    setReviewEdits((previous) => ({
      ...previous,
      [evidenceId]: { ...previous[evidenceId], ...change },
    }));
  }

  return (
    <>
      <Header />
      <main id="app" className="app-main">
        {storageNotice && <p role="alert">{storageNotice}</p>}
        <Routes>
          <Route path="/" element={<Navigate to={PATHS.dashboard} replace />} />
          <Route path={PATHS.dashboard} element={<DashboardPage reviewEdits={reviewEdits} />} />
          <Route
            path={PATHS.evidence}
            element={
              <EvidencePage
                notes={notes}
                onSaveNote={handleSaveNote}
                reviewEdits={reviewEdits}
                onChangeReview={handleChangeReview}
              />
            }
          />
          <Route path={PATHS.team} element={<Navigate to={PATHS.people} replace />} />
          <Route path={PATHS.people} element={<PeoplePage tab="people" />} />
          <Route path={`${PATHS.people}/:personId`} element={<PersonDetailPage />} />
          <Route path={PATHS.locations} element={<PeoplePage tab="locations" />} />
          <Route path={PATHS.timeline} element={<TimelinePage />} />
          <Route path={PATHS.workspace} element={<WorkspacePage notes={notes} />} />
          {/* Old Exercise 3 hashes (#people) keep working as bookmarks. */}
          <Route path="/people" element={<Navigate to={PATHS.people} replace />} />
          {/* Anything else: same fallback as the vanilla handleHashChange(), but explicit. */}
          <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
        </Routes>
      </main>
      <Footer />
      {import.meta.env.DEV && <DevPanel />}
    </>
  );
}
