# Architecture

## React source layout (`react/`) — added in Exercise 4, Demo 6

The React app is organised **by feature**, not by file type.

```
react/
  main.tsx                      entry point mounted by react.html
  app/
    App.tsx                     composition root: provider + shell + route table
  shell/                        the frame around every page
    Header.tsx  NavBar.tsx  Footer.tsx  StubPage.tsx
  features/
    dashboard/                  everything only the Dashboard needs
      DashboardPage.tsx  StatGrid.tsx  CaseSummaryCard.tsx  ReviewProgress.tsx
      RecentEvidenceList.tsx  RecentTimelineList.tsx  HowToUseCard.tsx
    people-locations/
      PeoplePage.tsx PersonDetailPage.tsx (feature)  PeopleLocationsView.tsx PersonDetailView.tsx (presentational)
      PersonCard.tsx  LocationCard.tsx  Card.tsx  TabBar.tsx  ResponsibilityList.tsx
    timeline/
      TimelinePage.tsx (feature)  TimelineView.tsx (presentational)
      TimelineItem.tsx  TimelineToolbar.tsx
    evidence/                   (Exercise 5) catalogue + detail panel
      EvidencePage.tsx (feature)  EvidenceToolbar.tsx  EvidenceCard.tsx  EvidenceDetail.tsx
      filterEvidence.ts  evidenceFiltersReducer.ts
    workspace/                  (Exercise 5) bookmarks list, notes list, hypothesis form
      WorkspacePage.tsx (feature)  BookmarkedEvidenceList.tsx  NotesList.tsx  HypothesisForm.tsx
  shared/                       used by more than one feature
    api/                        (Exercise 6) caseApi.ts (urls, raw fetch, shapes)  simulation.ts (dev ?delay/?fail/?empty)
    data/CaseDataContext.tsx  CaseDataGate.tsx  useAsyncResource.ts (loading/error/abort hook)
    routing/paths.ts
    bookmarks/                  BookmarksContext.tsx  toggleBookmarkId.ts  selectBookmarkedEvidence.ts
    evidence/reviewEdits.ts
    storage/                    localStorage readers/writers (bookmarks, notes, hypothesis)
    components/                 Badge.tsx  evidenceBadges.ts
  shell/DevPanel.tsx            (Exercise 6) dev-only controls for the backend simulation
  sandbox/                      throwaway teaching demos, not part of the app
```

### State ownership (Exercise 5)

| State | Owner | Reaches consumers by |
|-------|-------|----------------------|
| Bookmark ids | the server (Exercise 7); the tab keeps only the last received copy in `useWorkspaceSocket` | Context (`useBookmarks`) |
| Notes, review edits | `AppBody` in `app/App.tsx` (`useState`) | props + callbacks |
| Evidence filters/sort | `EvidenceContent` (`useReducer`) | props to the toolbar |
| Hypothesis form | `HypothesisForm` (`useState` object) | local |
| Open evidence item | the URL (`?open=E01`) | `useSearchParams` |
| Filtered/sorted list, bookmark count, reviewed count | derived during render, never stored | - |

Domain types and helpers (`js/types.ts`, `js/lookup.ts`) are still imported from the vanilla
`js/` folder, because the vanilla app keeps running next to the React one (`index.html` vs
`react.html`).

### Data access layers (Exercise 6)

```
component (UI only)  ->  useCaseData() / CaseDataGate        react/shared/data/CaseDataContext.tsx, CaseDataGate.tsx
application logic    ->  useAsyncResource(load, key)         react/shared/data/useAsyncResource.ts
API access           ->  fetchEvidence(...), fetchJson       react/shared/api/caseApi.ts   (the only file that calls fetch)
backend (dev only)   ->  GET /api/<resource>                 server/app.ts, reads public/data/*.json
```

Backend urls or response shapes change: edit `caseApi.ts` (and the types in `js/types.ts`); the hook and components do not change.

### Live layer (Exercise 7)

```
protocol/workspaceProtocol.ts      ClientMessage / ServerMessage, imported by BOTH sides (types only)
server/realtime.ts                 WebSocket upgrade on /ws; per message: validate -> session -> broadcast
server/validateClientMessage.ts    the only place raw frames become ClientMessage (never throws)
server/workspaceSession.ts         connections + the in-memory bookmark Set; the only broadcast loop
react/shared/live/ReconnectingSocket.ts   WebSocket + status + one retry (no React, unit-tested)
react/shared/live/useWorkspaceSocket.ts   React state from ServerMessages; sendMessage; reconnect
react/shared/live/LiveWorkspaceContext.tsx  one socket for the whole app
react/shared/bookmarks/BookmarksContext.tsx useBookmarks(): the server's set, no local copy
```

Bookmark ids are no longer owned by a React `useState` with `localStorage` (the state table above
described Exercise 5): the server owns them and every tab renders the latest set it was sent.

### Rule: shared vs. feature-local

1. A file lives **inside the one feature that uses it**, however generic it looks. Example:
   `Card.tsx` is a generic children-based box, but only `people-locations` uses it, so it stays
   in `features/people-locations/`.
2. It moves to **`shared/`** when a **second feature** needs it (or when it is app-wide
   infrastructure). Examples: `CaseDataContext.tsx` is read by Dashboard, People & Locations and
   Timeline, so it lives in `shared/data/`; `paths.ts` (route constants) is used by the shell (NavBar,
   App) and by the Dashboard's HowToUseCard, so it lives in `shared/routing/`.
3. Dependencies point one way: `app` -> `features` -> `shared`. A feature never imports from
   another feature; if two features need the same thing, that is the signal to promote it to
   `shared/`.
4. `shell/` is not a feature: it is the frame (header, navigation, footer) that
   hosts the features.

Why by feature for this app: the three migrated views barely share UI (a person card is of no
use on the timeline) but each view's files change together, so a change to the Timeline touches
one folder. A by-type layout (`components/`, `hooks/`, `pages/`) would put 20 unrelated components
in one folder.

See also: `docs/exercise-3/03-component-hierarchy.md` (planned tree) and
`docs/exercise-4/05-component-classification.md` (presentational vs. feature).
