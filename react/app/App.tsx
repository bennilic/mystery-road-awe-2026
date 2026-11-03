import { Navigate, Route, Routes } from "react-router";
import { Header } from "../shell/Header.tsx";
import { Footer } from "../shell/Footer.tsx";
import { StubPage } from "../shell/StubPage.tsx";
import { CaseDataProvider } from "../shared/data/CaseDataContext.tsx";
import { PATHS } from "../shared/routing/paths.ts";
import { DashboardPage } from "../features/dashboard/DashboardPage.tsx";
import { PeoplePage } from "../features/people-locations/PeoplePage.tsx";
import { TimelinePage } from "../features/timeline/TimelinePage.tsx";

export function App() {
  return (
    <CaseDataProvider>
      <Header />
      <main id="app" className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to={PATHS.dashboard} replace />} />
          <Route path={PATHS.dashboard} element={<DashboardPage />} />
          <Route
            path={PATHS.evidence}
            element={
              <StubPage title="Evidence Catalogue" migratedInExercise={5} vanillaView="evidence" />
            }
          />
          <Route path={PATHS.team} element={<Navigate to={PATHS.people} replace />} />
          <Route path={PATHS.people} element={<PeoplePage tab="people" />} />
          <Route path={PATHS.locations} element={<PeoplePage tab="locations" />} />
          <Route path={PATHS.timeline} element={<TimelinePage />} />
          <Route
            path={PATHS.workspace}
            element={
              <StubPage
                title="Investigator Workspace"
                migratedInExercise={5}
                vanillaView="workspace"
              />
            }
          />
          {/* Old Exercise 3 hashes (#people) keep working as bookmarks. */}
          <Route path="/people" element={<Navigate to={PATHS.people} replace />} />
          {/* Anything else: same fallback as the vanilla handleHashChange(), but explicit. */}
          <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
        </Routes>
      </main>
      <Footer />
    </CaseDataProvider>
  );
}
