import { useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Header } from "../shell/Header.tsx";
import { Footer } from "../shell/Footer.tsx";
import { CaseDataProvider } from "../shared/data/CaseDataContext.tsx";
import { toggleBookmarkId } from "../shared/bookmarks/toggleBookmarkId.ts";
import { readBookmarkIds, writeBookmarkIds } from "../shared/storage/bookmarkStorage.ts";
import { describeStorageFailure } from "../shared/storage/describeStorageFailure.ts";
import { PATHS } from "../shared/routing/paths.ts";
import { DashboardPage } from "../features/dashboard/DashboardPage.tsx";
import { PeoplePage } from "../features/people-locations/PeoplePage.tsx";
import { PersonDetailPage } from "../features/people-locations/PersonDetailPage.tsx";
import { EvidencePage } from "../features/evidence/EvidencePage.tsx";
import { WorkspacePage } from "../features/workspace/WorkspacePage.tsx";
import { TimelinePage } from "../features/timeline/TimelinePage.tsx";

export function App() {
  return (
    <CaseDataProvider>
      <AppBody />
    </CaseDataProvider>
  );
}

// Lowest common ancestor of every component that reads or changes bookmarks:
// the Dashboard, Evidence and Workspace pages are siblings under <Routes>, so
// the bookmark state lives here, one level above all three.
function AppBody() {
  const [bookmarkedIds, setBookmarkedIds] = useState(readBookmarkIds);
  const [bookmarkNotice, setBookmarkNotice] = useState<string | null>(null);

  function handleToggleBookmark(evidenceId: string) {
    const nextIds = toggleBookmarkId(bookmarkedIds, evidenceId);
    setBookmarkedIds(nextIds);
    try {
      writeBookmarkIds(nextIds);
    } catch (error) {
      setBookmarkNotice(describeStorageFailure("Your bookmark", error));
    }
  }

  return (
    <>
      <Header />
      <main id="app" className="app-main">
        {bookmarkNotice && <p role="alert">{bookmarkNotice}</p>}
        <Routes>
          <Route path="/" element={<Navigate to={PATHS.dashboard} replace />} />
          <Route path={PATHS.dashboard} element={<DashboardPage bookmarkedIds={bookmarkedIds} />} />
          <Route
            path={PATHS.evidence}
            element={
              <EvidencePage bookmarkedIds={bookmarkedIds} onToggleBookmark={handleToggleBookmark} />
            }
          />
          <Route path={PATHS.team} element={<Navigate to={PATHS.people} replace />} />
          <Route path={PATHS.people} element={<PeoplePage tab="people" />} />
          <Route path={`${PATHS.people}/:personId`} element={<PersonDetailPage />} />
          <Route path={PATHS.locations} element={<PeoplePage tab="locations" />} />
          <Route path={PATHS.timeline} element={<TimelinePage />} />
          <Route path={PATHS.workspace} element={<WorkspacePage bookmarkedIds={bookmarkedIds} />} />
          {/* Old Exercise 3 hashes (#people) keep working as bookmarks. */}
          <Route path="/people" element={<Navigate to={PATHS.people} replace />} />
          {/* Anything else: same fallback as the vanilla handleHashChange(), but explicit. */}
          <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
