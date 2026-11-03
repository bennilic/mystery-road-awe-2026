// Single list of every URL the app answers. Components link to PATHS.x instead
// of retyping "/team/people", so renaming a URL is a one-line change and a
// typo is a compile error.
export const PATHS = {
  dashboard: "/dashboard",
  evidence: "/evidence",
  team: "/team",
  people: "/team/people",
  locations: "/team/locations",
  timeline: "/timeline",
  workspace: "/workspace",
} as const;

// encodeURIComponent: an id with "/" or "?" in it must not change the route's shape.
export function personPath(personId: string): string {
  return `${PATHS.people}/${encodeURIComponent(personId)}`;
}

export const NAV_ITEMS: ReadonlyArray<{ path: string; label: string }> = [
  { path: PATHS.dashboard, label: "Dashboard" },
  { path: PATHS.evidence, label: "Evidence" },
  // "/team" (not "/team/people") so the item stays active on the Locations tab too.
  { path: PATHS.team, label: "People & Locations" },
  { path: PATHS.timeline, label: "Timeline" },
  { path: PATHS.workspace, label: "Workspace" },
];
