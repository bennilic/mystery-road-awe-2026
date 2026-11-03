import { useSyncExternalStore } from "react";

export type ViewName = "dashboard" | "evidence" | "people" | "timeline" | "workspace";

export const VIEWS: ReadonlyArray<{ id: ViewName; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "evidence", label: "Evidence" },
  { id: "people", label: "People & Locations" },
  { id: "timeline", label: "Timeline" },
  { id: "workspace", label: "Workspace" },
];

function isViewName(value: string): value is ViewName {
  return VIEWS.some((view) => view.id === value);
}

// Same contract as the vanilla handleHashChange(): anything that is not one
// of the five known views (empty hash, typo, stale bookmark) falls back to
// the dashboard instead of rendering a blank page.
function parseView(hash: string): ViewName {
  const raw = hash.replace("#", "");
  return isViewName(raw) ? raw : "dashboard";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

// The URL hash is the single source of truth (same as vanilla), but instead
// of copying it into a mutable `state.currentPage`, React subscribes to it:
// useSyncExternalStore re-renders the shell whenever the hash changes, and
// the current view is derived on every render, never stored twice.
export function useHashRoute(): ViewName {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseView(hash);
}

export function navigateTo(view: ViewName): void {
  window.location.hash = view;
}
