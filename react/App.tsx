import type { ReactNode } from "react";
import { Header } from "./components/Header.tsx";
import { Footer } from "./components/Footer.tsx";
import { CaseDataProvider } from "./data/CaseDataContext.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { PeoplePage } from "./pages/PeoplePage.tsx";
import { StubPage } from "./pages/StubPage.tsx";
import { useHashRoute, type ViewName } from "./routing/useHashRoute.ts";

// One entry per route. Typing the record as Record<ViewName, ...> makes the
// compiler fail if a sixth view is added to ViewName without a page here.
const PAGES: Record<ViewName, () => ReactNode> = {
  dashboard: () => <DashboardPage />,
  evidence: () => <StubPage title="Evidence Catalogue" migratedInExercise={4} />,
  people: () => <PeoplePage />,
  timeline: () => <StubPage title="Investigation Timeline" migratedInExercise={5} />,
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
