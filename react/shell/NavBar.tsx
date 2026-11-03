import { VIEWS, navigateTo, type ViewName } from "../shared/routing/useHashRoute.ts";

interface NavBarProps {
  currentView: ViewName;
}

export function NavBar({ currentView }: NavBarProps) {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          className={view.id === currentView ? "nav-btn active" : "nav-btn"}
          onClick={() => navigateTo(view.id)}
        >
          {view.label}
        </button>
      ))}
    </nav>
  );
}
