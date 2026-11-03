import type { ReactNode } from "react";
import { Header } from "../shell/Header.tsx";
import { Footer } from "../shell/Footer.tsx";
import { CaseDataProvider } from "../shared/data/CaseDataContext.tsx";
import { DashboardPage } from "../features/dashboard/DashboardPage.tsx";
import { PeoplePage } from "../features/people-locations/PeoplePage.tsx";
import { TimelinePage } from "../features/timeline/TimelinePage.tsx";
import { StubPage } from "../shell/StubPage.tsx";
import { useHashRoute, type ViewName } from "../shared/routing/useHashRoute.ts";

// One entry per route. Typing the record as Record<ViewName, ...> makes the
// compiler fail if a sixth view is added to ViewName without a page here.
const PAGES: Record<ViewName, () => ReactNode> = {
  dashboard: () => <DashboardPage />,
  evidence: () => <StubPage title="Evidence Catalogue" migratedInExercise={4} />,
  people: () => <PeoplePage />,
  timeline: () => <TimelinePage />,
  workspace: () => <StubPage title="Investigator Workspace" migratedInExercise={5} />,
};

export function App() {
  const currentView = useHashRoute();

  return (
    <CaseDataProvider>
      <Header currentView={currentView} />
      <main id="app" className="app-main">
        {PAGES[currentView]()}
      </main>
      <Footer />
    </CaseDataProvider>
  );
}
