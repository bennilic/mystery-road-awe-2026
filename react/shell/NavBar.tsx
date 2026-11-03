import { NavLink } from "react-router";
import { NAV_ITEMS } from "../shared/routing/paths.ts";

export function NavBar() {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          // NavLink hands us isActive from the router, so there is no
          // "current view" value to copy around any more.
          className={({ isActive }) => (isActive ? "nav-btn active" : "nav-btn")}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
