import { NavLink } from "react-router";
import { PATHS } from "../../shared/routing/paths.ts";

export type PeopleTab = "people" | "locations";

const TABS: ReadonlyArray<{ tab: PeopleTab; label: string; path: string }> = [
  { tab: "people", label: "People", path: PATHS.people },
  { tab: "locations", label: "Locations", path: PATHS.locations },
];

// Each tab is a real link to its own URL; the router decides which one is
// active, so the highlighted tab can never disagree with the address bar.
export function TabBar() {
  return (
    <div className="tab-bar">
      {TABS.map((item) => (
        <NavLink
          key={item.tab}
          to={item.path}
          className={({ isActive }) => (isActive ? "tab-btn active" : "tab-btn")}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
