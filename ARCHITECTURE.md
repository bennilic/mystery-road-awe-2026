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
      RecentEvidenceList.tsx  RecentTimelineList.tsx  HowToUseCard.tsx  bookmarks.ts
    people-locations/
      PeoplePage.tsx (feature)  PeopleLocationsView.tsx (presentational)
      PersonCard.tsx  LocationCard.tsx  Card.tsx  TabBar.tsx  ResponsibilityList.tsx
    timeline/
      TimelinePage.tsx (feature)  TimelineView.tsx (presentational)
      TimelineItem.tsx  TimelineToolbar.tsx
  shared/                       used by more than one feature
    data/CaseDataContext.tsx
    routing/useHashRoute.ts
  sandbox/                      throwaway teaching demos, not part of the app
```

Domain types and helpers (`js/types.ts`, `js/lookup.ts`) are still imported from the vanilla
`js/` folder, because the vanilla app keeps running next to the React one (`index.html` vs
`react.html`).

### Rule: shared vs. feature-local

1. A file lives **inside the one feature that uses it**, however generic it looks. Example:
   `Card.tsx` is a generic children-based box, but only `people-locations` uses it, so it stays
   in `features/people-locations/`.
2. It moves to **`shared/`** when a **second feature** needs it (or when it is app-wide
   infrastructure). Examples: `CaseDataContext.tsx` is read by Dashboard, People & Locations and
   Timeline, so it lives in `shared/data/`; `useHashRoute.ts` is used by the shell (NavBar,
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
