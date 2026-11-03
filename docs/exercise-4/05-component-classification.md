# Exercise 4 — Presentational vs. feature components (Demo 5)

**Rule used:** a component is *presentational* if everything it renders arrives through its props
or `children` (same props in, same output), and it never reads context, fetches, touches
`localStorage` or `window.location`. It is a *feature* (container) component if it knows where
data comes from or how domain data is derived (context, URL, sorting, matching), and hands the
result down as props.

| Component | Kind | Why |
|---|---|---|
| `App` | feature (composition root) | Reads the current route, chooses the page, mounts the data provider |
| `CaseDataProvider` | feature (infrastructure) | Fetches the five JSON files, owns loading/error/ready |
| `Header`, `Footer`, `HowToUseCard`, `StubPage` | presentational | Static markup / props only |
| `NavBar` | presentational (with one callback-style dependency) | Gets `currentView` as a prop; the click calls `navigateTo`, a plain function — becomes a router link in Demo 8 |
| `DashboardPage`, `DashboardContent` | feature | Read context and localStorage, derive counts and recent lists |
| `CaseSummaryCard`, `StatGrid`, `StatCard`, `ReviewProgress`, `RecentEvidenceList`, `RecentTimelineList` | presentational | Props in, markup out |
| `PeoplePage`, `PeopleContent` | feature | Read context and the URL, match evidence to people |
| `PeopleLocationsView` | presentational | **Result of the split.** Tab, lists and counts all via props |
| `TabBar`, `Card`, `PersonCard`, `LocationCard`, `ResponsibilityList` | presentational | Props / children only |
| `TimelinePage`, `TimelineContent` | feature | Read context, sort events, resolve location labels, build filter options |
| `TimelineView` | presentational | **Result of the split.** Receives sorted entries and option lists |
| `TimelineItem`, `TimelineToolbar`, `FilterSelect` | presentational | Props only (toolbar controls are uncontrolled until Exercise 5) |
| `CaseBadge`, `KeyedPersonList` (sandbox) | presentational | Throwaway demos, not mounted in the app |

## The split

`PeoplePage` used to do four jobs in one tree: gate on loading/error, read the tab from the URL,
count evidence per person, and lay out tab bar plus cards. It is now:

- `PeopleContent` (feature): data and URL in, `activeTab` / `people` / `locations` /
  `evidenceCountByPersonId` out.
- `PeopleLocationsView` (presentational): layout and conditional rendering only.

`TimelinePage` got the same treatment (`TimelineContent` and `TimelineView`).
