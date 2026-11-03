import { useEffect } from "react";
import { NAV_ITEMS } from "./paths.ts";

const APP_NAME = "Project ReMotion";

// "/team/people" belongs to the "/team" nav item, so match on the path prefix.
export function titleForPath(pathname: string): string {
  const navItem = NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
  return navItem ? `${navItem.label} – ${APP_NAME}` : APP_NAME;
}

// document.title lives outside React, so it cannot be part of the rendered
// output. An effect with [title] keeps it in sync after each commit where the
// title actually changed.
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
